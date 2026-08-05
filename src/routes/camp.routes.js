const express = require("express");

const router = express.Router();

const campController = require("../controllers/camp.controller");

// =====================================
// Get All Camps
// =====================================
router.get("/", campController.getAllCamps);

// =====================================
// Create Camp
// =====================================
router.post("/", campController.createCamp);

// =====================================
// Update Camp
// =====================================
router.put("/:id", campController.updateCamp);

// =====================================
// Delete Camp
// =====================================
router.delete("/:id", campController.deleteCamp);

module.exports = router;