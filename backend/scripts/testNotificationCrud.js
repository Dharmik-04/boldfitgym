require('dotenv').config();
const jwt = require('jsonwebtoken');
const supabase = require('../src/config/supabase');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api/notifications`;

async function runTests() {
  console.log('=== STARTING NOTIFICATION MODULE TESTS ===');
  
  let testRecordId;
  let admin;

  try {
    // 1. Fetch an admin to generate a JWT token
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

    // 2. Test: Create notification (POST /api/notifications)
    console.log('\n--- 1. Testing Create Notification ---');
    const createRes = await fetch(BASE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'New Plan Launch',
        message: 'A premium CrossFit package is now available for booking.',
        type: 'system', // default value in schema
        admin_id: admin.id
      })
    });

    const createData = await createRes.json();
    console.log('Create status:', createRes.status);
    console.log('Create body:', createData);

    if (createRes.status !== 201 || !createData.success) {
      throw new Error('Create notification test failed!');
    }
    testRecordId = createData.data.id;
    console.log(`Notification record created with ID: ${testRecordId}`);

    // 3. Test: Get Notifications list and check unread count (GET /api/notifications)
    console.log('\n--- 2. Testing Get Notifications list & Unread count ---');
    const getRes = await fetch(BASE_URL, { headers });
    const getData = await getRes.json();
    console.log('Get status:', getRes.status);
    console.log('Unread count returned:', getData.data.unread_count);
    console.log(`Fetched ${getData.data.notifications.length} notification items.`);

    if (getRes.status !== 200 || !getData.success) {
      throw new Error('Get notifications list test failed!');
    }
    const initialUnreadCount = getData.data.unread_count;

    // 4. Test: Mark notification as read (PATCH /api/notifications/:id/read)
    console.log('\n--- 3. Testing Mark as Read ---');
    const readRes = await fetch(`${BASE_URL}/${testRecordId}/read`, {
      method: 'PATCH',
      headers
    });

    const readData = await readRes.json();
    console.log('Mark read status:', readRes.status);
    console.log('Mark read body:', readData);

    if (readRes.status !== 200 || !readData.success || !readData.data.is_read) {
      throw new Error('Mark read test failed!');
    }

    // 5. Test: Get Notifications list again and verify unread count decreased
    console.log('\n--- 4. Verify Unread count decreased ---');
    const getRes2 = await fetch(BASE_URL, { headers });
    const getData2 = await getRes2.json();
    console.log('Second Get status:', getRes2.status);
    console.log('Second Unread count:', getData2.data.unread_count);

    if (getData2.data.unread_count !== initialUnreadCount - 1) {
      throw new Error('Unread count did not decrease by exactly 1!');
    }
    console.log('Unread count decreased correctly!');

    // 6. Test: Delete notification (DELETE /api/notifications/:id)
    console.log('\n--- 5. Testing Delete Notification ---');
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
    console.log('Deleted notification test log successfully.');

  } catch (err) {
    console.error('Test run failed with error:', err.message);
    process.exit(1);
  }
}

runTests();
