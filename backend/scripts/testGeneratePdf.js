require('dotenv').config();
const invoiceService = require('../src/services/invoice.service');
const supabase = require('../src/config/supabase');

async function testPdf() {
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*, member:members(*)')
      .limit(1)
      .single();
      
    if (error) throw error;
    
    console.log('Generating PDF for payment:', payment.id);
    const path = await invoiceService.generateInvoice(payment, payment.member, null);
    console.log('PDF generated at path:', path);
  } catch (err) {
    console.error('PDF Generation Error:', err);
  }
}

testPdf();
