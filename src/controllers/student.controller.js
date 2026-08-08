const prisma = require("../config/prisma");

// ======================================
// GET ALL STUDENTS
// ======================================
exports.getAllStudents = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;

        const [totalStudents, students] = await Promise.all([

            prisma.student.count({
                where: {
                    isActive: true
                }
            }),

            prisma.student.findMany({
                where: {
                    isActive: true
                },

                select: {
                    id: true,
                    studentCode: true,
                    fullName: true,
                    fatherName: true,
                    gender: true,
                    profilePhoto: true,
                    isActive: true,

                    group: {
                        select: {
                            id: true,
                            name: true,
                            camp: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                },

                orderBy: {
                    fullName: "asc"
                },

                skip: (page - 1) * limit,
                take: limit
            })

        ]);

        return res.status(200).json({
            success: true,

            count: students.length,
            totalStudents,

            currentPage: page,
            totalPages: Math.ceil(totalStudents / limit),
            limit,

            students
        });

    } catch (error) {

        console.error("GET STUDENTS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }
};

// ======================================
// ADD STUDENT
// ======================================
exports.addStudent = async (req, res) => {

    try {

        const {
            fullName,
            fatherName,
            motherName,
            gender,
            dob,
            phone,
            address,
            profilePhoto,
            groupId,
            isActive
        } = req.body;

        if (!fullName || !gender || !groupId) {

            return res.status(400).json({
                success: false,
                message: "Full Name, Gender and Group are required."
            });

        }

        // Check Group
        const group = await prisma.group.findUnique({
            where: {
                id: Number(groupId)
            }
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Selected group not found."
            });
        }

        // Generate Student Code
        const lastStudent = await prisma.student.findFirst({
            orderBy: {
                id: "desc"
            }
        });

        const nextNumber = lastStudent ? lastStudent.id + 1 : 1;

        const studentCode = `SSF${String(nextNumber).padStart(3, "0")}`;

        const student = await prisma.student.create({

            data: {

                studentCode,

                fullName: fullName.trim(),

                fatherName: fatherName || null,

                motherName: motherName || null,

                gender,

                dob: dob ? new Date(dob) : null,

                phone: phone || null,

                address: address || null,

                profilePhoto: profilePhoto || null,

                groupId: Number(groupId),

                isActive: isActive === undefined
                    ? true
                    : Boolean(isActive)

            }

        });

        return res.status(201).json({

            success: true,

            message: "Student Added Successfully.",

            student

        });

    } catch (error) {

        console.error("ADD STUDENT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }

};

// ======================================
// UPDATE STUDENT
// ======================================
exports.updateStudent = async (req, res) => {

    try {

        const id = Number(req.params.id);

        const {
            fullName,
            fatherName,
            motherName,
            gender,
            dob,
            phone,
            address,
            profilePhoto,
            groupId,
            isActive
        } = req.body;

        const existingStudent = await prisma.student.findUnique({
            where: {
                id
            }
        });

        if (!existingStudent) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        const group = await prisma.group.findUnique({
            where: {
                id: Number(groupId)
            }
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Selected group not found."
            });
        }

        const student = await prisma.student.update({

            where: {
                id
            },

            data: {

                fullName: fullName.trim(),

                fatherName: fatherName || null,

                motherName: motherName || null,

                gender,

                dob: dob ? new Date(dob) : null,

                phone: phone || null,

                address: address || null,

                profilePhoto: profilePhoto || null,

                groupId: Number(groupId),

                isActive: isActive === undefined
                    ? existingStudent.isActive
                    : Boolean(isActive)

            }

        });

        return res.status(200).json({

            success: true,

            message: "Student Updated Successfully.",

            student

        });

    } catch (error) {

        console.error("UPDATE STUDENT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }

};

// ======================================
// DELETE STUDENT (SOFT DELETE)
// ======================================
exports.deleteStudent = async (req, res) => {

    try {

        const id = Number(req.params.id);

        const existingStudent = await prisma.student.findUnique({
            where: {
                id
            }
        });

        if (!existingStudent) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        await prisma.student.update({

            where: {
                id
            },

            data: {
                isActive: false
            }

        });

        return res.status(200).json({

            success: true,

            message: "Student deactivated successfully."

        });

    } catch (error) {

        console.error("DELETE STUDENT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }

};