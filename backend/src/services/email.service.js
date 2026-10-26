const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: process.env.SMTP_PORT || 2525,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendInvoiceEmail(member, payment, pdfBuffer) {
    if (!member.email) {
      throw new Error('Member does not have an email address.');
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@gymmanagement.com',
      to: member.email,
      subject: `Your Gym Payment Invoice - ${payment.invoice_number}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #4CAF50;">Thank You for Your Payment!</h2>
          <p>Hi <strong>${member.first_name} ${member.last_name}</strong>,</p>
          <p>We have successfully received your payment of <strong>$${payment.final_amount.toFixed(2)} ${payment.currency}</strong> on ${new Date(payment.payment_date).toLocaleDateString()}.</p>
          <p>Your invoice <strong>${payment.invoice_number}</strong> is attached to this email for your records.</p>
          <br />
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br/><strong>The Gym Management Team</strong></p>
        </div>
      `,
      attachments: [
        {
          filename: `${payment.invoice_number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your_smtp_user') {
      console.log(`[MOCK EMAIL to ${member.email}]: Subject: ${mailOptions.subject} (Attachment: ${mailOptions.attachments[0].filename})`);
      return { messageId: 'mock_message_id_' + Date.now() };
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${member.email}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}

module.exports = new EmailService();
