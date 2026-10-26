const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { protect } = require('../middleware/auth.middleware');
const { updateSettingsValidator, validate } = require('../validators/settings.validator');

// Secure all endpoints with JWT middleware
router.use(protect);

router.get('/', settingsController.getSettings);
router.put('/', updateSettingsValidator, validate, settingsController.updateSettings);

module.exports = router;
