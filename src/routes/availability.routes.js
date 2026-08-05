const express = require("express");

const router = express.Router();


const availabilityController =
require("../controllers/availability.controller");


const authMiddleware =
require("../middleware/auth.middleware");




// ======================================
// Volunteer confirms availability
// ======================================

router.post(

    "/confirm",

    authMiddleware,

    availabilityController.confirmAvailability

);






// ======================================
// Volunteer marks unavailable
// ======================================

router.post(

    "/unavailable",

    authMiddleware,

    availabilityController.markUnavailable

);






// ======================================
// Admin gets unavailable volunteers
// ======================================

router.get(

    "/admin",

    authMiddleware,

    availabilityController.getUnavailableVolunteers

);






// ======================================
// Volunteer availability history
// ======================================

router.get(

    "/volunteer",

    authMiddleware,

    availabilityController.getVolunteerAvailability

);






module.exports = router;