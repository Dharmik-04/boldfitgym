const { body, param, validationResult } = require('express-validator');

const createPaymentValidator = [
  body('member_id')
    .notEmpty()
    .withMessage('Member ID is required.')
    .isUUID()
    .withMessage('Member ID must be a valid UUID.'),
  body('membership_id')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Membership ID must be a valid UUID.'),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required.')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number greater than 0.'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code.')
    .isAlpha()
    .withMessage('Currency must contain only alphabetic characters.'),
  body('discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount must be a non-negative number.'),
  body('tax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tax must be a non-negative number.'),
  body('payment_method')
    .notEmpty()
    .withMessage('Payment method is required.')
    .isIn(['credit_card', 'debit_card', 'cash', 'bank_transfer', 'mobile_wallet'])
    .withMessage('Payment method must be one of: credit_card, debit_card, cash, bank_transfer, mobile_wallet.'),
  body('payment_status')
    .notEmpty()
    .withMessage('Payment status is required.')
    .isIn(['pending', 'completed', 'failed', 'refunded'])
    .withMessage('Payment status must be one of: pending, completed, failed, refunded.'),
  body('notes')
    .optional()
    .trim(),
  body('receipt_url')
    .optional()
    .trim()
];

const updatePaymentValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid payment UUID in request parameter.'),
  body('member_id')
    .optional()
    .isUUID()
    .withMessage('Member ID must be a valid UUID.'),
  body('membership_id')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Membership ID must be a valid UUID.'),
  body('amount')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number greater than 0.'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code.')
    .isAlpha()
    .withMessage('Currency must contain only alphabetic characters.'),
  body('discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount must be a non-negative number.'),
  body('tax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tax must be a non-negative number.'),
  body('payment_method')
    .optional()
    .isIn(['credit_card', 'debit_card', 'cash', 'bank_transfer', 'mobile_wallet'])
    .withMessage('Payment method must be one of: credit_card, debit_card, cash, bank_transfer, mobile_wallet.'),
  body('payment_status')
    .optional()
    .isIn(['pending', 'completed', 'failed', 'refunded'])
    .withMessage('Payment status must be one of: pending, completed, failed, refunded.'),
  body('notes')
    .optional()
    .trim(),
  body('receipt_url')
    .optional()
    .trim()
];

const statusValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid payment UUID in request parameter.'),
  body('status')
    .notEmpty()
    .withMessage('Status is required.')
    .isIn(['pending', 'completed', 'failed', 'refunded'])
    .withMessage('Status must be one of: pending, completed, failed, refunded.')
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

module.exports = {
  createPaymentValidator,
  updatePaymentValidator,
  statusValidator,
  validate
};
