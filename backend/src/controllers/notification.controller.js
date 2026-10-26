const notificationService = require('../services/notification.service');
const authService = require('../services/auth.service');

const getNotifications = async (req, res, next) => {
  try {
    const adminId = req.user ? req.user.id : null;
    const { page, limit } = req.query;

    const result = await notificationService.getAllNotifications({
      adminId,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const createNotification = async (req, res, next) => {
  try {
    const { title, message, type, member_id, admin_id } = req.body;
    const record = await notificationService.createNotification({
      title,
      message,
      type,
      member_id,
      admin_id
    });

    // Log activity
    const curAdminId = req.user ? req.user.id : null;
    const ipAddress = req.ip || '';
    if (curAdminId) {
      await authService.logActivity(curAdminId, 'CREATE_NOTIFICATION', ipAddress, {
        notification_id: record.id,
        title: record.title
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Notification generated successfully.',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await notificationService.markAsRead(id);

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    await notificationService.deleteNotification(id);

    // Log activity
    const curAdminId = req.user ? req.user.id : null;
    const ipAddress = req.ip || '';
    if (curAdminId) {
      await authService.logActivity(curAdminId, 'DELETE_NOTIFICATION', ipAddress, {
        notification_id: id
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
  deleteNotification
};
