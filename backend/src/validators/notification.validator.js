const { body, param, validationResult } = require('express-validator');

const createNotificationValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Notification title is required.')
    .isLength({ max: 150 })
    .withMessage('Title cannot exceed 150 characters.'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Notification message is required.'),
  body('type')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Type cannot exceed 50 characters.'),
  body('member_id')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Member ID must be a valid UUID if provided.'),
  body('admin_id')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Admin ID must be a valid UUID if provided.')
];

const readNotificationValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid notification UUID in request parameter.')
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
  createNotificationValidator,
  readNotificationValidator,
  validate
};
