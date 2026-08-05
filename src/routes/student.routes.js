const express = require("express");

const router = express.Router();

const studentController = require("../controllers/student.controller");

// ======================================
// GET ALL STUDENTS
// ======================================

router.get(
    "/",
    studentController.getAllStudents
);

// ======================================
// ADD STUDENT
// ======================================

router.post(
    "/",
    studentController.addStudent
);

// ======================================
// UPDATE STUDENT
// ======================================

router.put(
    "/:id",
    studentController.updateStudent
);

// ======================================
// DELETE STUDENT
// ======================================

router.delete(
    "/:id",
    studentController.deleteStudent
);

module.exports = router;