const express = require('express');
const router = express.Router();
const membershipPlanController = require('../controllers/membershipPlan.controller');
const { protect } = require('../middleware/auth.middleware');
const {
  createMembershipPlanValidator,
  updateMembershipPlanValidator,
  statusValidator,
  validate
} = require('../validators/membershipPlan.validator');

// Protect all routes under this router using JWT middleware
router.use(protect);

router.get('/', membershipPlanController.getPlans);
router.get('/:id', membershipPlanController.getPlan);
router.post('/', createMembershipPlanValidator, validate, membershipPlanController.createPlan);
router.put('/:id', updateMembershipPlanValidator, validate, membershipPlanController.updatePlan);
router.delete('/:id', membershipPlanController.deletePlan);
router.patch('/:id/status', statusValidator, validate, membershipPlanController.updateStatus);

module.exports = router;
