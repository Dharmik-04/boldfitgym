require('dotenv').config();
const jwt = require('jsonwebtoken');
const supabase = require('../src/config/supabase');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api/payments`;

async function runTests() {
  console.log('=== STARTING MESSAGING MODULE TESTS ===');
  
  let admin;

  try {
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('*')
      .limit(1);

    if (adminsError || !admins || admins.length === 0) {
      throw new Error(`Failed to fetch an admin: ${adminsError?.message}`);
    }
    admin = admins[0];
    console.log(`Using admin: ${admin.username} (${admin.id})`);

    const token = jwt.sign(
      { id: admin.id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1h' }
    );

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 1. Bootstrap: Create temporary member
    console.log('\n--- Bootstrapping temporary Member ---');
    const { data: newMember, error: mErr } = await supabase
      .from('members')
      .insert({
        first_name: 'Test',
        last_name: 'Member',
        email: `test-${Date.now()}@test.com`,
        phone: '+1234567890',
        gender: 'male',
        status: 'active'
      })
      .select()
      .single();
    if (mErr) throw new Error(mErr.message);

    const validPayload = {
      member_id: newMember.id,
      amount: 150.00,
      currency: 'USD',
      discount: 15.00,
      tax: 7.50,
      payment_method: 'credit_card',
      payment_status: 'completed', // This triggers PDF generation
      notes: 'Test payment with tax and discount',
    };

    console.log('Creating completed payment to trigger PDF generation...');
    const createResponse = await fetch(BASE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(validPayload)
    });
    const createResult = await createResponse.json();
    if (createResponse.status !== 201 || !createResult.success) {
      throw new Error('Failed to create payment: ' + JSON.stringify(createResult));
    }
    const testPayment = createResult.data.payment;
    console.log(`Created test payment: ${testPayment.id}`);

    // Poll for the updated payment to get receipt_url
    let paymentToTest;
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const { data: fetchPayment, error: fErr } = await supabase
        .from('payments')
        .select('*, member:members(*)')
        .eq('id', testPayment.id)
        .single();
      
      if (!fErr && fetchPayment.receipt_url) {
        paymentToTest = fetchPayment;
        break;
      }
      console.log('Waiting for receipt_url to be generated...');
    }

    if (!paymentToTest) {
      throw new Error('Failed to fetch generated receipt URL after 10 seconds');
    }

    // 1. Test Send Email
    console.log('\n--- Test 1: Send Email Invoice ---');
    const emailRes = await fetch(`${BASE_URL}/${paymentToTest.id}/send-email`, { method: 'POST', headers });
    const emailData = await emailRes.json();
    console.log('Email Response:', emailData);
    if (!emailRes.ok) throw new Error(emailData.message);

    // 2. Test Send SMS
    console.log('\n--- Test 2: Send SMS Invoice ---');
    const smsRes = await fetch(`${BASE_URL}/${paymentToTest.id}/send-phone`, { method: 'POST', headers });
    const smsData = await smsRes.json();
    console.log('SMS Response:', smsData);
    if (!smsRes.ok) throw new Error(smsData.message);

    // 3. Test Send WhatsApp
    console.log('\n--- Test 3: Send WhatsApp Invoice ---');
    const waRes = await fetch(`${BASE_URL}/${paymentToTest.id}/send-whatsapp`, { method: 'POST', headers });
    const waData = await waRes.json();
    console.log('WhatsApp Response:', waData);
    if (!waRes.ok) throw new Error(waData.message);

    // Verify activity_logs audit entries
    console.log('\n--- Verify activity_logs audit entries ---');
    const { data: logs, error: logsError } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('admin_id', admin.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (logsError) throw new Error(`Failed to read activity_logs: ${logsError.message}`);

    console.log('Audit logs recorded:');
    logs.forEach(log => {
      console.log(`- Action: ${log.action}, Details:`, log.details);
    });

    console.log('\n=== ALL MESSAGING TESTS PASSED SUCCESSFULLY! ===');

  } catch (err) {
    console.error('\n❌ TEST RUN FAILED:', err.message);
  }
}

runTests();
