const express = require("express");

const router = express.Router();

const groupController = require("../controllers/group.controller");

// =====================================
// Get Groups Dropdown
// =====================================
router.get("/dropdown", groupController.getGroupsDropdown);

// =====================================
// Get All Groups
// =====================================
router.get("/", groupController.getAllGroups);

// =====================================
// Get Students of a Group
// =====================================
router.get("/:groupId/students", groupController.getGroupStudents);

// =====================================
// Create Group
// =====================================
router.post("/", groupController.createGroup);

// =====================================
// Update Group
// =====================================
router.put("/:id", groupController.updateGroup);

// =====================================
// Delete Group
// =====================================
router.delete("/:id", groupController.deleteGroup);

module.exports = router;