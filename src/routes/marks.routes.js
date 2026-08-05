const express = require("express");

const router = express.Router();

const marksController =
    require("../controllers/marks.controller");

const authMiddleware =
    require("../middleware/auth.middleware");


// ======================================
// SAVE MARKS
// ======================================

router.post(
    "/save",
    authMiddleware,
    marksController.saveMarks
);


// ======================================
// GET GROUP MARKS
// ======================================

router.get(
    "/my",
    authMiddleware,
    marksController.getMyMarks
); 

router.get(
    "/all",
    authMiddleware,
    marksController.getAllMarks
);

router.get(
    "/group/:groupId",
    authMiddleware,
    marksController.getGroupMarks
);


// ======================================
// GET STUDENT MARKS
// ======================================

router.get(
    "/student/:studentId",
    authMiddleware,
    marksController.getStudentMarks
);


// ======================================
// UPDATE MARKS
// ======================================

router.put(
    "/:id",
    authMiddleware,
    marksController.updateMarks
);


// ======================================
// DELETE MARKS
// ======================================

router.delete(
    "/:id",
    authMiddleware,
    marksController.deleteMarks
);

module.exports = router;