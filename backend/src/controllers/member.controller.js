const memberService = require('../services/member.service');

const getMembers = async (req, res, next) => {
  try {
    const { page, limit, search, status, sortBy } = req.query;
    const result = await memberService.getAllMembers({ page, limit, search, status, sortBy });
    
    return res.status(200).json({
      success: true,
      message: 'Members retrieved successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const member = await memberService.getMemberById(id);
    
    return res.status(200).json({
      success: true,
      message: 'Member retrieved successfully.',
      data: { member }
    });
  } catch (error) {
    if (error.message === 'Member not found.') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const createMember = async (req, res, next) => {
  try {
    const newMember = await memberService.createMember(req.body);
    
    return res.status(201).json({
      success: true,
      message: 'Member created successfully.',
      data: { member: newMember }
    });
  } catch (error) {
    if (error.message.includes('already in use')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const updateMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedMember = await memberService.updateMember(id, req.body);
    
    return res.status(200).json({
      success: true,
      message: 'Member updated successfully.',
      data: { member: updatedMember }
    });
  } catch (error) {
    if (error.message === 'Member not found.') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('already in use')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const deleteMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    await memberService.deleteMember(id);
    
    return res.status(200).json({
      success: true,
      message: 'Member deleted successfully.'
    });
  } catch (error) {
    if (error.message === 'Member not found.') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedMember = await memberService.updateMemberStatus(id, status);
    
    return res.status(200).json({
      success: true,
      message: `Member status changed to ${status} successfully.`,
      data: { member: updatedMember }
    });
  } catch (error) {
    if (error.message === 'Member not found.') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

module.exports = {
  getMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
  updateStatus
};
