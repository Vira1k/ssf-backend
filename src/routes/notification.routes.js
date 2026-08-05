const express = require("express");

const router = express.Router();


const notificationController =
    require("../controllers/notification.controller");


const authMiddleware =
    require("../middleware/auth.middleware");




// ======================================
// GET TODAY'S CLASS NOTIFICATION
// ======================================

router.get(

    "/today/:volunteerId",

    notificationController.getTodayNotification

);






// ======================================
// SAVE PUSH NOTIFICATION SUBSCRIPTION
// ======================================

router.post(

    "/subscribe",

    authMiddleware,

    notificationController.saveSubscription

);





module.exports = router;