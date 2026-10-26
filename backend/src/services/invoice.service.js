const PDFDocument = require('pdfkit');
const supabase = require('../config/supabase');
const settingsService = require('./settings.service');

class InvoiceService {
  async generateInvoice(payment, member, membership) {
    const settings = await settingsService.getSettings();
    const gymName = settings.gym_name || 'Gym Center';
    const address = settings.address || '';
    const phone = settings.phone || '';
    const email = settings.email || '';
    const currency = settings.currency || 'USD';

    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
          try {
            const pdfData = Buffer.concat(buffers);
            
            const year = new Date(payment.created_at || Date.now()).getFullYear();
            const fileName = `${year}/${payment.invoice_number}.pdf`;
            
            const { data, error } = await supabase.storage
              .from('invoices')
              .upload(fileName, pdfData, {
                contentType: 'application/pdf',
                upsert: true
              });

            if (error) {
              return reject(new Error(`Failed to upload invoice: ${error.message}`));
            }
            resolve(fileName);
          } catch (uploadError) {
            reject(uploadError);
          }
        });

        // 1. Gym Header
        doc.fontSize(20).text(gymName, { align: 'center' });
        doc.fontSize(10).text(address, { align: 'center' });
        doc.text(`${phone} | ${email}`, { align: 'center' });
        doc.moveDown();
        
        // 2. Invoice Details
        doc.fontSize(16).text('INVOICE', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12);
        doc.text(`Invoice Number: ${payment.invoice_number}`);
        doc.text(`Invoice Date: ${new Date(payment.created_at || Date.now()).toLocaleDateString()}`);
        doc.text(`Payment Date: ${new Date(payment.payment_date || Date.now()).toLocaleDateString()}`);
        if (payment.transaction_id) {
          doc.text(`Transaction ID: ${payment.transaction_id}`);
        }
        doc.moveDown();

        // 3. Member Information
        if (member) {
          doc.text(`Bill To:`);
          doc.text(`${member.first_name || ''} ${member.last_name || ''}`);
          doc.text(`Email: ${member.email || ''}`);
          doc.text(`Phone: ${member.phone || 'N/A'}`);
          doc.moveDown();
        }

        // 4. Membership Information
        if (membership && membership.plan) {
          doc.text(`Membership Details:`);
          doc.text(`Plan: ${membership.plan.name}`);
          doc.text(`Start Date: ${new Date(membership.start_date).toLocaleDateString()}`);
          if (membership.end_date) {
            doc.text(`End Date: ${new Date(membership.end_date).toLocaleDateString()}`);
          }
          doc.moveDown();
        }

        // 5. Billing Table
        doc.text('---------------------------------------------------------------------------------');
        doc.text('Description', 50, doc.y, { continued: true });
        doc.text('Amount', 400, doc.y, { align: 'right' });
        doc.text('---------------------------------------------------------------------------------', 50, doc.y + 15);
        doc.moveDown();

        const formatAmount = (amt) => `$${parseFloat(amt).toFixed(2)}`;

        doc.text('Base Amount', 50, doc.y, { continued: true });
        doc.text(`${formatAmount(payment.amount)} ${currency}`, 400, doc.y, { align: 'right' });
        doc.moveDown(0.5);
        
        if (payment.discount && parseFloat(payment.discount) > 0) {
          doc.text('Discount', 50, doc.y, { continued: true });
          doc.text(`-${formatAmount(payment.discount)} ${currency}`, 400, doc.y, { align: 'right' });
          doc.moveDown(0.5);
        }
        
        if (payment.tax && parseFloat(payment.tax) > 0) {
          doc.text('Tax', 50, doc.y, { continued: true });
          doc.text(`+${formatAmount(payment.tax)} ${currency}`, 400, doc.y, { align: 'right' });
          doc.moveDown(0.5);
        }

        doc.text('---------------------------------------------------------------------------------', 50, doc.y);
        doc.moveDown(0.5);
        
        doc.fontSize(14);
        doc.text('Final Amount', 50, doc.y, { continued: true });
        doc.text(`${formatAmount(payment.final_amount)} ${currency}`, 400, doc.y, { align: 'right' });
        
        doc.fontSize(12);
        doc.moveDown(2);
        
        doc.text(`Payment Method: ${(payment.payment_method || '').replace(/_/g, ' ')}`);
        doc.text(`Payment Status: ${(payment.payment_status || '').toUpperCase()}`);
        
        if (payment.notes) {
          doc.moveDown();
          doc.text(`Notes: ${payment.notes}`);
        }

        // Footer
        const bottom = doc.page.height - 100;
        doc.text('Thank you for choosing our gym.', 50, bottom, { align: 'center', width: doc.page.width - 100 });
        doc.text('This is a system-generated invoice.', { align: 'center', width: doc.page.width - 100 });
        
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  async getInvoiceSignedUrl(path) {
    if (!path) throw new Error('Invoice path is missing');
    const { data, error } = await supabase.storage
      .from('invoices')
      .createSignedUrl(path, 60 * 60); // 1 hour valid

    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
    return data?.signedUrl;
  }

  async downloadInvoiceBuffer(path) {
    if (!path) throw new Error('Invoice path is missing');
    const { data, error } = await supabase.storage
      .from('invoices')
      .download(path);

    if (error) {
      throw new Error(`Failed to download invoice from storage: ${error.message}`);
    }
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

module.exports = new InvoiceService();
