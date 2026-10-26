const { body, param, validationResult } = require('express-validator');

const createMemberValidator = [
  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required.')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters.'),
  body('last_name')
    .trim()
    .notEmpty()
    .withMessage('Last name is required.')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters.'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .isLength({ max: 100 })
    .withMessage('Email cannot exceed 100 characters.'),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('Phone number must be between 5 and 20 digits.'),
  body('date_of_birth')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Please provide a valid ISO8601 date of birth (YYYY-MM-DD).')
    .custom((value) => {
      if (new Date(value) >= new Date()) {
        throw new Error('Date of birth must be in the past.');
      }
      return true;
    }),
  body('gender')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Gender must be one of: male, female, other, prefer_not_to_say.'),
  body('height')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 10, max: 300 })
    .withMessage('Height must be a valid float value in cm (e.g. 50 to 300).'),
  body('weight')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 2, max: 500 })
    .withMessage('Weight must be a valid float value in kg (e.g. 10 to 500).'),
  body('blood_group')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Blood group must be a valid type (e.g. A+, O-).'),
  body('emergency_contact_email')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Please provide a valid emergency contact email address.'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended', 'pending'])
    .withMessage('Status must be one of: active, inactive, suspended, pending.')
];

const updateMemberValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid member UUID in request parameter.'),
  body('first_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty if provided.')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters.'),
  body('last_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty if provided.')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters.'),
  body('email')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Email address cannot be empty if provided.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .isLength({ max: 100 })
    .withMessage('Email cannot exceed 100 characters.'),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('Phone number must be between 5 and 20 digits.'),
  body('date_of_birth')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Please provide a valid ISO8601 date of birth (YYYY-MM-DD).')
    .custom((value) => {
      if (new Date(value) >= new Date()) {
        throw new Error('Date of birth must be in the past.');
      }
      return true;
    }),
  body('gender')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Gender must be one of: male, female, other, prefer_not_to_say.'),
  body('height')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 10, max: 300 })
    .withMessage('Height must be a valid float value.'),
  body('weight')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 2, max: 500 })
    .withMessage('Weight must be a valid float value.'),
  body('blood_group')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Blood group must be a valid type (e.g. A+, O-).'),
  body('emergency_contact_email')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Please provide a valid emergency contact email address.'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended', 'pending'])
    .withMessage('Status must be one of: active, inactive, suspended, pending.')
];

const statusValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid member UUID in request parameter.'),
  body('status')
    .notEmpty()
    .withMessage('Status value is required.')
    .isIn(['active', 'inactive', 'suspended', 'pending'])
    .withMessage('Status must be active, inactive, suspended, or pending.')
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
  createMemberValidator,
  updateMemberValidator,
  statusValidator,
  validate
};
