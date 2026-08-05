const express = require("express");

const router = express.Router();

const scheduleController =
    require("../controllers/schedule.controller");


// ======================================
// GET ALL SCHEDULES
// ======================================

router.get(
    "/",
    scheduleController.getAllSchedules
);



// ======================================
// TODAY CAMP REMINDER
// ======================================

router.get(
    "/today-reminder/:camp",
    scheduleController.getTodayReminder
);



// ======================================
// CREATE SCHEDULE
// ======================================

router.post(
    "/",
    scheduleController.createSchedule
);



// ======================================
// UPDATE SCHEDULE
// ======================================

router.put(
    "/:id",
    scheduleController.updateSchedule
);



// ======================================
// DELETE SCHEDULE
// ======================================

router.delete(
    "/:id",
    scheduleController.deleteSchedule
);



module.exports = router;