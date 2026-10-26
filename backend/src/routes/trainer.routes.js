const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainer.controller');
const { protect } = require('../middleware/auth.middleware');
const {
  createTrainerValidator,
  updateTrainerValidator,
  statusValidator,
  validate
} = require('../validators/trainer.validator');

// Protect all routes under this router using JWT middleware
router.use(protect);

router.get('/', trainerController.getTrainers);
router.get('/:id', trainerController.getTrainer);
router.post('/', createTrainerValidator, validate, trainerController.createTrainer);
router.put('/:id', updateTrainerValidator, validate, trainerController.updateTrainer);
router.delete('/:id', trainerController.deleteTrainer);
router.patch('/:id/status', statusValidator, validate, trainerController.updateStatus);

module.exports = router;
