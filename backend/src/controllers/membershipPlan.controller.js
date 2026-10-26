const membershipPlanService = require('../services/membershipPlan.service');
const authService = require('../services/auth.service');

const getPlans = async (req, res, next) => {
  try {
    const { page, limit, search, status } = req.query;
    const result = await membershipPlanService.getAllPlans({ page, limit, search, status });
    
    return res.status(200).json({
      success: true,
      message: 'Membership plans retrieved successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await membershipPlanService.getPlanById(id);
    
    return res.status(200).json({
      success: true,
      message: 'Membership plan retrieved successfully.',
      data: { plan }
    });
  } catch (error) {
    if (error.message === 'Membership plan not found.') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const createPlan = async (req, res, next) => {
  try {
    const newPlan = await membershipPlanService.createPlan(req.body);
    const adminId = req.user.id;
    const ipAddress = req.ip;

    // Log action to activity_logs
    await authService.logActivity(adminId, 'CREATE_MEMBERSHIP_PLAN', ipAddress, {
      plan_id: newPlan.id,
      name: newPlan.name,
      price: newPlan.price,
      duration_months: newPlan.duration_months
    });

    return res.status(201).json({
      success: true,
      message: 'Membership plan created successfully.',
      data: { plan: newPlan }
    });
  } catch (error) {
    next(error);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedPlan = await membershipPlanService.updatePlan(id, req.body);
    const adminId = req.user.id;
    const ipAddress = req.ip;

    // Log action to activity_logs
    await authService.logActivity(adminId, 'UPDATE_MEMBERSHIP_PLAN', ipAddress, {
      plan_id: updatedPlan.id,
      name: updatedPlan.name,
      price: updatedPlan.price,
      duration_months: updatedPlan.duration_months
    });

    return res.status(200).json({
      success: true,
      message: 'Membership plan updated successfully.',
      data: { plan: updatedPlan }
    });
  } catch (error) {
    if (error.message === 'Membership plan not found.') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const ipAddress = req.ip;

    // Retrieve plan details before deletion for logging
    const plan = await membershipPlanService.getPlanById(id);

    await membershipPlanService.deletePlan(id);

    // Log action to activity_logs
    await authService.logActivity(adminId, 'DELETE_MEMBERSHIP_PLAN', ipAddress, {
      plan_id: id,
      name: plan.name
    });

    return res.status(200).json({
      success: true,
      message: 'Membership plan deleted successfully.'
    });
  } catch (error) {
    if (error.message === 'Membership plan not found.') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('Cannot delete')) {
      return res.status(409).json({
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
    const updatedPlan = await membershipPlanService.updatePlanStatus(id, status);
    const adminId = req.user.id;
    const ipAddress = req.ip;

    // Log action to activity_logs
    await authService.logActivity(adminId, 'UPDATE_MEMBERSHIP_PLAN_STATUS', ipAddress, {
      plan_id: id,
      status: status
    });

    return res.status(200).json({
      success: true,
      message: `Membership plan status changed to ${status} successfully.`,
      data: { plan: updatedPlan }
    });
  } catch (error) {
    if (error.message === 'Membership plan not found.') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

module.exports = {
  getPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
  updateStatus
};
