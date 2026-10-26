const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { loginValidator, validate } = require('../validators/auth.validator');
const { protect, loginRateLimiter } = require('../middleware/auth.middleware');

router.post('/login', loginRateLimiter, loginValidator, validate, authController.login);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.me);

module.exports = router;
