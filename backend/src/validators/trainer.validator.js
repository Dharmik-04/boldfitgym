const { body, param, validationResult } = require('express-validator');

const createTrainerValidator = [
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
  body('specialization')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Specialization cannot exceed 150 characters.'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive.')
];

const updateTrainerValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid trainer UUID in request parameter.'),
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
  body('specialization')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Specialization cannot exceed 150 characters.'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive.')
];

const statusValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid trainer UUID in request parameter.'),
  body('status')
    .notEmpty()
    .withMessage('Status is required.')
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive.')
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
  createTrainerValidator,
  updateTrainerValidator,
  statusValidator,
  validate
};
