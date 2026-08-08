const PDFDocument = require("pdfkit");
const prisma = require("../config/prisma");
// ======================================
// ANALYTICS CACHE
// ======================================

let analyticsCache = null;

let analyticsCacheTime = 0;

const ANALYTICS_CACHE_DURATION = 60 * 1000; // 60 seconds

// ======================================
// ADMIN ANALYTICS DASHBOARD
// ======================================

exports.getAnalytics = async (req, res) => {

    try {
        // ======================================
// CHECK ANALYTICS CACHE
// ======================================

if (
    analyticsCache &&
    Date.now() - analyticsCacheTime < ANALYTICS_CACHE_DURATION
) {

    return res.status(200).json(
        analyticsCache
    );

}

        // ======================================
        // ONLY ADMIN
        // ======================================

        if (req.user.role !== "ADMIN") {

            return res.status(403).json({

                success: false,
                message: "Access Denied. Admin only."

            });

        }


        // ======================================
        // FILTERS
        // ======================================

        const campId = req.query.campId
            ? Number(req.query.campId)
            : null;

        const groupId = req.query.groupId
            ? Number(req.query.groupId)
            : null;


        // ======================================
        // GROUP FILTER
        // ======================================

        const groupWhere = {

            isActive: true,

            ...(campId && {
                campId
            }),

            ...(groupId && {
                id: groupId
            })

        };


        // ======================================
        // GET FILTERED GROUPS
        // ======================================

        const groups = await prisma.group.findMany({

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
            groups.map(group => group.id);


// ======================================
// ALL ANALYTICS COUNTS
// RUN IN PARALLEL
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

    // TOTAL STUDENTS
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

  // ACTIVE VOLUNTEERS
prisma.user.count({
    where: {
        role: "VOLUNTEER",
        status: "APPROVED",
        isActive: true,

        ...(campId || groupId
            ? {
                primarySchedules: {
                    some: {
                        status: "ACTIVE",
                        groupId: {
                            in: groupIds
                        }
                    }
                }
            }
            : {})
    }
}),
    // TEACHING REPORTS
    groupIds.length > 0
        ? prisma.teachingReport.count({
            where: {
                groupId: {
                    in: groupIds
                }
            }
        })
        : Promise.resolve(0),

    // STUDENT PRESENT
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

    // STUDENT ABSENT
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

    // VOLUNTEER PRESENT
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

    // VOLUNTEER ABSENT
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

 
 // ======================================
// GROUP ANALYTICS
// OPTIMIZED
// ======================================

const [
    studentCounts,
    volunteerCounts,
    reportCounts,
    presentCounts,
    absentCounts
] = await Promise.all([

    // STUDENTS
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

    // VOLUNTEERS
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

    // REPORTS
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

    // PRESENT
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

    // ABSENT
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
// CREATE LOOKUP MAPS
// ======================================

const studentMap = new Map(
    studentCounts.map(item => [
        item.groupId,
        item._count.id
    ])
);

const volunteerMap = new Map(
    volunteerCounts.map(item => [
        item.groupId,
        item._count.volunteerId
    ])
);

const reportMap = new Map(
    reportCounts.map(item => [
        item.groupId,
        item._count.id
    ])
);

const presentMap = new Map(
    presentCounts.map(item => [
        item.groupId,
        item._count.id
    ])
);

const absentMap = new Map(
    absentCounts.map(item => [
        item.groupId,
        item._count.id
    ])
);


// ======================================
// BUILD GROUP ANALYTICS
// ======================================

const groupAnalytics = groups.map(group => {

    const students =
        studentMap.get(group.id) || 0;

    const volunteers =
        volunteerMap.get(group.id) || 0;

    const reports =
        reportMap.get(group.id) || 0;

    const present =
        presentMap.get(group.id) || 0;

    const absent =
        absentMap.get(group.id) || 0;

    const attendanceTotal =
        present + absent;

    const attendancePercentage =
        attendanceTotal > 0
            ? Math.round(
                (present / attendanceTotal) * 100
            )
            : 0;

    return {
        groupId: group.id,
        groupName: group.name,
        campId: group.camp.id,
        campName: group.camp.name,
        students,
        volunteers,
        reports,
        attendancePercentage
    };

});
// ======================================
// ATTENDANCE PERCENTAGES
// ======================================

const studentAttendanceTotal =
    studentPresent + studentAbsent;

const studentAttendancePercentage =
    studentAttendanceTotal > 0
        ? Math.round(
            (studentPresent /
                studentAttendanceTotal) * 100
        )
        : 0;


const volunteerAttendanceTotal =
    volunteerPresent + volunteerAbsent;

const volunteerAttendancePercentage =
    volunteerAttendanceTotal > 0
        ? Math.round(
            (volunteerPresent /
                volunteerAttendanceTotal) * 100
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
                        reportDate: "desc"
                    },

                    take: 10

                })
                : [];


      // ======================================
// RESPONSE DATA
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
// SAVE ANALYTICS CACHE
// ======================================

analyticsCache =
    responseData;

analyticsCacheTime =
    Date.now();


// ======================================
// SEND RESPONSE
// ======================================

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
// ======================================

exports.downloadAnalyticsPDF = async (req, res) => {

    try {

        const students =
            await prisma.student.count({

                where:{
                    isActive:true
                }

            });


        const volunteers =
            await prisma.user.count({

                where:{
                    role:"VOLUNTEER",
                    status:"APPROVED"
                }

            });


        const groups =
            await prisma.group.count({

                where:{
                    isActive:true
                }

            });


        const reports =
            await prisma.teachingReport.count();



        const doc =
            new PDFDocument();


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
                align:"center"
            }
        );


        doc.moveDown();



        doc
        .fontSize(16)
        .text(
            "Analytics Report"
        );


        doc.moveDown();



        doc.fontSize(14);


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
                .toLocaleDateString("en-IN")
            }`
        );


        doc.end();



    }
    catch(error){


        console.error(
            "PDF Error:",
            error
        );


        res.status(500).json({

            success:false,

            message:
            "Unable to generate PDF"

        });


    }

};