const PDFDocument = require("pdfkit");
const prisma = require("../config/prisma");


// ======================================
// ANALYTICS CACHE
// ======================================

const analyticsCache = new Map();

const ANALYTICS_CACHE_DURATION =
    60 * 1000; // 60 seconds


// ======================================
// CLEAR CACHE
// ======================================

function clearAnalyticsCache() {

    analyticsCache.clear();

}


// ======================================
// CACHE KEY
// ======================================

function getCacheKey(req) {

    const role =
        req.user?.role || "UNKNOWN";

    const userId =
        req.user?.id || "UNKNOWN";

    const campId =
        req.query.campId || "ALL";

    const groupId =
        req.query.groupId || "ALL";

    return `${role}-${userId}-${campId}-${groupId}`;

}


// ======================================
// GET VOLUNTEER ASSIGNED GROUPS
// ======================================

async function getVolunteerGroupIds(
    volunteerId
) {

    const volunteer =
        await prisma.user.findUnique({

            where: {
                id: volunteerId
            },

            select: {

                id: true,

                groupId: true,

                role: true,

                status: true,

                isActive: true,

                primarySchedules: {

                    where: {
                        status: "ACTIVE"
                    },

                    select: {
                        groupId: true
                    }

                },

                replacementSchedules: {

                    where: {
                        status: "ACTIVE"
                    },

                    select: {
                        groupId: true
                    }

                }

            }

        });


    if (!volunteer) {

        return {
            volunteer: null,
            groupIds: []
        };

    }


    const groupIds =
        new Set();


    // ==================================
    // DIRECT GROUP
    // ==================================

    if (volunteer.groupId) {

        groupIds.add(
            volunteer.groupId
        );

    }


    // ==================================
    // PRIMARY SCHEDULE GROUPS
    // ==================================

    for (
        const schedule
        of volunteer.primarySchedules
    ) {

        if (schedule.groupId) {

            groupIds.add(
                schedule.groupId
            );

        }

    }


    // ==================================
    // REPLACEMENT GROUPS
    // ==================================

    for (
        const schedule
        of volunteer.replacementSchedules
    ) {

        if (schedule.groupId) {

            groupIds.add(
                schedule.groupId
            );

        }

    }


    return {

        volunteer,

        groupIds:
            Array.from(groupIds)

    };

}


// ======================================
// GET ANALYTICS
//
// ADMIN
// → ALL GROUPS
//
// VOLUNTEER
// → ASSIGNED GROUPS ONLY
// ======================================

