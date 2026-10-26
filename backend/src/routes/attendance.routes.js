const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { protect } = require('../middleware/auth.middleware');
const { checkInValidator, checkOutValidator, validate } = require('../validators/attendance.validator');

// Secure all endpoints with JWT middleware
router.use(protect);

router.get('/', attendanceController.getAttendance);
router.post('/check-in', checkInValidator, validate, attendanceController.checkIn);

// Map both check-out variations to support different client calling conventions
router.patch('/:id/check-out', checkOutValidator, validate, attendanceController.checkOut);
router.patch('/:id/checkout', checkOutValidator, validate, attendanceController.checkOut);

router.delete('/:id', attendanceController.deleteAttendance);

module.exports = router;
