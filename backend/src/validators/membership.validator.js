const { body, param, validationResult } = require('express-validator');

const createMembershipValidator = [
  body('member_id')
    .notEmpty()
    .withMessage('Member ID is required.')
    .isUUID()
    .withMessage('Member ID must be a valid UUID.'),
  body('plan_id')
    .notEmpty()
    .withMessage('Plan ID is required.')
    .isUUID()
    .withMessage('Plan ID must be a valid UUID.'),
  body('start_date')
    .notEmpty()
    .withMessage('Start date is required.')
    .isISO8601()
    .withMessage('Start date must be a valid date (YYYY-MM-DD).'),
  body('status')
    .notEmpty()
    .withMessage('Status is required.')
    .isIn(['active', 'expired', 'cancelled', 'paused'])
    .withMessage('Status must be active, expired, cancelled, or paused.'),
  body('auto_renew')
    .optional()
    .isBoolean()
    .withMessage('Auto renew must be a boolean.'),
  body('freeze_days')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Freeze days must be a non-negative integer.')
];

const updateMembershipValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid membership UUID in request parameter.'),
  body('member_id')
    .optional()
    .isUUID()
    .withMessage('Member ID must be a valid UUID if provided.'),
  body('plan_id')
    .optional()
    .isUUID()
    .withMessage('Plan ID must be a valid UUID if provided.'),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date (YYYY-MM-DD) if provided.'),
  body('status')
    .optional()
    .isIn(['active', 'expired', 'cancelled', 'paused'])
    .withMessage('Status must be active, expired, cancelled, or paused.'),
  body('auto_renew')
    .optional()
    .isBoolean()
    .withMessage('Auto renew must be a boolean.'),
  body('freeze_days')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Freeze days must be a non-negative integer.')
];

const statusValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid membership UUID in request parameter.'),
  body('status')
    .notEmpty()
    .withMessage('Status is required.')
    .isIn(['active', 'expired', 'cancelled', 'paused'])
    .withMessage('Status must be active, expired, cancelled, or paused.')
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
  createMembershipValidator,
  updateMembershipValidator,
  statusValidator,
  validate
};
