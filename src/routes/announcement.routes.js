const express = require("express");

const router = express.Router();


const announcementController =
    require("../controllers/announcement.controller");



// ================================
// CREATE ANNOUNCEMENT
// ================================

router.post(
    "/",
    announcementController.createAnnouncement
);



// ================================
// GET ALL ANNOUNCEMENTS (ADMIN)
// ================================

router.get(
    "/",
    announcementController.getAnnouncements
);



// ================================
// GET VOLUNTEER ANNOUNCEMENTS
// ================================

router.get(
    "/volunteer",
    announcementController.getVolunteerAnnouncements
);



module.exports = router;