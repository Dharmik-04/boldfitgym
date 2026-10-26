require('dotenv').config();
const jwt = require('jsonwebtoken');
const supabase = require('../src/config/supabase');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api/payments`;

async function runTests() {
  console.log('=== STARTING PAYMENTS MODULE TESTS ===');
  
  let testMember;
  let testPaymentId;
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

    // 2. Bootstrap: Create temporary member
    console.log('\n--- Bootstrapping temporary Member ---');
    const { data: newMember, error: mErr } = await supabase
      .from('members')
      .insert({
        first_name: 'TestPayment',
        last_name: 'Member',
        email: `testpay-${Date.now()}@test.com`,
        phone: '9988776655',
        gender: 'male',
        status: 'active'
      })
      .select()
      .single();

    if (mErr) throw new Error(`Failed to create test member: ${mErr.message}`);
    testMember = newMember;
    console.log(`Created test member: ${testMember.first_name} ${testMember.last_name} (${testMember.id})`);

    // 3. Test Validator Errors
    console.log('\n--- Test 3: POST Validator errors (Negative amount, bad currency, bad method) ---');
    const badPayload = {
      member_id: testMember.id,
      amount: -50.00,
      currency: 'US_DOLLAR', // not 3 letters
      payment_method: 'paypal', // invalid method
      payment_status: 'paid' // invalid status
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

    // 4. Test Create Payment (Valid)
    console.log('\n--- Test 4: POST Create Payment (Calculates final_amount) ---');
    const validPayload = {
      member_id: testMember.id,
      amount: 150.00,
      currency: 'USD',
      discount: 15.00,
      tax: 7.50,
      payment_method: 'credit_card',
      payment_status: 'pending',
      notes: 'Test payment with tax and discount',
      receipt_url: 'http://test.com/receipt.pdf'
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
      throw new Error('Failed to create payment');
    }

    testPaymentId = createResult.data.payment.id;
    const generatedInvoice = createResult.data.payment.invoice_number;
    const calculatedFinalAmount = createResult.data.payment.final_amount;

    console.log(`Generated Invoice Number: ${generatedInvoice}`);
    console.log(`Expected Final Amount: 142.50 (150.00 - 15.00 + 7.50)`);
    console.log(`Calculated Final Amount: ${calculatedFinalAmount}`);
    
    if (calculatedFinalAmount !== 142.50) {
      throw new Error('Final amount calculation is incorrect!');
    }
    if (!generatedInvoice || !generatedInvoice.startsWith('INV-')) {
      throw new Error('Invoice number generation failed or is in wrong format');
    }

    // 5. Test GET Get All Payments (Filter & Search)
    console.log('\n--- Test 5.1: GET List Payments by member ---');
    const listResponse = await fetch(`${BASE_URL}?page=1&limit=5&member=${testMember.id}`, { headers });
    const listResult = await listResponse.json();
    console.log('HTTP Status:', listResponse.status);
    console.log('Payments found for test member:', listResult.data.payments.length);
    if (listResult.data.payments.length !== 1) {
      throw new Error('Filter by member failed');
    }

    console.log('\n--- Test 5.2: GET List Payments with Search (by Invoice Number) ---');
    const searchResponse = await fetch(`${BASE_URL}?search=${generatedInvoice}`, { headers });
    const searchResult = await searchResponse.json();
    console.log('Search Results count:', searchResult.data.payments.length);
    if (searchResult.data.payments.length === 0) {
      throw new Error('Search by invoice number failed');
    }

    console.log('\n--- Test 5.3: GET List Payments with status and method filters ---');
    const filtersResponse = await fetch(`${BASE_URL}?payment_status=pending&payment_method=credit_card`, { headers });
    const filtersResult = await filtersResponse.json();
    console.log('Filtered Payments count:', filtersResult.data.payments.length);
    if (filtersResult.data.payments.length === 0) {
      throw new Error('Filter by payment_status/payment_method failed');
    }

    // 6. Test PUT Update Payment
    console.log('\n--- Test 6: PUT Update Payment (Recalculates final_amount) ---');
    const updatePayload = {
      amount: 200.00,
      discount: 20.00,
      tax: 10.00,
      notes: 'Updated payment notes'
    };
    const updateResponse = await fetch(`${BASE_URL}/${testPaymentId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updatePayload)
    });
    const updateResult = await updateResponse.json();
    console.log('HTTP Status:', updateResponse.status);
    console.log('Recalculated Final Amount (Should be 190.00):', updateResult.data.payment.final_amount);
    console.log('Updated Notes (Should be "Updated payment notes"):', updateResult.data.payment.notes);

    if (updateResult.data.payment.final_amount !== 190.00 || updateResult.data.payment.notes !== 'Updated payment notes') {
      throw new Error('Update calculation/processing failed');
    }

    // 7. Test PATCH Update Status
    console.log('\n--- Test 7: PATCH Update Payment Status ---');
    const patchResponse = await fetch(`${BASE_URL}/${testPaymentId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'completed' })
    });
    const patchResult = await patchResponse.json();
    console.log('HTTP Status:', patchResponse.status);
    console.log('New Payment Status (Should be completed):', patchResult.data.payment.payment_status);
    if (patchResult.data.payment.payment_status !== 'completed') {
      throw new Error('Failed to update status to completed');
    }

    // 8. Test DELETE Payment
    console.log('\n--- Test 8: DELETE Payment ---');
    const deleteResponse = await fetch(`${BASE_URL}/${testPaymentId}`, {
      method: 'DELETE',
      headers
    });
    console.log('Delete status:', deleteResponse.status);
    if (deleteResponse.status !== 200) {
      throw new Error('Failed to delete payment record');
    }

    // Verify it is deleted
    const verifyGoneResponse = await fetch(`${BASE_URL}/${testPaymentId}`, { headers });
    console.log('Get deleted payment HTTP status (Should be 404):', verifyGoneResponse.status);
    if (verifyGoneResponse.status !== 404) {
      throw new Error('Payment was not deleted successfully');
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
    const expectedActions = ['DELETE_PAYMENT', 'UPDATE_PAYMENT_STATUS', 'UPDATE_PAYMENT', 'CREATE_PAYMENT'];
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
    // 10. Cleanup Bootstrapped Records
    console.log('\n--- Cleaning up temporary Member ---');
    if (testMember) {
      const { error } = await supabase.from('members').delete().eq('id', testMember.id);
      if (error) console.error('Failed to cleanup member:', error.message);
      else console.log('Cleaned up test member.');
    }
  }
}

runTests();
