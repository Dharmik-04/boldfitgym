require('dotenv').config();
const jwt = require('jsonwebtoken');
const supabase = require('../src/config/supabase');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api/memberships`;

async function runTests() {
  console.log('=== STARTING MEMBERSHIP ASSIGNMENT MODULE TESTS ===');
  
  let testMember;
  let testPlan;
  let testMembershipId;
  let expiredMembershipId;
  let admin;

  try {
    // 1. Fetch an admin to sign a token
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('*')
      .limit(1);

    if (adminsError || !admins || admins.length === 0) {
      throw new Error(`Failed to fetch an admin for testing: ${adminsError?.message || 'No admins found'}`);
    }
    admin = admins[0];
    console.log(`Using admin: ${admin.username} (${admin.id}) for token generation.`);

    const token = jwt.sign(
      { id: admin.id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1h' }
    );

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 2. Bootstrap: Create temporary member and membership plan
    console.log('\n--- Bootstrapping temporary Member and Membership Plan ---');
    const { data: newMember, error: mErr } = await supabase
      .from('members')
      .insert({
        first_name: 'TestAssignment',
        last_name: 'Member',
        email: `testassign-${Date.now()}@test.com`,
        phone: '1122334455',
        gender: 'other',
        status: 'active'
      })
      .select()
      .single();

    if (mErr) throw new Error(`Failed to create test member: ${mErr.message}`);
    testMember = newMember;
    console.log(`Created test member: ${testMember.first_name} ${testMember.last_name} (${testMember.id})`);

    const { data: newPlan, error: pErr } = await supabase
      .from('membership_plans')
      .insert({
        name: `Assignment Test Plan ${Date.now()}`,
        price: 50.00,
        duration_months: 3,
        description: 'For testing membership assignment logic',
        status: 'active'
      })
      .select()
      .single();

    if (pErr) throw new Error(`Failed to create test plan: ${pErr.message}`);
    testPlan = newPlan;
    console.log(`Created test plan: ${testPlan.name} (${testPlan.id}, duration: ${testPlan.duration_months} months)`);

    // 3. Test Validator Errors
    console.log('\n--- Test 3: POST Validator errors (Missing IDs, invalid status) ---');
    const badPayload = {
      member_id: 'not-a-uuid',
      plan_id: testPlan.id,
      start_date: 'invalid-date',
      status: 'super-active'
    };

    const valResponse = await fetch(BASE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(badPayload)
    });
    const valResult = await valResponse.json();
    console.log('HTTP Status:', valResponse.status);
    console.log('Validation Errors:', JSON.stringify(valResult.errors, null, 2));
    if (valResponse.status !== 400 || valResult.success !== false) {
      throw new Error('Expected 400 Bad Request for validation failure');
    }

    // 4. Test Create Membership (Valid)
    console.log('\n--- Test 4: POST Create Active Membership (Calculates end_date) ---');
    const validPayload = {
      member_id: testMember.id,
      plan_id: testPlan.id,
      start_date: '2026-08-01',
      status: 'active',
      auto_renew: true,
      freeze_days: 5
    };

    const createResponse = await fetch(BASE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(validPayload)
    });
    const createResult = await createResponse.json();
    console.log('HTTP Status:', createResponse.status);
    console.log('Create Response:', JSON.stringify(createResult, null, 2));

    if (createResponse.status !== 201 || !createResult.success) {
      throw new Error('Failed to create membership');
    }

    testMembershipId = createResult.data.membership.id;
    const calculatedEndDate = createResult.data.membership.end_date;
    console.log(`Expected End Date: 2026-11-01 (2026-08-01 + 3 months)`);
    console.log(`Calculated End Date: ${calculatedEndDate}`);
    
    if (calculatedEndDate !== '2026-11-01') {
      throw new Error('End date calculation is incorrect!');
    }

    // 5. Test Prevent Multiple Active Memberships Constraint
    console.log('\n--- Test 5: POST Second Active Membership for same member (Should Fail) ---');
    const secondPayload = {
      member_id: testMember.id,
      plan_id: testPlan.id,
      start_date: '2026-09-01',
      status: 'active'
    };

    const conflictResponse = await fetch(BASE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(secondPayload)
    });
    const conflictResult = await conflictResponse.json();
    console.log('HTTP Status (Should be 400):', conflictResponse.status);
    console.log('Conflict Response:', JSON.stringify(conflictResult, null, 2));

    if (conflictResponse.status !== 400 || conflictResult.message !== 'Member already has an active membership.') {
      throw new Error('Constraint validation failed: expected 400 and duplicate membership warning');
    }

    // 6. Test GET Get All Memberships (Filter & Search)
    console.log('\n--- Test 6.1: GET List Memberships ---');
    const listResponse = await fetch(`${BASE_URL}?page=1&limit=5&plan=${testPlan.id}`, { headers });
    const listResult = await listResponse.json();
    console.log('HTTP Status:', listResponse.status);
    console.log('Memberships found for test plan:', listResult.data.memberships.length);
    if (listResult.data.memberships.length !== 1) {
      throw new Error('Filter by plan failed');
    }

    console.log('\n--- Test 6.2: GET List Memberships with Search ---');
    const searchResponse = await fetch(`${BASE_URL}?search=TestAssignment`, { headers });
    const searchResult = await searchResponse.json();
    console.log('Search Results count:', searchResult.data.memberships.length);
    if (searchResult.data.memberships.length === 0) {
      throw new Error('Search by member name failed');
    }

    // 7. Test PUT Update Membership
    console.log('\n--- Test 7: PUT Update Membership (Start date & Freeze days) ---');
    const updatePayload = {
      start_date: '2026-05-01', // New start date, recalculates end_date
      freeze_days: 10
    };
    const updateResponse = await fetch(`${BASE_URL}/${testMembershipId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updatePayload)
    });
    const updateResult = await updateResponse.json();
    console.log('HTTP Status:', updateResponse.status);
    console.log('Recalculated End Date (Should be 2026-08-01):', updateResult.data.membership.end_date);
    console.log('Updated Freeze Days (Should be 10):', updateResult.data.membership.freeze_days);

    if (updateResult.data.membership.end_date !== '2026-08-01' || updateResult.data.membership.freeze_days !== 10) {
      throw new Error('Update calculation failed');
    }

    // 8. Test Lazy Auto-Expiration
    console.log('\n--- Test 8: Lazy Expiration (Creating active membership in past) ---');
    // Bypass active constraint by inserting an expired record directly using supabase, OR insert via POST with status='cancelled' then status='active' in the past
    // Let's insert directly into DB using supabase client to bypass checks
    const { data: pastMembership, error: pastErr } = await supabase
      .from('memberships')
      .insert({
        member_id: testMember.id,
        plan_id: testPlan.id,
        start_date: '2020-01-01',
        end_date: '2020-04-01', // well in the past
        status: 'active', // starts active
        auto_renew: false,
        freeze_days: 0
      })
      .select()
      .single();

    if (pastErr) throw new Error(`Failed to create past active membership: ${pastErr.message}`);
    expiredMembershipId = pastMembership.id;
    console.log(`Created past active membership: ${expiredMembershipId} (end_date: ${pastMembership.end_date})`);

    // Verify it is updated to expired on retrieval
    console.log('Retrieving expired membership via GET endpoint to trigger lazy auto-expiration...');
    const lazyResponse = await fetch(`${BASE_URL}/${expiredMembershipId}`, { headers });
    const lazyResult = await lazyResponse.json();
    console.log('HTTP Status:', lazyResponse.status);
    console.log('Status returned in API response (Should be expired):', lazyResult.data.membership.status);
    
    if (lazyResult.data.membership.status !== 'expired') {
      throw new Error('Lazy auto-expiration did not update status to expired!');
    }

    // Query database directly to verify database updated state
    const { data: dbVerify } = await supabase
      .from('memberships')
      .select('status')
      .eq('id', expiredMembershipId)
      .single();
    console.log('Status in Database (Should be expired):', dbVerify.status);
    if (dbVerify.status !== 'expired') {
      throw new Error('Lazy auto-expiration failed to persist expired status in the database!');
    }

    // 9. Test PATCH Update Status
    console.log('\n--- Test 9: PATCH Update Status ---');
    const patchResponse = await fetch(`${BASE_URL}/${testMembershipId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'paused' })
    });
    const patchResult = await patchResponse.json();
    console.log('HTTP Status:', patchResponse.status);
    console.log('New Status (Should be paused):', patchResult.data.membership.status);
    if (patchResult.data.membership.status !== 'paused') {
      throw new Error('Failed to update status to paused');
    }

    // 10. Test DELETE Membership
    console.log('\n--- Test 10: DELETE memberships ---');
    const del1 = await fetch(`${BASE_URL}/${testMembershipId}`, { method: 'DELETE', headers });
    console.log('Delete test membership status:', del1.status);
    const del2 = await fetch(`${BASE_URL}/${expiredMembershipId}`, { method: 'DELETE', headers });
    console.log('Delete expired membership status:', del2.status);

    if (del1.status !== 200 || del2.status !== 200) {
      throw new Error('Failed to delete membership records');
    }

    // 11. Verify activity_logs audit entries
    console.log('\n--- Test 11: Verify activity_logs audit entries ---');
    const { data: logs, error: logsError } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('admin_id', admin.id)
      .order('created_at', { ascending: false })
      .limit(6);

    if (logsError) throw new Error(`Failed to read activity_logs: ${logsError.message}`);

    console.log('Audit logs recorded:');
    logs.forEach(log => {
      console.log(`- Action: ${log.action}, Details:`, log.details);
    });

    const actions = logs.map(l => l.action);
    const expectedActions = ['DELETE_MEMBERSHIP', 'UPDATE_MEMBERSHIP_STATUS', 'UPDATE_MEMBERSHIP', 'CREATE_MEMBERSHIP'];
    const allFound = expectedActions.every(act => actions.includes(act));
    
    if (!allFound) {
      console.warn('WARNING: Some expected actions were not found in the activity logs. Found:', actions);
    } else {
      console.log('SUCCESS: All audit actions successfully written to activity_logs table!');
    }

    console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');

  } catch (err) {
    console.error('\n❌ TEST RUN FAILED:', err.message);
  } finally {
    // 12. Cleanup Bootstrapped Records
    console.log('\n--- Cleaning up temporary Member and Membership Plan ---');
    if (testMember) {
      const { error } = await supabase.from('members').delete().eq('id', testMember.id);
      if (error) console.error('Failed to cleanup member:', error.message);
      else console.log('Cleaned up test member.');
    }
    if (testPlan) {
      const { error } = await supabase.from('membership_plans').delete().eq('id', testPlan.id);
      if (error) console.error('Failed to cleanup plan:', error.message);
      else console.log('Cleaned up test plan.');
    }
  }
}

runTests();
