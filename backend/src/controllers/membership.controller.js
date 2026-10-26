const membershipService = require('../services/membership.service');
const authService = require('../services/auth.service');

const getMemberships = async (req, res, next) => {
  try {
    const { page, limit, search, status, plan, sortBy } = req.query;
    const result = await membershipService.getAllMemberships({ page, limit, search, status, plan, sortBy });

    return res.status(200).json({
      success: true,
      message: 'Memberships retrieved successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getMembership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const membership = await membershipService.getMembershipById(id);

    return res.status(200).json({
      success: true,
      message: 'Membership retrieved successfully.',
      data: { membership }
    });
  } catch (error) {
    if (error.message === 'Membership not found.') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const createMembership = async (req, res, next) => {
  try {
    const result = await membershipService.createMembership(req.body);
    const adminId = req.user.id;
    const ipAddress = req.ip;

    // Log the action to activity_logs
    await authService.logActivity(adminId, 'CREATE_MEMBERSHIP', ipAddress, {
      membership_id: result.id,
      member_id: result.member_id,
      plan_id: result.plan_id
    });

    return res.status(201).json({
      success: true,
      message: 'Membership assigned successfully.',
      data: { membership: result }
    });
  } catch (error) {
    if (
      error.message === 'Member not found.' ||
      error.message === 'Membership plan not found.' ||
      error.message === 'Member already has an active membership.'
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const updateMembership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await membershipService.updateMembership(id, req.body);
    const adminId = req.user.id;
    const ipAddress = req.ip;

    // Log the action to activity_logs
    await authService.logActivity(adminId, 'UPDATE_MEMBERSHIP', ipAddress, {
      membership_id: result.id,
      plan_id: result.plan_id,
      status: result.status
    });

    return res.status(200).json({
      success: true,
      message: 'Membership updated successfully.',
      data: { membership: result }
    });
  } catch (error) {
    if (error.message === 'Membership not found.') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (
      error.message === 'Member not found.' ||
      error.message === 'Membership plan not found.' ||
      error.message === 'Member already has an active membership.'
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const deleteMembership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const ipAddress = req.ip;

    // Fetch details before deletion for logging
    const membership = await membershipService.getMembershipById(id);

    await membershipService.deleteMembership(id);

    // Log the action to activity_logs
    await authService.logActivity(adminId, 'DELETE_MEMBERSHIP', ipAddress, {
      membership_id: id,
      member_id: membership.member_id
    });

    return res.status(200).json({
      success: true,
      message: 'Membership deleted successfully.'
    });
  } catch (error) {
    if (error.message === 'Membership not found.') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const updateMembershipStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await membershipService.updateMembershipStatus(id, status);
    const adminId = req.user.id;
    const ipAddress = req.ip;

    // Log the action to activity_logs
    await authService.logActivity(adminId, 'UPDATE_MEMBERSHIP_STATUS', ipAddress, {
      membership_id: result.id,
      status: status
    });

    return res.status(200).json({
      success: true,
      message: `Membership status changed to ${status} successfully.`,
      data: { membership: result }
    });
  } catch (error) {
    if (error.message === 'Membership not found.') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message === 'Member already has an active membership.') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

module.exports = {
  getMemberships,
  getMembership,
  createMembership,
  updateMembership,
  deleteMembership,
  updateMembershipStatus
};