exports.getAnalytics = async (
    req,
    res
) => {

    try {

        const role =
            req.user.role;

        const userId =
            Number(req.user.id);


        // ==================================
        // CACHE
        // ==================================

        const cacheKey =
            getCacheKey(req);

        const cached =
            analyticsCache.get(
                cacheKey
            );


        if (
            cached &&
            (
                Date.now() -
                cached.time
            ) < ANALYTICS_CACHE_DURATION
        ) {

            return res.status(200).json(
                cached.data
            );

        }


        // ==================================
        // GROUP FILTERS
        // ==================================

        const requestedCampId =
            req.query.campId
                ? Number(req.query.campId)
                : null;

        const requestedGroupId =
            req.query.groupId
                ? Number(req.query.groupId)
                : null;


        // ==================================
        // BASE GROUP WHERE
        // ==================================

        let groupWhere = {

            isActive: true

        };


        // ==================================
        // VOLUNTEER SECURITY
        // ==================================

        if (
            role === "VOLUNTEER"
        ) {

            const {
                volunteer,
                groupIds
            } =
                await getVolunteerGroupIds(
                    userId
                );


            if (!volunteer) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Volunteer account not found."

                });

            }


            if (
                volunteer.status !== "APPROVED" ||
                !volunteer.isActive
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Volunteer account is not active."

                });

            }


            if (
                groupIds.length === 0
            ) {

                return res.status(200).json({

                    success: true,

                    stats: {

                        totalStudents: 0,

                        totalVolunteers: 0,

                        totalGroups: 0,

                        totalReports: 0

                    },

                    studentAttendance: {

                        present: 0,

                        absent: 0,

                        percentage: 0

                    },

                    volunteerAttendance: {

                        present: 0,

                        absent: 0,

                        percentage: 0

                    },

                    groupAnalytics: [],

                    recentActivity: []

                });

            }


            // ==================================
            // ONLY ASSIGNED GROUPS
            // ==================================

            groupWhere.id = {

                in: groupIds

            };


            // ==================================
            // OPTIONAL GROUP FILTER
            // ==================================

            if (
                requestedGroupId
            ) {

                if (
                    !groupIds.includes(
                        requestedGroupId
                    )
                ) {

                    return res.status(403).json({

                        success: false,

                        message:
                            "You can only view analytics for your assigned group."

                    });

                }


                groupWhere.id = {

                    equals:
                        requestedGroupId

                };

            }


            // ==================================
            // CAMP FILTER
            // ==================================

            if (
                requestedCampId
            ) {

                groupWhere.campId =
                    requestedCampId;

            }

        }


        // ==================================
        // ADMIN FILTERS
        // ==================================

        else if (
            role === "ADMIN"
        ) {

            if (
                requestedCampId
            ) {

                groupWhere.campId =
                    requestedCampId;

            }


            if (
                requestedGroupId
            ) {

                groupWhere.id =
                    requestedGroupId;

            }

        }


        // ==================================
        // OTHER ROLES
        // ==================================

        else {

            return res.status(403).json({

                success: false,

                message:
                    "Access Denied."

            });

        }


        // ==================================
        // GET GROUPS
        // ==================================

        const groups =
            await prisma.group.findMany({

                where: groupWhere,

                select: {

                    id: true,

                    name: true,

                    campId: true,

                    camp: {

                        select: {

                            id: true,

                            name: true

                        }

                    }

                },

                orderBy: {

                    name: "asc"

                }

            });


        const groupIds =
            groups.map(
                group => group.id
            );


        // ======================================
        // ALL MAIN COUNTS IN PARALLEL
        // ======================================

        const [

            totalStudents,

            totalVolunteers,

            totalReports,

            studentPresent,

            studentAbsent,

            volunteerPresent,

            volunteerAbsent

        ] = await Promise.all([


            // ==================================
            // STUDENTS
            // ==================================

            groupIds.length > 0

                ? prisma.student.count({

                    where: {

                        isActive: true,

                        groupId: {
                            in: groupIds
                        }

                    }

                })

                : Promise.resolve(0),


            // ==================================
            // VOLUNTEERS
            // ==================================

            groupIds.length > 0

                ? prisma.user.count({

                    where: {

                        role: "VOLUNTEER",

                        status: "APPROVED",

                        isActive: true,

                        OR: [

                            {
                                groupId: {
                                    in: groupIds
                                }
                            },

                            {
                                primarySchedules: {

                                    some: {

                                        status: "ACTIVE",

                                        groupId: {
                                            in: groupIds
                                        }

                                    }

                                }

                            },

                            {
                                replacementSchedules: {

                                    some: {

                                        status: "ACTIVE",

                                        groupId: {
                                            in: groupIds
                                        }

                                    }

                                }

                            }

                        ]

                    }

                })

                : Promise.resolve(0),


            // ==================================
            // REPORTS
            // ==================================

            groupIds.length > 0

                ? prisma.teachingReport.count({

                    where: {

                        groupId: {
                            in: groupIds
                        }

                    }

                })

                : Promise.resolve(0),


            // ==================================
            // STUDENT PRESENT
            // ==================================

            groupIds.length > 0

                ? prisma.attendance.count({

                    where: {

                        groupId: {
                            in: groupIds
                        },

                        isPresent: true

                    }

                })

                : Promise.resolve(0),


            // ==================================
            // STUDENT ABSENT
            // ==================================

            groupIds.length > 0

                ? prisma.attendance.count({

                    where: {

                        groupId: {
                            in: groupIds
                        },

                        isPresent: false

                    }

                })

                : Promise.resolve(0),


            // ==================================
            // VOLUNTEER PRESENT
            // ==================================

            groupIds.length > 0

                ? prisma.volunteerAttendance.count({

                    where: {

                        groupId: {
                            in: groupIds
                        },

                        isPresent: true

                    }

                })

                : Promise.resolve(0),


            // ==================================
            // VOLUNTEER ABSENT
            // ==================================

            groupIds.length > 0

                ? prisma.volunteerAttendance.count({

                    where: {

                        groupId: {
                            in: groupIds
                        },

                        isPresent: false

                    }

                })

                : Promise.resolve(0)

        ]);


        // ======================================
        // GROUP ANALYTICS
        // ======================================

        const [

            studentCounts,

            volunteerCounts,

            reportCounts,

            presentCounts,

            absentCounts

        ] = await Promise.all([


            // ==================================
            // STUDENTS
            // ==================================

            prisma.student.groupBy({

                by: ["groupId"],

                where: {

                    isActive: true,

                    groupId: {
                        in: groupIds
                    }

                },

                _count: {
                    id: true
                }

            }),


            // ==================================
            // VOLUNTEERS
            // ==================================

            prisma.schedule.groupBy({

                by: ["groupId"],

                where: {

                    status: "ACTIVE",

                    groupId: {
                        in: groupIds
                    },

                    volunteer: {

                        role: "VOLUNTEER",

                        status: "APPROVED",

                        isActive: true

                    }

                },

                _count: {

                    volunteerId: true

                }

            }),


            // ==================================
            // REPORTS
            // ==================================

            prisma.teachingReport.groupBy({

                by: ["groupId"],

                where: {

                    groupId: {
                        in: groupIds
                    }

                },

                _count: {
                    id: true
                }

            }),


            // ==================================
            // PRESENT
            // ==================================

            prisma.attendance.groupBy({

                by: ["groupId"],

                where: {

                    groupId: {
                        in: groupIds
                    },

                    isPresent: true

                },

                _count: {
                    id: true
                }

            }),


            // ==================================
            // ABSENT
            // ==================================

            prisma.attendance.groupBy({

                by: ["groupId"],

                where: {

                    groupId: {
                        in: groupIds
                    },

                    isPresent: false

                },

                _count: {
                    id: true
                }

            })

        ]);


        // ======================================
        // LOOKUP MAPS
        // ======================================

        const studentMap =
            new Map(
                studentCounts.map(
                    item => [
                        item.groupId,
                        item._count.id
                    ]
                )
            );


        const volunteerMap =
            new Map(
                volunteerCounts.map(
                    item => [
                        item.groupId,
                        item._count.volunteerId
                    ]
                )
            );


        const reportMap =
            new Map(
                reportCounts.map(
                    item => [
                        item.groupId,
                        item._count.id
                    ]
                )
            );


        const presentMap =
            new Map(
                presentCounts.map(
                    item => [
                        item.groupId,
                        item._count.id
                    ]
                )
            );


        const absentMap =
            new Map(
                absentCounts.map(
                    item => [
                        item.groupId,
                        item._count.id
                    ]
                )
            );


        // ======================================
        // GROUP ANALYTICS
        // ======================================

        const groupAnalytics =
            groups.map(group => {

                const students =
                    studentMap.get(
                        group.id
                    ) || 0;


                const volunteers =
                    volunteerMap.get(
                        group.id
                    ) || 0;


                const reports =
                    reportMap.get(
                        group.id
                    ) || 0;


                const present =
                    presentMap.get(
                        group.id
                    ) || 0;


                const absent =
                    absentMap.get(
                        group.id
                    ) || 0;


                const attendanceTotal =
                    present + absent;


                const attendancePercentage =
                    attendanceTotal > 0

                        ? Math.round(
                            (
                                present /
                                attendanceTotal
                            ) * 100
                        )

                        : 0;


                return {

                    groupId:
                        group.id,

                    groupName:
                        group.name,

                    campId:
                        group.camp.id,

                    campName:
                        group.camp.name,

                    students,

                    volunteers,

                    reports,

                    attendancePercentage

                };

            });


        // ======================================
        // STUDENT ATTENDANCE %
        // ======================================

        const studentAttendanceTotal =
            studentPresent +
            studentAbsent;


        const studentAttendancePercentage =
            studentAttendanceTotal > 0

                ? Math.round(
                    (
                        studentPresent /
                        studentAttendanceTotal
                    ) * 100
                )

                : 0;


        // ======================================
        // VOLUNTEER ATTENDANCE %
        // ======================================

        const volunteerAttendanceTotal =
            volunteerPresent +
            volunteerAbsent;


        const volunteerAttendancePercentage =
            volunteerAttendanceTotal > 0

                ? Math.round(
                    (
                        volunteerPresent /
                        volunteerAttendanceTotal
                    ) * 100
                )

                : 0;


        // ======================================
        // RECENT TEACHING ACTIVITY
        // ======================================

        const recentActivity =
            groupIds.length > 0

                ? await prisma.teachingReport.findMany({

                    where: {

                        groupId: {
                            in: groupIds
                        }

                    },

                    include: {

                        volunteer: {

                            select: {

                                id: true,

                                fullName: true

                            }

                        },

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

                        reportDate:
                            "desc"

                    },

                    take: 10

                })

                : [];


        // ======================================
        // RESPONSE
        // ======================================

        const responseData = {

            success: true,

            stats: {

                totalStudents,

                totalVolunteers,

                totalGroups:
                    groups.length,

                totalReports

            },

            studentAttendance: {

                present:
                    studentPresent,

                absent:
                    studentAbsent,

                percentage:
                    studentAttendancePercentage

            },

            volunteerAttendance: {

                present:
                    volunteerPresent,

                absent:
                    volunteerAbsent,

                percentage:
                    volunteerAttendancePercentage

            },

            groupAnalytics,

            recentActivity

        };


        // ======================================
        // CACHE
        // ======================================

        analyticsCache.set(

            cacheKey,

            {

                time:
                    Date.now(),

                data:
                    responseData

            }

        );


        return res.status(200).json(
            responseData
        );

    }

    catch (error) {

        console.error(
            "Analytics Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load analytics."

        });

    }

};


