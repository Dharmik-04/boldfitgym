const { body, param, validationResult } = require('express-validator');

const checkInValidator = [
  body('member_id')
    .notEmpty()
    .withMessage('Member ID is required.')
    .isUUID()
    .withMessage('Member ID must be a valid UUID.'),
  body('attendance_date')
    .optional()
    .isISO8601()
    .withMessage('Attendance date must be a valid ISO8601 date (YYYY-MM-DD).'),
  body('check_in')
    .optional()
    .isISO8601()
    .withMessage('Check-in must be a valid ISO8601 timestamp.'),
  body('status')
    .optional()
    .isIn(['present', 'late', 'absent'])
    .withMessage('Status must be present, late, or absent.'),
  body('device')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Device info cannot exceed 100 characters.')
];

const checkOutValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid attendance record UUID in request parameter.'),
  body('check_out')
    .optional()
    .isISO8601()
    .withMessage('Check-out must be a valid ISO8601 timestamp.')
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
  checkInValidator,
  checkOutValidator,
  validate
};
