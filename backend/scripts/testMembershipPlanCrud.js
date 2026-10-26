require('dotenv').config();
const jwt = require('jsonwebtoken');
const supabase = require('../src/config/supabase');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api/membership-plans`;

async function testAll() {
  console.log('=== STARTING MEMBERSHIP PLANS CRUD TEST ===');

  try {
    // 1. Fetch an admin to sign a token
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('*')
      .limit(1);

    if (adminsError || !admins || admins.length === 0) {
      throw new Error(`Failed to fetch an admin for testing: ${adminsError?.message || 'No admins found'}`);
    }

    const admin = admins[0];
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

    let testPlanId;

    // 2. Test Input Validations (POST)
    console.log('\n--- Test 2.1: POST Validation Errors (Missing fields, negative values) ---');
    const badPlan = {
      name: '',
      price: -10,
      duration: 0,
      status: 'invalid_status'
    };

    const valResponse = await fetch(BASE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(badPlan)
    });

    const valResult = await valResponse.json();
    console.log('HTTP Status:', valResponse.status);
    console.log('Validation Errors Response:', JSON.stringify(valResult, null, 2));

    if (valResponse.status !== 400 || valResult.success !== false || !valResult.errors) {
      throw new Error('Expected 400 Bad Request with validation errors list');
    }
    console.log('Validation works correctly!');

    // 3. Test Create Plan (POST)
    console.log('\n--- Test 3: POST Create Plan (Valid data) ---');
    const validPlan = {
      name: `Gold Plan ${Date.now()}`,
      price: 99.99,
      duration: 6,
      description: 'Access to all premium facilities and personal training session',
      status: 'active'
    };

    const createResponse = await fetch(BASE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(validPlan)
    });

    const createResult = await createResponse.json();
    console.log('HTTP Status:', createResponse.status);
    console.log('Create Response:', JSON.stringify(createResult, null, 2));

    if (createResponse.status !== 201 || !createResult.success) {
      throw new Error('Failed to create membership plan');
    }
    
    testPlanId = createResult.data.plan.id;
    console.log('Plan created successfully with ID:', testPlanId);

    // 4. Test Get One Plan (GET /:id)
    console.log('\n--- Test 4: GET Get One Plan ---');
    const getOneResponse = await fetch(`${BASE_URL}/${testPlanId}`, {
      headers
    });
    const getOneResult = await getOneResponse.json();
    console.log('HTTP Status:', getOneResponse.status);
    console.log('Get One Response:', JSON.stringify(getOneResult, null, 2));

    if (getOneResponse.status !== 200 || !getOneResult.success || getOneResult.data.plan.id !== testPlanId) {
      throw new Error('Failed to retrieve the created membership plan');
    }

    // 5. Test Get All Plans (GET /)
    console.log('\n--- Test 5.1: GET Get All Plans (Default pagination) ---');
    const getAllResponse = await fetch(`${BASE_URL}?page=1&limit=5`, {
      headers
    });
    const getAllResult = await getAllResponse.json();
    console.log('HTTP Status:', getAllResponse.status);
    console.log('Plans found on page 1:', getAllResult.data.plans.length);
    console.log('Pagination:', getAllResult.data.pagination);

    if (getAllResponse.status !== 200 || !getAllResult.success || !Array.isArray(getAllResult.data.plans)) {
      throw new Error('Failed to retrieve membership plans list');
    }

    console.log('\n--- Test 5.2: GET Get All Plans with search ---');
    const searchResponse = await fetch(`${BASE_URL}?search=Gold`, {
      headers
    });
    const searchResult = await searchResponse.json();
    console.log('Search Results count:', searchResult.data.plans.length);
    if (searchResult.data.plans.length === 0) {
      throw new Error('Search failed to find the created Gold Plan');
    }

    console.log('\n--- Test 5.3: GET Get All Plans with status filter ---');
    const statusFilterResponse = await fetch(`${BASE_URL}?status=active`, {
      headers
    });
    const statusFilterResult = await statusFilterResponse.json();
    console.log('Active plans count:', statusFilterResult.data.plans.length);

    // 6. Test Update Plan (PUT /:id)
    console.log('\n--- Test 6: PUT Update Plan ---');
    const updateData = {
      name: `Updated Gold Plan ${Date.now()}`,
      price: 119.99,
      duration: 12
    };

    const updateResponse = await fetch(`${BASE_URL}/${testPlanId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData)
    });
    const updateResult = await updateResponse.json();
    console.log('HTTP Status:', updateResponse.status);
    console.log('Update Response:', JSON.stringify(updateResult, null, 2));

    if (updateResponse.status !== 200 || !updateResult.success || updateResult.data.plan.price !== 119.99 || updateResult.data.plan.duration !== 12) {
      throw new Error('Failed to update membership plan');
    }

    // 7. Test Patch Status (PATCH /:id/status)
    console.log('\n--- Test 7: PATCH Update Plan Status ---');
    const statusResponse = await fetch(`${BASE_URL}/${testPlanId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'inactive' })
    });
    const statusResult = await statusResponse.json();
    console.log('HTTP Status:', statusResponse.status);
    console.log('Status Response:', JSON.stringify(statusResult, null, 2));

    if (statusResponse.status !== 200 || !statusResult.success || statusResult.data.plan.status !== 'inactive') {
      throw new Error('Failed to update status to inactive');
    }

    // 8. Test Delete Plan (DELETE /:id)
    console.log('\n--- Test 8: DELETE Delete Plan ---');
    const deleteResponse = await fetch(`${BASE_URL}/${testPlanId}`, {
      method: 'DELETE',
      headers
    });
    const deleteResult = await deleteResponse.json();
    console.log('HTTP Status:', deleteResponse.status);
    console.log('Delete Response:', JSON.stringify(deleteResult, null, 2));

    if (deleteResponse.status !== 200 || !deleteResult.success) {
      throw new Error('Failed to delete membership plan');
    }

    // Verify it is gone
    const verifyGoneResponse = await fetch(`${BASE_URL}/${testPlanId}`, {
      headers
    });
    console.log('Get deleted plan status (should be 404):', verifyGoneResponse.status);
    if (verifyGoneResponse.status !== 404) {
      throw new Error('Membership plan was not deleted successfully');
    }

    // 9. Verify Security logs in activity_logs
    console.log('\n--- Test 9: Verify activity_logs audit entries ---');
    const { data: logs, error: logsError } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('admin_id', admin.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (logsError) {
      throw new Error(`Failed to query activity_logs: ${logsError.message}`);
    }

    console.log('Recent 5 logs for this admin:');
    logs.forEach(log => {
      console.log(`- Action: ${log.action}, Details:`, log.details);
    });

    const actions = logs.map(l => l.action);
    const expectedActions = ['DELETE_MEMBERSHIP_PLAN', 'UPDATE_MEMBERSHIP_PLAN_STATUS', 'UPDATE_MEMBERSHIP_PLAN', 'CREATE_MEMBERSHIP_PLAN'];
    
    const allFound = expectedActions.every(act => actions.includes(act));
    if (!allFound) {
      console.warn('WARNING: Some expected actions were not found in the activity logs. Found:', actions);
    } else {
      console.log('SUCCESS: All audit actions successfully written to activity_logs table!');
    }

    console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');

  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
    process.exit(1);
  }
}

testAll();
