const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/auth.middleware");

const analyticsController =
    require("../controllers/analytics.controller");


// ======================================
// DOWNLOAD ANALYTICS PDF
// ADMIN → ALL
// VOLUNTEER → ASSIGNED GROUP
// ======================================

router.get(
    "/download",
    authMiddleware,
    analyticsController.downloadAnalyticsPDF
);


// ======================================
// GET ANALYTICS
// ADMIN → ALL
// VOLUNTEER → ASSIGNED GROUP
// ======================================

router.get(
    "/",
    authMiddleware,
    analyticsController.getAnalytics
);


// ======================================
// EXPORT
// ======================================

module.exports = router;