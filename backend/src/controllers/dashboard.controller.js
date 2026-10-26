const dashboardService = require('../services/dashboard.service');

const getDashboardData = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboardStats();
    return res.status(200).json({
      success: true,
      message: 'Dashboard statistics loaded successfully.',
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to load dashboard metrics.'
    });
  }
};

module.exports = {
  getDashboardData
};
