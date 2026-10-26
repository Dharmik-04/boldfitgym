const paymentService = require('../services/payment.service');
const authService = require('../services/auth.service');
const invoiceService = require('../services/invoice.service');
const emailService = require('../services/email.service');
const messagingService = require('../services/messaging.service');

const getPayments = async (req, res, next) => {
  try {
    const { page, limit, search, payment_status, payment_method, member, sortBy } = req.query;
    const result = await paymentService.getAllPayments({ page, limit, search, payment_status, payment_method, member, sortBy });

    return res.status(200).json({
      success: true,
      message: 'Payments retrieved successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPaymentById(id);

    return res.status(200).json({
      success: true,
      message: 'Payment retrieved successfully.',
      data: { payment }
    });
  } catch (error) {
    if (error.message === 'Payment not found.') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const result = await paymentService.createPayment(req.body);
    const adminId = req.user.id;
    const ipAddress = req.ip;

    // Log the action to activity_logs
    await authService.logActivity(adminId, 'CREATE_PAYMENT', ipAddress, {
      payment_id: result.id,
      member_id: result.member_id,
      amount: result.amount,
      invoice_number: result.invoice_number
    });

    return res.status(201).json({
      success: true,
      message: 'Payment created successfully.',
      data: { payment: result }
    });
  } catch (error) {
    if (error.message === 'Member not found.' || error.message === 'Membership not found.') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const updatePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await paymentService.updatePayment(id, req.body);
    const adminId = req.user.id;
    const ipAddress = req.ip;

    // Log the action to activity_logs
    await authService.logActivity(adminId, 'UPDATE_PAYMENT', ipAddress, {
      payment_id: result.id,
      amount: result.amount,
      payment_status: result.payment_status
    });

    return res.status(200).json({
      success: true,
      message: 'Payment updated successfully.',
      data: { payment: result }
    });
  } catch (error) {
    if (error.message === 'Payment not found.') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message === 'Member not found.' || error.message === 'Membership not found.') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const deletePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const ipAddress = req.ip;

    // Fetch details before deletion for logging
    const payment = await paymentService.getPaymentById(id);

    await paymentService.deletePayment(id);

    // Log the action to activity_logs
    await authService.logActivity(adminId, 'DELETE_PAYMENT', ipAddress, {
      payment_id: id,
      invoice_number: payment.invoice_number
    });

    return res.status(200).json({
      success: true,
      message: 'Payment deleted successfully.'
    });
  } catch (error) {
    if (error.message === 'Payment not found.') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await paymentService.updatePaymentStatus(id, status);
    const adminId = req.user.id;
    const ipAddress = req.ip;

    // Log the action to activity_logs
    await authService.logActivity(adminId, 'UPDATE_PAYMENT_STATUS', ipAddress, {
      payment_id: result.id,
      payment_status: status
    });

    return res.status(200).json({
      success: true,
      message: `Payment status changed to ${status} successfully.`,
      data: { payment: result }
    });
  } catch (error) {
    if (error.message === 'Payment not found.') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const downloadInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPaymentById(id);
    
    if (!payment.receipt_url) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found or not generated yet.'
      });
    }

    const signedUrl = await invoiceService.getInvoiceSignedUrl(payment.receipt_url);
    
    const adminId = req.user.id;
    const ipAddress = req.ip;
    await authService.logActivity(adminId, 'INVOICE_DOWNLOADED', ipAddress, {
      payment_id: payment.id,
      invoice_number: payment.invoice_number
    });

    return res.status(200).json({
      success: true,
      message: 'Invoice retrieved successfully.',
      data: { url: signedUrl }
    });
  } catch (error) {
    if (error.message === 'Payment not found.') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const regenerateInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPaymentById(id);
    
    if (payment.payment_status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only generate invoices for completed payments.'
      });
    }

    const path = await invoiceService.generateInvoice(payment, payment.member, payment.membership);
    
    const updatedPayment = await paymentService.updatePayment(id, { receipt_url: path });
    
    const adminId = req.user.id;
    const ipAddress = req.ip;
    await authService.logActivity(adminId, 'INVOICE_REGENERATED', ipAddress, {
      payment_id: payment.id,
      invoice_number: payment.invoice_number
    });

    return res.status(200).json({
      success: true,
      message: 'Invoice regenerated successfully.',
      data: { payment: updatedPayment }
    });
  } catch (error) {
    if (error.message === 'Payment not found.') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const sendEmailInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPaymentById(id);
    
    if (payment.payment_status !== 'completed' || !payment.receipt_url) {
      return res.status(400).json({ success: false, message: 'Invoice not available for this payment.' });
    }

    const pdfBuffer = await invoiceService.downloadInvoiceBuffer(payment.receipt_url);
    await emailService.sendInvoiceEmail(payment.member, payment, pdfBuffer);

    const adminId = req.user.id;
    const ipAddress = req.ip;
    await authService.logActivity(adminId, 'INVOICE_EMAILED', ipAddress, {
      payment_id: payment.id,
      member_id: payment.member_id,
      invoice_number: payment.invoice_number,
      destination: payment.member.email
    });

    return res.status(200).json({ success: true, message: 'Email sent successfully.' });
  } catch (error) {
    if (error.message === 'Payment not found.') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const sendPhoneInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPaymentById(id);
    
    if (payment.payment_status !== 'completed' || !payment.receipt_url) {
      return res.status(400).json({ success: false, message: 'Invoice not available for this payment.' });
    }

    const signedUrl = await invoiceService.getInvoiceSignedUrl(payment.receipt_url);
    await messagingService.sendInvoiceSms(payment.member, payment, signedUrl);

    const adminId = req.user.id;
    const ipAddress = req.ip;
    await authService.logActivity(adminId, 'INVOICE_SMS_SENT', ipAddress, {
      payment_id: payment.id,
      member_id: payment.member_id,
      invoice_number: payment.invoice_number,
      destination: payment.member.phone
    });

    return res.status(200).json({ success: true, message: 'SMS sent successfully.' });
  } catch (error) {
    if (error.message === 'Payment not found.') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const sendWhatsappInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPaymentById(id);
    
    if (payment.payment_status !== 'completed' || !payment.receipt_url) {
      return res.status(400).json({ success: false, message: 'Invoice not available for this payment.' });
    }

    const signedUrl = await invoiceService.getInvoiceSignedUrl(payment.receipt_url);
    await messagingService.sendInvoiceWhatsapp(payment.member, payment, signedUrl);

    const adminId = req.user.id;
    const ipAddress = req.ip;
    await authService.logActivity(adminId, 'INVOICE_WHATSAPP_SENT', ipAddress, {
      payment_id: payment.id,
      member_id: payment.member_id,
      invoice_number: payment.invoice_number,
      destination: payment.member.phone
    });

    return res.status(200).json({ success: true, message: 'WhatsApp message sent successfully.' });
  } catch (error) {
    if (error.message === 'Payment not found.') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

module.exports = {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  updateStatus,
  downloadInvoice,
  regenerateInvoice,
  sendEmailInvoice,
  sendPhoneInvoice,
  sendWhatsappInvoice
};
