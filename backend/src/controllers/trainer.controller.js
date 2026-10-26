const trainerService = require('../services/trainer.service');
const authService = require('../services/auth.service');

const getTrainers = async (req, res, next) => {
  try {
    const { page, limit, search, status, specialization, sortBy } = req.query;
    const result = await trainerService.getAllTrainers({ page, limit, search, status, specialization, sortBy });

    return res.status(200).json({
      success: true,
      message: 'Trainers retrieved successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getTrainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const trainer = await trainerService.getTrainerById(id);

    return res.status(200).json({
      success: true,
      message: 'Trainer retrieved successfully.',
      data: { trainer }
    });
  } catch (error) {
    if (error.message === 'Trainer not found.') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const createTrainer = async (req, res, next) => {
  try {
    const result = await trainerService.createTrainer(req.body);
    const adminId = req.user.id;
    const ipAddress = req.ip;

    // Log the action to activity_logs
    await authService.logActivity(adminId, 'CREATE_TRAINER', ipAddress, {
      trainer_id: result.id,
      first_name: result.first_name,
      last_name: result.last_name,
      email: result.email
    });

    return res.status(201).json({
      success: true,
      message: 'Trainer created successfully.',
      data: { trainer: result }
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

const updateTrainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await trainerService.updateTrainer(id, req.body);
    const adminId = req.user.id;
    const ipAddress = req.ip;

    // Log the action to activity_logs
    await authService.logActivity(adminId, 'UPDATE_TRAINER', ipAddress, {
      trainer_id: result.id,
      first_name: result.first_name,
      last_name: result.last_name
    });

    return res.status(200).json({
      success: true,
      message: 'Trainer updated successfully.',
      data: { trainer: result }
    });
  } catch (error) {
    if (error.message === 'Trainer not found.') {
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

const deleteTrainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const ipAddress = req.ip;

    // Fetch details before deletion for logging
    const trainer = await trainerService.getTrainerById(id);

    await trainerService.deleteTrainer(id);

    // Log the action to activity_logs
    await authService.logActivity(adminId, 'DELETE_TRAINER', ipAddress, {
      trainer_id: id,
      first_name: trainer.first_name,
      last_name: trainer.last_name
    });

    return res.status(200).json({
      success: true,
      message: 'Trainer deleted successfully.'
    });
  } catch (error) {
    if (error.message === 'Trainer not found.') {
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
    const result = await trainerService.updateTrainerStatus(id, status);
    const adminId = req.user.id;
    const ipAddress = req.ip;

    // Log the action to activity_logs
    await authService.logActivity(adminId, 'UPDATE_TRAINER_STATUS', ipAddress, {
      trainer_id: result.id,
      status: status
    });

    return res.status(200).json({
      success: true,
      message: `Trainer status changed to ${status} successfully.`,
      data: { trainer: result }
    });
  } catch (error) {
    if (error.message === 'Trainer not found.') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

module.exports = {
  getTrainers,
  getTrainer,
  createTrainer,
  updateTrainer,
  deleteTrainer,
  updateStatus
};
