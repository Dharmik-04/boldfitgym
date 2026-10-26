const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membership.controller');
const { protect } = require('../middleware/auth.middleware');
const {
  createMembershipValidator,
  updateMembershipValidator,
  statusValidator,
  validate
} = require('../validators/membership.validator');

// Protect all routes under this router using JWT middleware
router.use(protect);

router.get('/', membershipController.getMemberships);
router.get('/:id', membershipController.getMembership);
router.post('/', createMembershipValidator, validate, membershipController.createMembership);
router.put('/:id', updateMembershipValidator, validate, membershipController.updateMembership);
router.delete('/:id', membershipController.deleteMembership);
router.patch('/:id/status', statusValidator, validate, membershipController.updateMembershipStatus);

module.exports = router;
