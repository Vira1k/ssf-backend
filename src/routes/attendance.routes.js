const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/auth.middleware");

const attendanceController =
    require("../controllers/attendance.controller");


// ======================================
// VOLUNTEER ROUTES
// ======================================

// Get today's attendance students
router.get(
    "/today",
    authMiddleware,
    attendanceController.getTodayAttendance
);


// Save attendance
router.post(
    "/",
    authMiddleware,
    attendanceController.saveAttendance
);


// Volunteer attendance history
router.get(
    "/history",
    authMiddleware,
    attendanceController.getAttendanceHistory
);


// ======================================
// ADMIN ROUTES
// ======================================

// Volunteer Attendance Report
router.get(
    "/admin/volunteers",
    authMiddleware,
    attendanceController.getAdminVolunteerAttendance
);


// Student Attendance Report
// IMPORTANT: Keep this dynamic route at the bottom
router.get(
    "/:groupId/:attendanceDate",
    authMiddleware,
    attendanceController.getAttendanceByDate
);


// ======================================
// EXPORT
// ======================================

module.exports = router;