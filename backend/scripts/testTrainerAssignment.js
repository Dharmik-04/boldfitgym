require('dotenv').config();
const jwt = require('jsonwebtoken');
const supabase = require('../src/config/supabase');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api/trainer-assignments`;

async function runTests() {
  console.log('=== STARTING TRAINER ASSIGNMENT MODULE TESTS ===');
  
  let testMember;
  let testTrainer;
  let testAssignmentId;
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

    // 2. Bootstrap: Create temporary member and trainer
    console.log('\n--- Bootstrapping temporary Member and Trainer ---');
    const { data: newMember, error: mErr } = await supabase
      .from('members')
      .insert({
        first_name: 'TestAssignmentMember',
        last_name: 'Gymgoer',
        email: `gymassign-${Date.now()}@test.com`,
        phone: '11223344',
        gender: 'female',
        status: 'active'
      })
      .select()
      .single();

    if (mErr) throw new Error(`Failed to create test member: ${mErr.message}`);
    testMember = newMember;
    console.log(`Created test member: ${testMember.first_name} (${testMember.id})`);

    const { data: newTrainer, error: tErr } = await supabase
      .from('trainers')
      .insert({
        first_name: 'Coach',
        last_name: 'Assignee',
        email: `coachassign-${Date.now()}@test.com`,
        phone: '87654321',
        specialization: 'Powerlifting',
        status: 'active'
      })
      .select()
      .single();

    if (tErr) throw new Error(`Failed to create test trainer: ${tErr.message}`);
    testTrainer = newTrainer;
    console.log(`Created test trainer: ${testTrainer.first_name} (${testTrainer.id})`);

    // 3. Test Validator Errors (Negative dates)
    console.log('\n--- Test 3: POST Validator errors (End date before Start date) ---');
    const badPayload = {
      member_id: testMember.id,
      trainer_id: testTrainer.id,
      start_date: '2026-08-10',
      end_date: '2026-08-01', // earlier than start_date
      status: 'active'
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
      throw new Error('Expected 400 Bad Request for date correlation failure');
    }

    // 4. Test Create Assignment (Valid)
    console.log('\n--- Test 4: POST Create Assignment ---');
    const validPayload = {
      member_id: testMember.id,
      trainer_id: testTrainer.id,
      start_date: '2026-08-01',
      end_date: '2026-12-01',
      status: 'active'
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
      throw new Error('Failed to create trainer assignment');
    }

    testAssignmentId = createResult.data.assignment.id;
    console.log('Assignment created successfully with ID:', testAssignmentId);

    // 5. Test Duplicate Active Assignment Constraint
    console.log('\n--- Test 5: POST Second Active Assignment for same member (Should Fail) ---');
    const duplicatePayload = {
      member_id: testMember.id,
      trainer_id: testTrainer.id,
      start_date: '2026-09-01',
      status: 'active'
    };

    const conflictResponse = await fetch(BASE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(duplicatePayload)
    });
    const conflictResult = await conflictResponse.json();
    console.log('HTTP Status (Should be 400):', conflictResponse.status);
    console.log('Conflict Response:', JSON.stringify(conflictResult, null, 2));

    if (conflictResponse.status !== 400 || conflictResult.success !== false) {
      throw new Error('Expected 400 Bad Request for duplicate active trainer assignment');
    }

    // 6. Test GET Get All Assignments (Filters and Searches)
    console.log('\n--- Test 6.1: GET List Assignments by trainer and status ---');
    const listResponse = await fetch(`${BASE_URL}?status=active&trainer_id=${testTrainer.id}`, { headers });
    const listResult = await listResponse.json();
    console.log('HTTP Status:', listResponse.status);
    console.log('Assignments found:', listResult.data.assignments.length);
    if (listResult.data.assignments.length !== 1) {
      throw new Error('Filter by trainer_id/status failed');
    }

    console.log('\n--- Test 6.2: GET List Assignments with Search by Member ---');
    const searchMemResponse = await fetch(`${BASE_URL}?member=TestAssignmentMember`, { headers });
    const searchMemResult = await searchMemResponse.json();
    console.log('HTTP Status:', searchMemResponse.status);
    console.log('Assignments found searching member name:', searchMemResult.data.assignments.length);
    if (searchMemResult.data.assignments.length === 0) {
      throw new Error('Search by member failed');
    }

    console.log('\n--- Test 6.3: GET List Assignments with Search by Trainer ---');
    const searchTrainerResponse = await fetch(`${BASE_URL}?trainer=Coach`, { headers });
    const searchTrainerResult = await searchTrainerResponse.json();
    console.log('HTTP Status:', searchTrainerResponse.status);
    console.log('Assignments found searching trainer name:', searchTrainerResult.data.assignments.length);
    if (searchTrainerResult.data.assignments.length === 0) {
      throw new Error('Search by trainer failed');
    }

    // 7. Test PUT Update Assignment (Validate date checks during update)
    console.log('\n--- Test 7.1: PUT Update Assignment (Invalid End Date) ---');
    const badUpdatePayload = {
      end_date: '2026-07-01' // earlier than start_date (2026-08-01)
    };
    const badUpdateResponse = await fetch(`${BASE_URL}/${testAssignmentId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(badUpdatePayload)
    });
    const badUpdateResult = await badUpdateResponse.json();
    console.log('HTTP Status (Should be 400):', badUpdateResponse.status);
    console.log('Error Message:', badUpdateResult.message);
    if (badUpdateResponse.status !== 400) {
      throw new Error('Expected 400 Bad Request for invalid end_date update');
    }

    console.log('\n--- Test 7.2: PUT Update Assignment (Valid End Date) ---');
    const goodUpdatePayload = {
      end_date: '2026-11-01'
    };
    const goodUpdateResponse = await fetch(`${BASE_URL}/${testAssignmentId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(goodUpdatePayload)
    });
    const goodUpdateResult = await goodUpdateResponse.json();
    console.log('HTTP Status:', goodUpdateResponse.status);
    console.log('Updated End Date (Should be 2026-11-01):', goodUpdateResult.data.assignment.end_date);
    if (goodUpdateResult.data.assignment.end_date !== '2026-11-01') {
      throw new Error('Update end date failed');
    }

    // 8. Test PATCH Update Status
    console.log('\n--- Test 8: PATCH Update Assignment Status ---');
    const patchResponse = await fetch(`${BASE_URL}/${testAssignmentId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'completed' })
    });
    const patchResult = await patchResponse.json();
    console.log('HTTP Status:', patchResponse.status);
    console.log('New Status (Should be completed):', patchResult.data.assignment.status);
    if (patchResult.data.assignment.status !== 'completed') {
      throw new Error('Failed to update status to completed');
    }

    // 9. Test DELETE Assignment
    console.log('\n--- Test 9: DELETE Assignment ---');
    const deleteResponse = await fetch(`${BASE_URL}/${testAssignmentId}`, {
      method: 'DELETE',
      headers
    });
    console.log('Delete status:', deleteResponse.status);
    if (deleteResponse.status !== 200) {
      throw new Error('Failed to delete trainer assignment');
    }

    // Verify it is deleted
    const verifyGoneResponse = await fetch(`${BASE_URL}/${testAssignmentId}`, { headers });
    console.log('Get deleted assignment HTTP status (Should be 404):', verifyGoneResponse.status);
    if (verifyGoneResponse.status !== 404) {
      throw new Error('Trainer assignment was not deleted successfully');
    }

    // 10. Verify activity_logs audit entries
    console.log('\n--- Test 10: Verify activity_logs audit entries ---');
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
    const expectedActions = ['DELETE_TRAINER_ASSIGNMENT', 'UPDATE_TRAINER_ASSIGNMENT_STATUS', 'UPDATE_TRAINER_ASSIGNMENT', 'CREATE_TRAINER_ASSIGNMENT'];
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
    // 11. Cleanup Bootstrapped Records
    console.log('\n--- Cleaning up temporary Member and Trainer ---');
    if (testMember) {
      const { error } = await supabase.from('members').delete().eq('id', testMember.id);
      if (error) console.error('Failed to cleanup member:', error.message);
      else console.log('Cleaned up test member.');
    }
    if (testTrainer) {
      const { error } = await supabase.from('trainers').delete().eq('id', testTrainer.id);
      if (error) console.error('Failed to cleanup trainer:', error.message);
      else console.log('Cleaned up test trainer.');
    }
  }
}

runTests();
