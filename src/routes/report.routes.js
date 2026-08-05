const express = require("express");

const router = express.Router();


// ======================================
// CONTROLLER IMPORT
// ======================================

const reportController =
require("../controllers/report.controller");


// ======================================
// MIDDLEWARE
// ======================================

const authMiddleware =
require("../middleware/auth.middleware");



// ======================================
// DOWNLOAD REPORTS PDF
// ======================================

router.get(
    "/download",
    authMiddleware,
    reportController.downloadReportsPDF
);



// ======================================
// GET ALL TEACHING REPORTS (Admin)
// ======================================

router.get(
    "/",
    authMiddleware,
    reportController.getAllReports
);



// ======================================
// ADD TEACHING REPORT (Volunteer)
// ======================================

router.post(
    "/",
    authMiddleware,
    reportController.addReport
);



// ======================================
// EXPORT ROUTER
// ======================================

module.exports = router;