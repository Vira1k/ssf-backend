const express = require("express");

const router = express.Router();

const volunteerController =
    require("../controllers/volunteer.controller");

const authMiddleware =
    require("../middleware/auth.middleware");


// ======================================
// Get All Approved Volunteers
// ======================================

router.get(
    "/",
    volunteerController.getAllVolunteers
);


// ======================================
// Volunteer Dashboard
// ======================================

router.get(
    "/dashboard",
    authMiddleware,
    volunteerController.getDashboard
);
// ======================================
// Volunteer - Today's Class
// Lightweight endpoint for Add Report
// ======================================

router.get(
    "/today-class",
    authMiddleware,
    volunteerController.getTodayClass
);

// ======================================
// Volunteer - My Students
// ======================================

router.get(
    "/my-students",
    authMiddleware,
    volunteerController.getMyStudents
);


// ======================================
// Export Router
// ======================================

module.exports = router;