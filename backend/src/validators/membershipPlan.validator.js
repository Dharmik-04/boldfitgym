const { body, param, validationResult } = require('express-validator');

const createMembershipPlanValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Plan name is required.')
    .isLength({ max: 100 })
    .withMessage('Plan name cannot exceed 100 characters.'),
  body('price')
    .notEmpty()
    .withMessage('Price is required.')
    .isFloat({ gt: 0 })
    .withMessage('Price must be a positive number greater than 0.'),
  body('duration')
    .notEmpty()
    .withMessage('Duration is required.')
    .isInt({ gt: 0 })
    .withMessage('Duration must be an integer greater than 0.'),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters.'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive.')
];

const updateMembershipPlanValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid membership plan UUID in request parameter.'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Plan name cannot be empty if provided.')
    .isLength({ max: 100 })
    .withMessage('Plan name cannot exceed 100 characters.'),
  body('price')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Price must be a positive number greater than 0.'),
  body('duration')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('Duration must be an integer greater than 0.'),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters.'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive.')
];

const statusValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid membership plan UUID in request parameter.'),
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
  createMembershipPlanValidator,
  updateMembershipPlanValidator,
  statusValidator,
  validate
};
