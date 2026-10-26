const attendanceService = require('../services/attendance.service');
const authService = require('../services/auth.service');

const getAttendance = async (req, res, next) => {
  try {
    const { page, limit, search, status, date } = req.query;
    const result = await attendanceService.getAllAttendance({ page, limit, search, status, date });

    return res.status(200).json({
      success: true,
      message: 'Attendance logs retrieved successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const checkIn = async (req, res, next) => {
  try {
    const { member_id, attendance_date, check_in, status, device } = req.body;
    const record = await attendanceService.checkIn({ member_id, attendance_date, check_in, status, device });

    // Log activity
    const adminId = req.user ? req.user.id : null;
    const ipAddress = req.ip || '';
    if (adminId) {
      await authService.logActivity(adminId, 'MEMBER_CHECK_IN', ipAddress, {
        attendance_id: record.id,
        member_id,
        attendance_date: record.attendance_date
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Member checked in successfully.',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

const checkOut = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { check_out } = req.body;
    const record = await attendanceService.checkOut(id, { check_out });

    // Log activity
    const adminId = req.user ? req.user.id : null;
    const ipAddress = req.ip || '';
    if (adminId) {
      await authService.logActivity(adminId, 'MEMBER_CHECK_OUT', ipAddress, {
        attendance_id: id,
        member_id: record.member_id,
        attendance_date: record.attendance_date
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Member checked out successfully.',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

const deleteAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    await attendanceService.deleteAttendance(id);

    // Log activity
    const adminId = req.user ? req.user.id : null;
    const ipAddress = req.ip || '';
    if (adminId) {
      await authService.logActivity(adminId, 'DELETE_ATTENDANCE', ipAddress, {
        attendance_id: id
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAttendance,
  checkIn,
  checkOut,
  deleteAttendance
};
