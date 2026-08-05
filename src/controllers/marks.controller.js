const prisma = require("../config/prisma");

// ======================================
// GET TODAY NAME
// ======================================

const getTodayDay = () => {

    const days = [
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY"
    ];

    return days[new Date().getDay()];

};


// ======================================
// SAVE MARKS
// ======================================

exports.saveMarks = async (req, res) => {

    try {

        const volunteerId =
            Number(req.user.id);

        const {
            exam,
            subject,
            maxMarks,
            marks
        } = req.body;


        // ======================================
        // VALIDATION
        // ======================================

        if (
            !exam ||
            !subject ||
            !maxMarks ||
            !Array.isArray(marks) ||
            marks.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Exam, subject, maximum marks and student marks are required."

            });

        }


        // ======================================
        // GET TODAY
        const schedule =
    await prisma.schedule.findFirst({

        where: {

            volunteerId,

            status: "ACTIVE"

        }

    });


        if (!schedule) {

            return res.status(404).json({

                success: false,

                message:
                    "No class scheduled today."

            });

        }


        // ======================================
        // VALIDATE STUDENTS
        // ======================================

        const studentIds =
            marks.map(
                item => Number(item.studentId)
            );


        const students =
            await prisma.student.findMany({

                where: {

                    id: {

                        in: studentIds

                    },

                    groupId:
                        schedule.groupId,

                    isActive: true

                },

                select: {

                    id: true

                }

            });


        if (
            students.length !== studentIds.length
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid student data."

            });

        }


        // ======================================
        // SAVE MARKS
        // ======================================

        await prisma.$transaction(

            async (tx) => {

                for (const item of marks) {

                    await tx.mark.deleteMany({

                        where: {

                            exam,

                            subject,

                            studentId:
                                Number(item.studentId)

                        }

                    });


                    await tx.mark.create({

                        data: {

                            exam,

                            subject,

                            marks:
                                Number(item.marks),

                            maxMarks:
                                Number(maxMarks),

                            remarks:
                                item.remarks || null,

                            studentId:
                                Number(item.studentId),

                            volunteerId

                        }

                    });

                }

            }

        );


        // ======================================
        // SUCCESS
        // ======================================

        return res.status(201).json({

            success: true,

            message:
                "Marks saved successfully."

        });

    }

    catch (error) {

        console.error(
            "Save Marks Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to save marks."

        });

    }

};
// ======================================
// GET GROUP MARKS
// ======================================
// ======================================
// GET MY MARKS
// ======================================

exports.getMyMarks = async (req, res) => {

    try {

        const volunteerId = Number(req.user.id);

        const exam = req.query.exam;

        const subject = req.query.subject;

        const where = {

            volunteerId

        };

        if (exam) {

            where.exam = exam;

        }

        if (subject) {

            where.subject = subject;

        }

        const marks = await prisma.mark.findMany({

            where,

            include: {

                student: {

                    select: {

                        id: true,
                        studentCode: true,
                        fullName: true

                    }

                }

            },

            orderBy: [

                {

                    exam: "asc"

                },

                {

                    createdAt: "desc"

                }

            ]

        });

        return res.status(200).json({

            success: true,

            count: marks.length,

            data: marks

        });

    }

    catch (error) {

        console.error("Get My Marks Error:", error);

        return res.status(500).json({

            success: false,

            message: "Unable to fetch marks."

        });

    }

};
// ======================================
// GET ALL MARKS (ADMIN)
// ======================================

exports.getAllMarks = async (req, res) => {

    try {

        const {
            student,
            group,
            subject,
            exam
        } = req.query;

        const where = {};

        if (student) {

            where.student = {
                name: {
                    contains: student,
                    mode: "insensitive"
                }
            };

        }

        if (group) {

            where.student = {
                ...(where.student || {}),
                groupId: group
            };

        }

        if (subject) {

            where.subject = subject;

        }

        if (exam) {

            where.exam = exam;

        }

        const marks = await prisma.mark.findMany({

            where,

            include: {

                student: {
                    select: {
                        id: true,
                       fullName: true,
                        group: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },

             volunteer: {
    select: {
        id: true,
        fullName: true
    }
},

            },

            orderBy: {
                createdAt: "desc"
            }

        });

        res.json(marks);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to load marks."

        });

    }

};

