const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/auth.middleware");

const profileController =
    require("../controllers/profile.controller");


// ======================================
// MY PROFILE
// Admin + Volunteer
// ======================================

router.get(
    "/me",
    authMiddleware,
    profileController.getMyProfile
);


// ======================================
// UPDATE MY PROFILE
// ======================================

router.put(
    "/me",
    authMiddleware,
    profileController.updateMyProfile
);


// ======================================
// ADMIN - VIEW VOLUNTEER PROFILE
// ======================================

router.get(
    "/volunteer/:id",
    authMiddleware,
    profileController.getVolunteerProfile
);


// ======================================
// EXPORT
// ======================================

module.exports = router;