const prisma = require("../config/prisma");

// ======================================
// DASHBOARD CACHE
// ======================================

let dashboardCache = null;
let dashboardCacheTime = 0;

const CACHE_DURATION = 60000;

// ======================================
// PENDING CACHE
// ======================================

let pendingCache = null;
let pendingCacheTime = 0;

const PENDING_CACHE_DURATION = 60000;
exports.getAllVolunteers = async (req, res) => {

    try {

        const volunteers = await prisma.user.findMany({

            where: {
                role: "VOLUNTEER"
            },

           select: {
    id: true,
    fullName: true,
    mobile: true,
    email: true,
    status: true
},

            orderBy: {
                fullName: "asc"
            }

        });

        return res.status(200).json({

            success: true,

            volunteers

        });

    } catch (error) {

        console.error("getAllVolunteers:", error);

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

        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {

            return res.status(400).json({
                success: false,
                message: "Invalid volunteer ID."
            });

        }

        const updatedVolunteer = await prisma.user.update({

            where: {
                id
            },

            data: {
                status: "APPROVED"
            },

            select: {
                id: true,
                fullName: true,
                mobile: true,
                email: true,
                status: true
            }

        });

      // Clear Dashboard Cache
dashboardCache = null;
dashboardCacheTime = 0;

// Clear Pending Cache
pendingCache = null;
pendingCacheTime = 0;

        return res.status(200).json({

            success: true,

            message: "Volunteer approved successfully.",

            volunteer: updatedVolunteer

        });

    } catch (error) {

        if (error.code === "P2025") {

            return res.status(404).json({

                success: false,

                message: "Volunteer not found."

            });

        }

        console.error("approveVolunteer:", error);

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

        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {

            return res.status(400).json({

                success: false,

                message: "Invalid volunteer ID."

            });

        }

        const updatedVolunteer = await prisma.user.update({

            where: {
                id
            },

            data: {
                status: "REJECTED"
            },

            select: {
                id: true,
                fullName: true,
                mobile: true,
                email: true,
                status: true
            }

        });

     // Clear Dashboard Cache
dashboardCache = null;
dashboardCacheTime = 0;

// Clear Pending Cache
pendingCache = null;
pendingCacheTime = 0;

        return res.status(200).json({

            success: true,

            message: "Volunteer rejected successfully.",

            volunteer: updatedVolunteer

        });

    } catch (error) {

        if (error.code === "P2025") {

            return res.status(404).json({

                success: false,

                message: "Volunteer not found."

            });

        }

        console.error("rejectVolunteer:", error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};
// ======================================
// GET ALL PENDING VOLUNTEERS
// ======================================

exports.getPendingVolunteers = async (req, res) => {

    try {
        if (
    pendingCache &&
    (Date.now() - pendingCacheTime) < PENDING_CACHE_DURATION
) {
    return res.status(200).json(pendingCache);
}

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
            },

            orderBy: {
                createdAt: "desc"
            }

        });

      pendingCache = {
    success: true,
    volunteers
};

pendingCacheTime = Date.now();

return res.status(200).json(pendingCache);

    } catch (error) {

        console.error("getPendingVolunteers:", error);

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

        // Return Cached Data
        if (
            dashboardCache &&
            (Date.now() - dashboardCacheTime) < CACHE_DURATION
        ) {

            return res.status(200).json(dashboardCache);

        }

        const [
            totalVolunteers,
            pendingVolunteers,
            totalStudents,
            totalGroups
        ] = await Promise.all([

            prisma.user.count({

                where: {
                    role: "VOLUNTEER",
                    status: "APPROVED"
                }

            }),

            prisma.user.count({

                where: {
                    role: "VOLUNTEER",
                    status: "PENDING"
                }

            }),

            prisma.student.count(),

            prisma.group.count()

        ]);

        dashboardCache = {

            success: true,

            totalVolunteers,

            pendingVolunteers,

            totalStudents,

            totalGroups

        };

        dashboardCacheTime = Date.now();

        return res.status(200).json(dashboardCache);

    }

    catch (error) {

        console.error("getDashboardStats:", error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};

// ======================================
// GET APPROVED VOLUNTEERS
// ======================================

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

        return res.status(200).json({

            success: true,

            volunteers

        });

    }

    catch (error) {

        console.error("getApprovedVolunteers:", error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};
 