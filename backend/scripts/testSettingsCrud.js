require('dotenv').config();
const jwt = require('jsonwebtoken');
const supabase = require('../src/config/supabase');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api/settings`;

async function runTests() {
  console.log('=== STARTING SETTINGS MODULE TESTS ===');
  
  let admin;

  try {
    // 1. Fetch an admin for token signing
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

    // 2. Test: Get Settings (GET /api/settings)
    console.log('\n--- 1. Testing Get Settings ---');
    const getRes = await fetch(BASE_URL, { headers });
    const getData = await getRes.json();
    console.log('Get status:', getRes.status);
    console.log('Get body:', getData);

    if (getRes.status !== 200 || !getData.success) {
      throw new Error('Get settings test failed!');
    }

    // 3. Test: Update Settings (PUT /api/settings)
    console.log('\n--- 2. Testing Update Settings ---');
    const updateRes = await fetch(BASE_URL, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        gym_name: 'Apex Super Gym',
        address: '999 Fitness Boulevard, Suite C',
        phone: '+1-555-7777',
        email: 'info@apexsupergym.com',
        business_hours: 'Daily: 4AM-Midnight',
        currency: 'EUR',
        timezone: 'Europe/Berlin'
      })
    });

    const updateData = await updateRes.json();
    console.log('Update status:', updateRes.status);
    console.log('Update body:', updateData);

    if (updateRes.status !== 200 || !updateData.success) {
      throw new Error('Update settings test failed!');
    }

    // 4. Test: Get Settings again to verify persistence
    console.log('\n--- 3. Testing Get Settings persistence ---');
    const getRes2 = await fetch(BASE_URL, { headers });
    const getData2 = await getRes2.json();
    console.log('Second Get status:', getRes2.status);
    console.log('Second Gym Name:', getData2.data.gym_name);
    console.log('Second Currency:', getData2.data.currency);

    if (getData2.data.gym_name !== 'Apex Super Gym' || getData2.data.currency !== 'EUR') {
      throw new Error('Persisted values do not match update payload!');
    }
    console.log('Settings persisted correctly in database!');

    // Cleanup: Restore default rows (delete from table to return to defaults)
    console.log('\n--- 4. Cleanup Settings from DB ---');
    const { error: delError } = await supabase
      .from('gym_settings')
      .delete()
      .in('key', ['gym_name', 'address', 'phone', 'email', 'business_hours', 'currency', 'timezone']);

    if (delError) {
      throw new Error(`Cleanup failed: ${delError.message}`);
    }
    console.log('Cleaned up settings rows successfully.');

  } catch (err) {
    console.error('Test run failed with error:', err.message);
    process.exit(1);
  }
}

runTests();
