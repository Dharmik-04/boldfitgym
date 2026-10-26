const { body, validationResult } = require('express-validator');

const loginValidator = [
  body('usernameOrEmail')
    .trim()
    .notEmpty()
    .withMessage('Username or Email is required.'),
  body('password')
    .notEmpty()
    .withMessage('Password is required.')
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
  loginValidator,
  validate
};
