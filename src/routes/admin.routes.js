const express = require("express");

const router = express.Router();

const adminController = require("../controllers/admin.controller");

// ======================================
// DASHBOARD STATISTICS
// ======================================

router.get(
    "/dashboard-stats",
    adminController.getDashboardStats
);

// ======================================
// GET ALL VOLUNTEERS
// ======================================

router.get(
    "/volunteers",
    adminController.getAllVolunteers
);

// ======================================
// GET ALL PENDING VOLUNTEERS
// ======================================

router.get(
    "/pending-volunteers",
    adminController.getPendingVolunteers
);

// ======================================
// GET APPROVED VOLUNTEERS
// ======================================

router.get(
    "/approved-volunteers",
    adminController.getApprovedVolunteers
);

// ======================================
// APPROVE VOLUNTEER
// ======================================

router.patch(
    "/approve/:id",
    adminController.approveVolunteer
);

// ======================================
// REJECT VOLUNTEER
// ======================================

router.patch(
    "/reject/:id",
    adminController.rejectVolunteer
);

module.exports = router;