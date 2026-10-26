const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');
const { createNotificationValidator, readNotificationValidator, validate } = require('../validators/notification.validator');

// Secure all endpoints with JWT middleware
router.use(protect);

router.get('/', notificationController.getNotifications);
router.post('/', createNotificationValidator, validate, notificationController.createNotification);
router.patch('/:id/read', readNotificationValidator, validate, notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
