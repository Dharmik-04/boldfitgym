const { body, param, validationResult } = require('express-validator');

const createTrainerAssignmentValidator = [
  body('member_id')
    .notEmpty()
    .withMessage('Member ID is required.')
    .isUUID()
    .withMessage('Member ID must be a valid UUID.'),
  body('trainer_id')
    .notEmpty()
    .withMessage('Trainer ID is required.')
    .isUUID()
    .withMessage('Trainer ID must be a valid UUID.'),
  body('start_date')
    .notEmpty()
    .withMessage('Start date is required.')
    .isISO8601()
    .withMessage('Start date must be a valid ISO8601 date (YYYY-MM-DD).'),
  body('end_date')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('End date must be a valid ISO8601 date (YYYY-MM-DD).')
    .custom((value, { req }) => {
      if (req.body.start_date && new Date(value) < new Date(req.body.start_date)) {
        throw new Error('End date must be greater than or equal to start date.');
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'cancelled'])
    .withMessage('Status must be active, completed, or cancelled.')
];

const updateTrainerAssignmentValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid assignment UUID in request parameter.'),
  body('member_id')
    .optional()
    .isUUID()
    .withMessage('Member ID must be a valid UUID.'),
  body('trainer_id')
    .optional()
    .isUUID()
    .withMessage('Trainer ID must be a valid UUID.'),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO8601 date (YYYY-MM-DD).'),
  body('end_date')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('End date must be a valid ISO8601 date (YYYY-MM-DD).')
    .custom((value, { req }) => {
      if (req.body.start_date && new Date(value) < new Date(req.body.start_date)) {
        throw new Error('End date must be greater than or equal to start date.');
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'cancelled'])
    .withMessage('Status must be active, completed, or cancelled.')
];

const statusValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid assignment UUID in request parameter.'),
  body('status')
    .notEmpty()
    .withMessage('Status is required.')
    .isIn(['active', 'completed', 'cancelled'])
    .withMessage('Status must be active, completed, or cancelled.')
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
  createTrainerAssignmentValidator,
  updateTrainerAssignmentValidator,
  statusValidator,
  validate
};
