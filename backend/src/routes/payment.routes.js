const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');
const {
  createPaymentValidator,
  updatePaymentValidator,
  statusValidator,
  validate
} = require('../validators/payment.validator');

// Protect all routes under this router using JWT middleware
router.use(protect);

router.get('/', paymentController.getPayments);
router.get('/:id', paymentController.getPayment);
router.get('/:id/invoice', paymentController.downloadInvoice);
router.post('/:id/invoice/regenerate', paymentController.regenerateInvoice);
router.post('/:id/send-email', paymentController.sendEmailInvoice);
router.post('/:id/send-phone', paymentController.sendPhoneInvoice);
router.post('/:id/send-whatsapp', paymentController.sendWhatsappInvoice);
router.post('/', createPaymentValidator, validate, paymentController.createPayment);
router.put('/:id', updatePaymentValidator, validate, paymentController.updatePayment);
router.delete('/:id', paymentController.deletePayment);
router.patch('/:id/status', statusValidator, validate, paymentController.updateStatus);

module.exports = router;
