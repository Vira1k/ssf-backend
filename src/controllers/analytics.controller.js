const PDFDocument = require("pdfkit");
const prisma = require("../config/prisma");


// ======================================
// ADMIN ANALYTICS DASHBOARD
// ======================================

exports.getAnalytics = async (req, res) => {

    try {

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
        // TOTAL STUDENTS
        // ======================================

        const totalStudents =
            groupIds.length > 0
                ? await prisma.student.count({

                    where: {

                        isActive: true,

                        groupId: {
                            in: groupIds
                        }

                    }

                })
                : 0;


        // ======================================
        // ACTIVE VOLUNTEERS
        // ======================================

        let volunteerWhere = {

            role: "VOLUNTEER",
            status: "APPROVED",
            isActive: true

        };


        // If camp/group filter exists,
        // count volunteers assigned through schedule

        if (campId || groupId) {

           volunteerWhere.primarySchedules = {
                some: {

                    status: "ACTIVE",

                    groupId: {
                        in: groupIds
                    }

                }

            };

        }


        const totalVolunteers =
            await prisma.user.count({

                where: volunteerWhere

            });


        // ======================================
        // TEACHING REPORTS
        // ======================================

        const totalReports =
            groupIds.length > 0
                ? await prisma.teachingReport.count({

                    where: {

                        groupId: {
                            in: groupIds
                        }

                    }

                })
                : 0;


        // ======================================
        // STUDENT ATTENDANCE
        // ======================================

        const studentPresent =
            groupIds.length > 0
                ? await prisma.attendance.count({

                    where: {

                        groupId: {
                            in: groupIds
                        },

                        isPresent: true

                    }

                })
                : 0;


        const studentAbsent =
            groupIds.length > 0
                ? await prisma.attendance.count({

                    where: {

                        groupId: {
                            in: groupIds
                        },

                        isPresent: false

                    }

                })
                : 0;


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
        // VOLUNTEER ATTENDANCE
        // ======================================

        const volunteerPresent =
            groupIds.length > 0
                ? await prisma.volunteerAttendance.count({

                    where: {

                        groupId: {
                            in: groupIds
                        },

                        isPresent: true

                    }

                })
                : 0;


        const volunteerAbsent =
            groupIds.length > 0
                ? await prisma.volunteerAttendance.count({

                    where: {

                        groupId: {
                            in: groupIds
                        },

                        isPresent: false

                    }

                })
                : 0;


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
        // GROUP ANALYTICS
        // ======================================

        const groupAnalytics = [];


        for (const group of groups) {

            const students =
                await prisma.student.count({

                    where: {

                        groupId: group.id,
                        isActive: true

                    }

                });


            const volunteers =
    await prisma.user.count({

        where:{

            role:"VOLUNTEER",

            status:"APPROVED",

            isActive:true,

            primarySchedules:{
                some:{
                    groupId:1,

                    status:"ACTIVE"
                }
            }

        }

    });  


            const reports =
                await prisma.teachingReport.count({

                    where: {
                        groupId: group.id
                    }

                });


            const present =
                await prisma.attendance.count({

                    where: {

                        groupId: group.id,
                        isPresent: true

                    }

                });


            const absent =
                await prisma.attendance.count({

                    where: {

                        groupId: group.id,
                        isPresent: false

                    }

                });


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


            groupAnalytics.push({

                groupId: group.id,

                groupName: group.name,

                campId: group.camp.id,

                campName: group.camp.name,

                students,

                volunteers,

                reports,

                attendancePercentage

            });

        }


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
        // RESPONSE
        // ======================================

        return res.status(200).json({

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

        });

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