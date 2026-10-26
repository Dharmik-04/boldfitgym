const express = require('express');
const router = express.Router();
const trainerAssignmentController = require('../controllers/trainerAssignment.controller');
const { protect } = require('../middleware/auth.middleware');
const {
  createTrainerAssignmentValidator,
  updateTrainerAssignmentValidator,
  statusValidator,
  validate
} = require('../validators/trainerAssignment.validator');

// Protect all routes under this router using JWT middleware
router.use(protect);

router.get('/', trainerAssignmentController.getAssignments);
router.get('/:id', trainerAssignmentController.getAssignment);
router.post('/', createTrainerAssignmentValidator, validate, trainerAssignmentController.createAssignment);
router.put('/:id', updateTrainerAssignmentValidator, validate, trainerAssignmentController.updateAssignment);
router.delete('/:id', trainerAssignmentController.deleteAssignment);
router.patch('/:id/status', statusValidator, validate, trainerAssignmentController.updateStatus);

module.exports = router;
