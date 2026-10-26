const authService = require('../services/auth.service');

const login = async (req, res, next) => {
  try {
    const { usernameOrEmail, password } = req.body;
    const ipAddress = req.ip;

    const result = await authService.login(usernameOrEmail, password, ipAddress);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: result
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Authentication failed.'
    });
  }
};

const logout = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const ipAddress = req.ip;

    // Log the logout action
    await authService.logActivity(adminId, 'LOGOUT', ipAddress);

    return res.status(200).json({
      success: true,
      message: 'Logout successful.'
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  me
};
