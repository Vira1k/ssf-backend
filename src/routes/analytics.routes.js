const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/auth.middleware");

const analyticsController =
    require("../controllers/analytics.controller");

// ======================================
// DOWNLOAD ANALYTICS PDF
// ======================================

router.get(
    "/download",
    analyticsController.downloadAnalyticsPDF
);
// ======================================
// ADMIN ANALYTICS
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