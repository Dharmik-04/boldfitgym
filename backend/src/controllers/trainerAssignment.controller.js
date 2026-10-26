const trainerAssignmentService = require('../services/trainerAssignment.service');
const authService = require('../services/auth.service');

const getAssignments = async (req, res, next) => {
  try {
    const { page, limit, status, trainer_id, member_id } = req.query;
    const result = await trainerAssignmentService.getAllAssignments({ page, limit, status, trainer_id, member_id });

    return res.status(200).json({
      success: true,
      message: 'Trainer assignments retrieved successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignment = await trainerAssignmentService.getAssignmentById(id);

    return res.status(200).json({
      success: true,
      message: 'Trainer assignment retrieved successfully.',
      data: { assignment }
    });
  } catch (error) {
    if (error.message === 'Trainer assignment not found.') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const createAssignment = async (req, res, next) => {
  try {
    const result = await trainerAssignmentService.createAssignment(req.body);
    const adminId = req.user.id;
    const ipAddress = req.ip;

    // Log the action to activity_logs
    await authService.logActivity(adminId, 'CREATE_TRAINER_ASSIGNMENT', ipAddress, {
      assignment_id: result.id,
      member_id: result.member_id,
      trainer_id: result.trainer_id
    });

    return res.status(201).json({
      success: true,
      message: 'Trainer assigned successfully.',
      data: { assignment: result }
    });
  } catch (error) {
    if (
      error.message === 'Member not found.' ||
      error.message === 'Trainer not found.' ||
      error.message === 'End date must be greater than or equal to start date.' ||
      error.message === 'Member already has an active assignment with this trainer.'
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const updateAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await trainerAssignmentService.updateAssignment(id, req.body);
    const adminId = req.user.id;
    const ipAddress = req.ip;

    // Log the action to activity_logs
    await authService.logActivity(adminId, 'UPDATE_TRAINER_ASSIGNMENT', ipAddress, {
      assignment_id: result.id,
      trainer_id: result.trainer_id,
      status: result.status
    });

    return res.status(200).json({
      success: true,
      message: 'Trainer assignment updated successfully.',
      data: { assignment: result }
    });
  } catch (error) {
    if (error.message === 'Trainer assignment not found.') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (
      error.message === 'Member not found.' ||
      error.message === 'Trainer not found.' ||
      error.message === 'End date must be greater than or equal to start date.' ||
      error.message === 'Member already has an active assignment with this trainer.'
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const ipAddress = req.ip;

    // Fetch details before deletion for logging
    const assignment = await trainerAssignmentService.getAssignmentById(id);

    await trainerAssignmentService.deleteAssignment(id);

    // Log the action to activity_logs
    await authService.logActivity(adminId, 'DELETE_TRAINER_ASSIGNMENT', ipAddress, {
      assignment_id: id,
      member_id: assignment.member_id
    });

    return res.status(200).json({
      success: true,
      message: 'Trainer assignment deleted successfully.'
    });
  } catch (error) {
    if (error.message === 'Trainer assignment not found.') {
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
    const result = await trainerAssignmentService.updateAssignmentStatus(id, status);
    const adminId = req.user.id;
    const ipAddress = req.ip;

    // Log the action to activity_logs
    await authService.logActivity(adminId, 'UPDATE_TRAINER_ASSIGNMENT_STATUS', ipAddress, {
      assignment_id: result.id,
      status: status
    });

    return res.status(200).json({
      success: true,
      message: `Trainer assignment status changed to ${status} successfully.`,
      data: { assignment: result }
    });
  } catch (error) {
    if (error.message === 'Trainer assignment not found.') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message === 'Member already has an active assignment with this trainer.') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

module.exports = {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  updateStatus
};
