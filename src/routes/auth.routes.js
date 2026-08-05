const express = require("express");

const router = express.Router();

const authController = require("../controllers/auth.controller");

const authMiddleware = require("../middleware/auth.middleware");

// Register
router.post("/register", authController.register);

// Login
router.post("/login", authController.login);

// Verify Token
router.get("/verify", authMiddleware, authController.verifyToken);

module.exports = router;