require('dotenv').config();
const jwt = require('jsonwebtoken');
const supabase = require('../src/config/supabase');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api/attendance`;

async function runTests() {
  console.log('=== STARTING ATTENDANCE MODULE TESTS ===');
  
  let testMember;
  let testRecordId;
  let admin;

  try {
    // 1. Fetch an admin for token generation
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('*')
      .limit(1);

    if (adminsError || !admins || admins.length === 0) {
      throw new Error(`Failed to fetch an admin: ${adminsError?.message || 'No admins found'}`);
    }
    admin = admins[0];
    console.log(`Using admin: ${admin.username} for token sign.`);

    const token = jwt.sign(
      { id: admin.id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1h' }
    );

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 2. Bootstrap: Fetch or create a temporary member
    const { data: members, error: mError } = await supabase
      .from('members')
      .select('*')
      .limit(1);

    if (mError) {
      throw new Error(`Failed to fetch member: ${mError.message}`);
    }

    if (members && members.length > 0) {
      testMember = members[0];
      console.log(`Using existing member: ${testMember.first_name} ${testMember.last_name}`);
    } else {
      // Create member if none exists
      const { data: newMember, error: createMError } = await supabase
        .from('members')
        .insert({
          first_name: 'Test',
          last_name: 'Attender',
          email: `attendee_${Date.now()}@test.com`,
          status: 'active',
          join_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (createMError) throw createMError;
      testMember = newMember;
      console.log(`Created test member: ${testMember.first_name} (${testMember.id})`);
    }

    // 3. Test: Check-in (POST /api/attendance/check-in)
    console.log('\n--- 1. Testing Check-in ---');
    const checkinDate = new Date().toISOString().split('T')[0];
    const checkinTime = new Date().toISOString();

    const checkinRes = await fetch(`${BASE_URL}/check-in`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        member_id: testMember.id,
        attendance_date: checkinDate,
        check_in: checkinTime,
        status: 'present',
        device: 'Test Script'
      })
    });

    const checkinData = await checkinRes.json();
    console.log('Check-in status:', checkinRes.status);
    console.log('Check-in body:', checkinData);

    if (checkinRes.status !== 201 || !checkinData.success) {
      throw new Error('Check-in test failed!');
    }
    testRecordId = checkinData.data.id;
    console.log(`Check-in record created with ID: ${testRecordId}`);

    // 4. Test: Double Check-in prevention
    console.log('\n--- 2. Testing Double Check-in prevention ---');
    const doubleRes = await fetch(`${BASE_URL}/check-in`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        member_id: testMember.id,
        attendance_date: checkinDate,
        check_in: new Date().toISOString()
      })
    });

    const doubleData = await doubleRes.json();
    console.log('Double Check-in status:', doubleRes.status);
    console.log('Double Check-in body:', doubleData);

    if (doubleRes.status !== 400 && doubleRes.status !== 500) {
      throw new Error('Double Check-in was not blocked!');
    }
    console.log('Blocked duplicate check-in successfully!');

    // 5. Test: Get Attendance List (GET /api/attendance)
    console.log('\n--- 3. Testing Get Attendance Logs ---');
    const getRes = await fetch(`${BASE_URL}?search=${testMember.first_name}`, {
      headers
    });

    const getData = await getRes.json();
    console.log('Get status:', getRes.status);
    console.log(`Found ${getData.data.attendance.length} records matching search.`);

    if (getRes.status !== 200 || !getData.success) {
      throw new Error('Get logs test failed!');
    }

    // 6. Test: Check-out (PATCH /api/attendance/:id/check-out)
    console.log('\n--- 4. Testing Check-out ---');
    const checkoutTime = new Date(new Date().getTime() + 45 * 60000).toISOString(); // 45 mins later

    const checkoutRes = await fetch(`${BASE_URL}/${testRecordId}/check-out`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        check_out: checkoutTime
      })
    });

    const checkoutData = await checkoutRes.json();
    console.log('Check-out status:', checkoutRes.status);
    console.log('Check-out body:', checkoutData);

    if (checkoutRes.status !== 200 || !checkoutData.success) {
      throw new Error('Check-out test failed!');
    }
    console.log('Checked out successfully!');

    // 7. Test: Delete attendance record (DELETE /api/attendance/:id)
    console.log('\n--- 5. Testing Delete Attendance Record ---');
    const delRes = await fetch(`${BASE_URL}/${testRecordId}`, {
      method: 'DELETE',
      headers
    });

    const delData = await delRes.json();
    console.log('Delete status:', delRes.status);
    console.log('Delete body:', delData);

    if (delRes.status !== 200 || !delData.success) {
      throw new Error('Delete test failed!');
    }
    console.log('Deleted attendance test log successfully.');

  } catch (err) {
    console.error('Test run failed with error:', err.message);
    process.exit(1);
  }
}

runTests();