exports.getGroupMarks = async (req, res) => {

    try {

        const groupId =
            Number(req.params.groupId);

        const exam =
            req.query.exam;

        const subject =
            req.query.subject;

        if (!groupId) {

            return res.status(400).json({

                success: false,

                message:
                    "Valid group ID is required."

            });

        }

        const where = {

            student: {

                groupId,

                isActive: true

            }

        };

        if (exam) {

            where.exam = exam;

        }

        if (subject) {

            where.subject = subject;

        }

        const marks =
            await prisma.mark.findMany({

                where,

                include: {

                    student: {

                        select: {

                            id: true,

                            studentCode: true,

                            fullName: true

                        }

                    },

                    volunteer: {

                        select: {

                            id: true,

                            fullName: true

                        }

                    }

                },

                orderBy: [

                    {

                        student: {

                            fullName: "asc"

                        }

                    },

                    {

                        createdAt: "desc"

                    }

                ]

            });

        return res.status(200).json({

            success: true,

            count:
                marks.length,

            data:
                marks

        });

    }

    catch (error) {

        console.error(
            "Get Group Marks Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch group marks."

        });

    }

};


// ======================================
// GET STUDENT MARKS
// ======================================

exports.getStudentMarks = async (req, res) => {

    try {

        const studentId =
            Number(req.params.studentId);

        if (!studentId) {

            return res.status(400).json({

                success: false,

                message:
                    "Valid student ID is required."

            });

        }

        const marks =
            await prisma.mark.findMany({

                where: {

                    studentId

                },

                include: {

                    volunteer: {

                        select: {

                            id: true,

                            fullName: true

                        }

                    }

                },

                orderBy: {

                    createdAt:
                        "desc"

                }

            });

        return res.status(200).json({

            success: true,

            count:
                marks.length,

            data:
                marks

        });

    }

    catch (error) {

        console.error(
            "Get Student Marks Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch student marks."

        });

    }

};
// ======================================
// UPDATE MARKS
// ======================================

exports.updateMarks = async (req, res) => {

    try {

        const id =
            Number(req.params.id);

        const {
            exam,
            subject,
            marks,
            maxMarks,
            remarks
        } = req.body;

        const existingMark =
            await prisma.mark.findUnique({

                where: {

                    id

                }

            });

        if (!existingMark) {

            return res.status(404).json({

                success: false,

                message:
                    "Marks record not found."

            });

        }

        const updatedMark =
            await prisma.mark.update({

                where: {

                    id

                },

                data: {

                    exam,

                    subject,

                    marks:
                        Number(marks),

                    maxMarks:
                        Number(maxMarks),

                    remarks:
                        remarks || null

                }

            });

        return res.status(200).json({

            success: true,

            message:
                "Marks updated successfully.",

            data:
                updatedMark

        });

    }

    catch (error) {

        console.error(
            "Update Marks Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to update marks."

        });

    }

};


// ======================================
// DELETE MARKS
// ======================================

exports.deleteMarks = async (req, res) => {

    try {

        const id =
            Number(req.params.id);

        const existingMark =
            await prisma.mark.findUnique({

                where: {

                    id

                }

            });

        if (!existingMark) {

            return res.status(404).json({

                success: false,

                message:
                    "Marks record not found."

            });

        }

        await prisma.mark.delete({

            where: {

                id

            }

        });

        return res.status(200).json({

            success: true,

            message:
                "Marks deleted successfully."

        });

    }

    catch (error) {

        console.error(
            "Delete Marks Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to delete marks."

        });

    }

};