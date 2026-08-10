const express = require("express");

const router = express.Router();

const volunteerController =
    require("../controllers/volunteer.controller");

const authMiddleware =
    require("../middleware/auth.middleware");


// ======================================
// GET ALL APPROVED VOLUNTEERS
// ======================================

router.get(
    "/",
    volunteerController.getAllVolunteers
);


// ======================================
// VOLUNTEER DASHBOARD
// ======================================

router.get(
    "/dashboard",
    authMiddleware,
    volunteerController.getDashboard
);


// ======================================
// TODAY'S CLASS
// ======================================

router.get(
    "/today-class",
    authMiddleware,
    volunteerController.getTodayClass
);


// ======================================
// MY STUDENTS
// ======================================

router.get(
    "/my-students",
    authMiddleware,
    volunteerController.getMyStudents
);


module.exports = router;