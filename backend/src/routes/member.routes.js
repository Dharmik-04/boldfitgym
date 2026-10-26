const express = require('express');
const router = express.Router();
const memberController = require('../controllers/member.controller');
const { protect } = require('../middleware/auth.middleware');
const { createMemberValidator, updateMemberValidator, statusValidator, validate } = require('../validators/member.validator');

router.use(protect); // protect all routes

router.get('/', memberController.getMembers);
router.get('/:id', memberController.getMember);
router.post('/', createMemberValidator, validate, memberController.createMember);
router.put('/:id', updateMemberValidator, validate, memberController.updateMember);
router.delete('/:id', memberController.deleteMember);
router.patch('/:id/status', statusValidator, validate, memberController.updateStatus);

module.exports = router;
