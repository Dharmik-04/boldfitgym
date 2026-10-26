const { body, validationResult } = require('express-validator');

const updateSettingsValidator = [
  body('gym_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Gym name cannot be empty.')
    .isLength({ max: 100 })
    .withMessage('Gym name cannot exceed 100 characters.'),
  body('address')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Address cannot be empty.'),
  body('phone')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Phone cannot be empty.'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid gym email address.'),
  body('business_hours')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Business hours cannot be empty.'),
  body('currency')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Currency cannot be empty.')
    .isLength({ max: 10 })
    .withMessage('Currency code cannot exceed 10 characters.'),
  body('timezone')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Timezone cannot be empty.')
    .isLength({ max: 50 })
    .withMessage('Timezone cannot exceed 50 characters.')
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
  updateSettingsValidator,
  validate
};
