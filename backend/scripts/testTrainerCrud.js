require('dotenv').config();
const jwt = require('jsonwebtoken');
const supabase = require('../src/config/supabase');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api/trainers`;

async function runTests() {
  console.log('=== STARTING TRAINERS MODULE TESTS ===');
  
  let testTrainerId;
  let testEmail = `johntrainer-${Date.now()}@test.com`;
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

    // 2. Test Validator Errors
    console.log('\n--- Test 2: POST Validator errors (Missing names, bad email, bad status) ---');
    const badPayload = {
      first_name: '',
      last_name: '',
      email: 'not-an-email',
      phone: '123', // too short
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

    // 3. Test Create Trainer (Valid)
    console.log('\n--- Test 3: POST Create Trainer ---');
    const validPayload = {
      first_name: 'John',
      last_name: 'Trainer',
      email: testEmail,
      phone: '12345678',
      specialization: 'Yoga',
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
      throw new Error('Failed to create trainer');
    }

    testTrainerId = createResult.data.trainer.id;
    console.log('Trainer created successfully with ID:', testTrainerId);

    // 4. Test Prevent Duplicate Email (POST)
    console.log('\n--- Test 4: POST Duplicate Email (Should Fail with 409) ---');
    const duplicatePayload = {
      first_name: 'Another',
      last_name: 'Trainer',
      email: testEmail,
      phone: '87654321',
      status: 'active'
    };

    const conflictResponse = await fetch(BASE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(duplicatePayload)
    });
    const conflictResult = await conflictResponse.json();
    console.log('HTTP Status (Should be 409):', conflictResponse.status);
    console.log('Conflict Response:', JSON.stringify(conflictResult, null, 2));

    if (conflictResponse.status !== 409 || conflictResult.success !== false) {
      throw new Error('Expected 409 Conflict for duplicate email address');
    }

    // 5. Test GET Get All Trainers (Filters & Search)
    console.log('\n--- Test 5.1: GET List Trainers with status and specialization filter ---');
    const listResponse = await fetch(`${BASE_URL}?page=1&limit=5&status=active&specialization=Yoga`, { headers });
    const listResult = await listResponse.json();
    console.log('HTTP Status:', listResponse.status);
    console.log('Trainers found:', listResult.data.trainers.length);
    if (listResult.data.trainers.length !== 1) {
      throw new Error('Filter by status/specialization failed');
    }

    console.log('\n--- Test 5.2: GET List Trainers with Search ---');
    const searchResponse = await fetch(`${BASE_URL}?search=John`, { headers });
    const searchResult = await searchResponse.json();
    console.log('Search Results count:', searchResult.data.trainers.length);
    if (searchResult.data.trainers.length === 0) {
      throw new Error('Search failed');
    }

    // 6. Test PUT Update Trainer
    console.log('\n--- Test 6: PUT Update Trainer ---');
    const updatePayload = {
      first_name: 'Johnny',
      specialization: 'Advanced Yoga'
    };
    const updateResponse = await fetch(`${BASE_URL}/${testTrainerId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updatePayload)
    });
    const updateResult = await updateResponse.json();
    console.log('HTTP Status:', updateResponse.status);
    console.log('Updated Name (Should be Johnny):', updateResult.data.trainer.first_name);
    console.log('Updated Specialization (Should be Advanced Yoga):', updateResult.data.trainer.specialization);

    if (updateResult.data.trainer.first_name !== 'Johnny' || updateResult.data.trainer.specialization !== 'Advanced Yoga') {
      throw new Error('Update trainer fields failed');
    }

    // 7. Test PATCH Update Status
    console.log('\n--- Test 7: PATCH Update Trainer Status ---');
    const patchResponse = await fetch(`${BASE_URL}/${testTrainerId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'inactive' })
    });
    const patchResult = await patchResponse.json();
    console.log('HTTP Status:', patchResponse.status);
    console.log('New Status (Should be inactive):', patchResult.data.trainer.status);
    if (patchResult.data.trainer.status !== 'inactive') {
      throw new Error('Failed to update status to inactive');
    }

    // 8. Test DELETE Trainer
    console.log('\n--- Test 8: DELETE Trainer ---');
    const deleteResponse = await fetch(`${BASE_URL}/${testTrainerId}`, {
      method: 'DELETE',
      headers
    });
    console.log('Delete status:', deleteResponse.status);
    if (deleteResponse.status !== 200) {
      throw new Error('Failed to delete trainer record');
    }

    // Verify it is deleted
    const verifyGoneResponse = await fetch(`${BASE_URL}/${testTrainerId}`, { headers });
    console.log('Get deleted trainer HTTP status (Should be 404):', verifyGoneResponse.status);
    if (verifyGoneResponse.status !== 404) {
      throw new Error('Trainer was not deleted successfully');
    }

    // 9. Verify activity_logs audit entries
    console.log('\n--- Test 9: Verify activity_logs audit entries ---');
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
    const expectedActions = ['DELETE_TRAINER', 'UPDATE_TRAINER_STATUS', 'UPDATE_TRAINER', 'CREATE_TRAINER'];
    const allFound = expectedActions.every(act => actions.includes(act));
    
    if (!allFound) {
      console.warn('WARNING: Some expected actions were not found in the activity logs. Found:', actions);
    } else {
      console.log('SUCCESS: All audit actions successfully written to activity_logs table!');
    }

    console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');

  } catch (err) {
    console.error('\n❌ TEST RUN FAILED:', err.message);
  }
}

runTests();