// ======================================
// DOWNLOAD ANALYTICS PDF
//
// ADMIN
// → ALL
//
// VOLUNTEER
// → ASSIGNED GROUPS
// ======================================

exports.downloadAnalyticsPDF = async (
    req,
    res
) => {

    try {

        const role =
            req.user.role;

        const userId =
            Number(req.user.id);


        let where = {};


        // ==================================
        // VOLUNTEER SECURITY
        // ==================================

        if (
            role === "VOLUNTEER"
        ) {

            const {
                volunteer,
                groupIds
            } =
                await getVolunteerGroupIds(
                    userId
                );


            if (!volunteer) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Volunteer account not found."

                });

            }


            if (
                volunteer.status !== "APPROVED" ||
                !volunteer.isActive
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Volunteer account is not active."

                });

            }


            if (
                groupIds.length === 0
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "No group is assigned to this volunteer."

                });

            }


            where = {

                groupId: {
                    in: groupIds
                }

            };

        }


        // ==================================
        // INVALID ROLE
        // ==================================

        else if (
            role !== "ADMIN"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Access Denied."

            });

        }


        // ==================================
        // FETCH PDF DATA
        // ==================================

        const [

            students,

            volunteers,

            groups,

            reports

        ] = await Promise.all([


            prisma.student.count({

                where: {

                    isActive: true,

                    ...(Object.keys(where).length
                        ? {
                            groupId:
                                where.groupId
                        }
                        : {})

                }

            }),


            prisma.user.count({

                where: {

                    role: "VOLUNTEER",

                    status: "APPROVED",

                    isActive: true,

                    ...(Object.keys(where).length
                        ? {

                            OR: [

                                {
                                    groupId:
                                        where.groupId
                                },

                                {
                                    primarySchedules: {

                                        some: {

                                            status:
                                                "ACTIVE",

                                            groupId:
                                                where.groupId

                                        }

                                    }

                                }

                            ]

                        }
                        : {})

                }

            }),


            prisma.group.count({

                where: {

                    isActive: true,

                    ...(Object.keys(where).length
                        ? {
                            id:
                                where.groupId
                        }
                        : {})

                }

            }),


            prisma.teachingReport.count({

                where

            })

        ]);


        // ==================================
        // CREATE PDF
        // ==================================

        const doc =
            new PDFDocument({
                margin: 50
            });


        res.setHeader(
            "Content-Type",
            "application/pdf"
        );


        res.setHeader(
            "Content-Disposition",
            "attachment; filename=SSF_Analytics_Report.pdf"
        );


        doc.pipe(res);


        doc
            .fontSize(22)
            .text(
                "Slum Swaraj Foundation",
                {
                    align: "center"
                }
            );


        doc.moveDown();


        doc
            .fontSize(16)
            .text(

                role === "VOLUNTEER"
                    ? "My Group Analytics Report"
                    : "Analytics Report"

            );


        doc.moveDown();


        doc
            .fontSize(14);


        doc.text(
            `Total Students : ${students}`
        );


        doc.text(
            `Active Volunteers : ${volunteers}`
        );


        doc.text(
            `Total Groups : ${groups}`
        );


        doc.text(
            `Teaching Reports : ${reports}`
        );


        doc.moveDown();


        doc.text(
            `Generated Date : ${
                new Date()
                    .toLocaleDateString(
                        "en-IN"
                    )
            }`
        );


        doc.end();

    }

    catch (error) {

        console.error(
            "PDF Error:",
            error
        );


        if (!res.headersSent) {

            return res.status(500).json({

                success: false,

                message:
                    "Unable to generate PDF"

            });

        }

    }

};