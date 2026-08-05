const prisma = require("../config/prisma");

// ======================================
// GET ALL PENDING VOLUNTEERS
// ======================================

exports.getPendingVolunteers = async (req, res) => {

    try {

        const volunteers = await prisma.user.findMany({

            where: {

                role: "VOLUNTEER",

                status: "PENDING"

            },

            select: {

                id: true,

                fullName: true,

                mobile: true,

                email: true,

                gender: true,

                status: true,

                createdAt: true

            }

        });

        return res.status(200).json({

            success: true,

            count: volunteers.length,

            volunteers

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};

// ======================================
// APPROVE VOLUNTEER
// ======================================

exports.approveVolunteer = async (req, res) => {

    try {

        const { id } = req.params;

        const volunteer = await prisma.user.update({

            where: {

                id: Number(id)

            },

            data: {

                status: "APPROVED"

            }

        });

        return res.status(200).json({

            success: true,

            message: "Volunteer approved successfully.",

            volunteer

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};

// ======================================
// REJECT VOLUNTEER
// ======================================

exports.rejectVolunteer = async (req, res) => {

    try {

        const { id } = req.params;

        const volunteer = await prisma.user.update({

            where: {

                id: Number(id)

            },

            data: {

                status: "REJECTED"

            }

        });

        return res.status(200).json({

            success: true,

            message: "Volunteer rejected successfully.",

            volunteer

        });

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};
// ======================================
// DASHBOARD STATISTICS
// ======================================

exports.getDashboardStats = async (req, res) => {

    try {

        const totalVolunteers = await prisma.user.count({

            where: {

                role: "VOLUNTEER",

                status: "APPROVED"

            }

        });

        const pendingVolunteers = await prisma.user.count({

            where: {

                role: "VOLUNTEER",

                status: "PENDING"

            }

        });

        const totalStudents = await prisma.student.count();

        const totalGroups = await prisma.group.count();

        return res.status(200).json({

            success: true,

            totalVolunteers,

            pendingVolunteers,

            totalStudents,

            totalGroups

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};
// ======================================
// GET ALL VOLUNTEERS
// ======================================

exports.getAllVolunteers = async (req, res) => {

    try {

        const volunteers = await prisma.user.findMany({

            where: {

                role: "VOLUNTEER"

            },

            orderBy: {

                createdAt: "desc"

            },

            select: {

                id: true,

                fullName: true,

                mobile: true,

                email: true,

                gender: true,

                status: true,

                isActive: true,

                createdAt: true

            }

        });

        return res.status(200).json({

            success: true,

            count: volunteers.length,

            volunteers

        });

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};
// =======================================
// Get Approved Volunteers
// =======================================

exports.getApprovedVolunteers = async (req, res) => {

    try {

        const volunteers = await prisma.user.findMany({

            where: {

                role: "VOLUNTEER",

                status: "APPROVED",

                isActive: true

            },

            select: {

                id: true,

                fullName: true,

                mobile: true

            },

            orderBy: {

                fullName: "asc"

            }

        });

        res.json({

            success: true,

            data: volunteers

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: "Unable to fetch approved volunteers."

        });

    }

};