const twilio = require('twilio');

class MessagingService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.smsNumber = process.env.TWILIO_PHONE_NUMBER;
    this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    
    // Initialize Twilio client only if credentials are provided
    if (this.accountSid && this.authToken && this.accountSid !== 'your_twilio_account_sid') {
      this.client = twilio(this.accountSid, this.authToken);
    } else {
      this.client = null;
      console.warn('Twilio credentials are not set. Messaging service is running in mock mode.');
    }
  }

  async sendInvoiceSms(member, payment, secureLink) {
    if (!member.phone) {
      throw new Error('Member does not have a phone number.');
    }

    const messageBody = `Your gym payment of $${payment.final_amount.toFixed(2)} was received. Invoice ${payment.invoice_number}: ${secureLink}`;

    if (!this.client) {
      console.log(`[MOCK SMS to ${member.phone}]: ${messageBody}`);
      return { sid: 'mock_sid_' + Date.now() };
    }

    try {
      const message = await this.client.messages.create({
        body: messageBody,
        from: this.smsNumber,
        to: member.phone
      });
      console.log(`SMS sent to ${member.phone} with SID: ${message.sid}`);
      return message;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  async sendInvoiceWhatsapp(member, payment, signedUrl) {
    if (!member.phone) {
      throw new Error('Member does not have a phone number.');
    }

    // Twilio WhatsApp numbers require a 'whatsapp:' prefix
    const to = member.phone.startsWith('whatsapp:') ? member.phone : `whatsapp:${member.phone}`;
    const from = this.whatsappNumber.startsWith('whatsapp:') ? this.whatsappNumber : `whatsapp:${this.whatsappNumber}`;
    
    const messageBody = `Your gym payment of $${payment.final_amount.toFixed(2)} was received. Your invoice is attached.`;

    if (!this.client) {
      console.log(`[MOCK WhatsApp to ${to}]: ${messageBody} (Attachment: ${signedUrl})`);
      return { sid: 'mock_whatsapp_sid_' + Date.now() };
    }

    try {
      const message = await this.client.messages.create({
        body: messageBody,
        from: from,
        to: to,
        mediaUrl: [signedUrl] // Attach the PDF via signed URL
      });
      console.log(`WhatsApp sent to ${to} with SID: ${message.sid}`);
      return message;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw new Error(`Failed to send WhatsApp message: ${error.message}`);
    }
  }
}

module.exports = new MessagingService();
