const settingsService = require('../services/settings.service');
const authService = require('../services/auth.service');

const getSettings = async (req, res, next) => {
  try {
    const result = await settingsService.getSettings();

    return res.status(200).json({
      success: true,
      message: 'Gym settings retrieved successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const payload = req.body;
    const result = await settingsService.updateSettings(payload);

    // Log activity
    const adminId = req.user ? req.user.id : null;
    const ipAddress = req.ip || '';
    if (adminId) {
      await authService.logActivity(adminId, 'UPDATE_GYM_SETTINGS', ipAddress, {
        updated_keys: Object.keys(payload)
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Gym settings updated successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings
};
