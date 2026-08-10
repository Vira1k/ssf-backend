const PDFDocument = require("pdfkit");
const prisma = require("../config/prisma");

// ======================================
// REPORT CACHE
// ======================================

const reportsCache = new Map();

const REPORT_CACHE_DURATION = 60000;


// ======================================
// CLEAR CACHE
// ======================================

function clearReportCache() {

    reportsCache.clear();

}


// ======================================
// CACHE KEY
// ======================================

function getCacheKey(req) {

    const role =
        req.user?.role || "UNKNOWN";

    const userId =
        req.user?.id || "UNKNOWN";

    const limit =
        Number(req.query.limit) || "ALL";

    return `${role}-${userId}-${limit}`;

}


// ======================================
// GET VOLUNTEER ASSIGNED GROUP IDS
// ======================================

async function getVolunteerGroupIds(volunteerId) {

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


    const groupIds = new Set();


    // --------------------------------------
    // Direct User Group
    // --------------------------------------

    if (volunteer.groupId) {

        groupIds.add(
            volunteer.groupId
        );

    }


    // --------------------------------------
    // Primary Schedule Groups
    // --------------------------------------

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


    // --------------------------------------
    // Replacement Schedule Groups
    // --------------------------------------

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
// ADD TEACHING REPORT
// ======================================

exports.addReport = async (req, res) => {

    try {

        const volunteerId =
            Number(req.user.id);

        const role =
            req.user.role;


        const {
            groupId,
            subject,
            whatTaught,
            homework,
            nextClassPlan,
            reportDate
        } = req.body;


        // ==================================
        // VALIDATION
        // ==================================

        if (
            !groupId ||
            !subject ||
            !whatTaught
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Group, Subject and What Taught are required."

            });

        }


        const requestedGroupId =
            Number(groupId);


        if (
            !Number.isInteger(
                requestedGroupId
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid group ID."

            });

        }


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
                    volunteerId
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
                        "Your volunteer account is not active."

                });

            }


            if (
                groupIds.length === 0
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "No group is assigned to your account."

                });

            }


            // Volunteer can only submit
            // report for assigned group

            if (
                !groupIds.includes(
                    requestedGroupId
                )
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "You can only submit reports for your assigned group."

                });

            }

        }


        // ==================================
        // CHECK GROUP
        // ==================================

        const group =
            await prisma.group.findUnique({

                where: {

                    id:
                        requestedGroupId

                },

                select: {

                    id: true,

                    name: true,

                    isActive: true

                }

            });


        if (!group) {

            return res.status(404).json({

                success: false,

                message:
                    "Group not found."

            });

        }


        if (!group.isActive) {

            return res.status(400).json({

                success: false,

                message:
                    "This group is inactive."

            });

        }


        // ==================================
        // CREATE REPORT
        // ==================================

        const report =
            await prisma.teachingReport.create({

                data: {

                    volunteerId,

                    groupId:
                        requestedGroupId,

                    subject,

                    whatTaught,

                    homework:
                        homework || null,

                    nextClassPlan:
                        nextClassPlan || null,

                    reportDate:
                        reportDate
                            ? new Date(reportDate)
                            : new Date()

                },

                select: {

                    id: true,

                    reportDate: true,

                    subject: true,

                    whatTaught: true,

                    homework: true,

                    nextClassPlan: true,

                    volunteerId: true,

                    groupId: true

                }

            });


        // ==================================
        // CLEAR CACHE
        // ==================================

        clearReportCache();


        return res.status(201).json({

            success: true,

            message:
                "Teaching report submitted successfully.",

            data:
                report

        });

    }

    catch (error) {

        console.error(
            "Add Report Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to submit report."

        });

    }

};


// ======================================
// GET TEACHING REPORTS
//
// ADMIN
// → ALL REPORTS
//
// VOLUNTEER
// → ASSIGNED GROUP REPORTS
// ======================================

exports.getAllReports = async (req, res) => {

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
            reportsCache.get(
                cacheKey
            );


        if (
            cached &&
            (
                Date.now() -
                cached.time
            ) < REPORT_CACHE_DURATION
        ) {

            return res.status(200).json(
                cached.data
            );

        }


        // ==================================
        // BUILD WHERE
        // ==================================

        let where = {};


        // ==================================
        // VOLUNTEER
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

                    count: 0,

                    data: []

                });

            }


            // ==================================
            // ONLY ASSIGNED GROUPS
            // ==================================

            where = {

                groupId: {

                    in:
                        groupIds

                }

            };

        }


        // ==================================
        // LIMIT
        // ==================================

        const requestedLimit =
            Number(req.query.limit);


        const validLimit =
            Number.isInteger(
                requestedLimit
            ) &&
            requestedLimit > 0
                ? requestedLimit
                : undefined;


        // ==================================
        // FETCH REPORTS
        // ==================================

        const reports =
            await prisma.teachingReport.findMany({

                where,

                ...(validLimit
                    ? {
                        take:
                            validLimit
                    }
                    : {}),

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

                }

            });


        // ==================================
        // FORMAT
        // ==================================

        const formattedReports =
            reports.map(
                report => ({

                    id:
                        report.id,

                    reportDate:
                        report.reportDate,

                    subject:
                        report.subject,

                    whatTaught:
                        report.whatTaught,

                    homework:
                        report.homework,

                    nextClassPlan:
                        report.nextClassPlan,

                    volunteer: {

                        id:
                            report.volunteer.id,

                        fullName:
                            report.volunteer.fullName

                    },

                    group: {

                        id:
                            report.group.id,

                        name:
                            report.group.name

                    },

                    camp: {

                        id:
                            report.group.camp.id,

                        name:
                            report.group.camp.name

                    }

                })
            );


        const response = {

            success: true,

            count:
                formattedReports.length,

            data:
                formattedReports

        };


        // ==================================
        // CACHE
        // ==================================

        reportsCache.set(

            cacheKey,

            {

                time:
                    Date.now(),

                data:
                    response

            }

        );


        return res.status(200).json(
            response
        );

    }

    catch (error) {

        console.error(
            "Get Reports Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch reports."

        });

    }

};


// ======================================
// DOWNLOAD REPORTS PDF
//
// ADMIN
// → ALL
//
// VOLUNTEER
// → ASSIGNED GROUPS
// ======================================

exports.downloadReportsPDF = async (
    req,
    res
) => {

    try {

        const role =
            req.user.role;

        const userId =
            Number(req.user.id);


        // ==================================
        // BUILD WHERE
        // ==================================

        let where = {};


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

                    success: false,

                    message:
                        "No group is assigned to this volunteer."

                });

            }


            where = {

                groupId: {

                    in:
                        groupIds

                }

            };

        }


        // ==================================
        // FETCH REPORTS
        // ==================================

        const reports =
            await prisma.teachingReport.findMany({

                where,

                include: {

                    volunteer: {

                        select: {

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

                }

            });


        // ==================================
        // PDF
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
            "attachment; filename=SSF_Teaching_Reports.pdf"
        );


        doc.pipe(res);


        doc
            .fontSize(20)
            .text(
                "Slum Swaraj Foundation",
                {
                    align: "center"
                }
            );


        doc
            .fontSize(16)
            .text(

                role === "VOLUNTEER"
                    ? "My Group Teaching Reports"
                    : "Teaching Reports",

                {
                    align: "center"
                }

            );


        doc.moveDown();


        // ==================================
        // REPORTS
        // ==================================

        reports.forEach(
            (report, index) => {

                doc
                    .fontSize(14)
                    .text(
                        `Report ${index + 1}`,
                        {
                            underline: true
                        }
                    );


                doc.moveDown(0.5);


                doc
                    .fontSize(11)
                    .text(

`Date: ${
    new Date(
        report.reportDate
    ).toLocaleDateString()
}

Volunteer: ${
    report.volunteer?.fullName || "-"
}

Camp: ${
    report.group?.camp?.name || "-"
}

Group: ${
    report.group?.name || "-"
}

Subject: ${
    report.subject || "-"
}

Topic Covered:
${
    report.whatTaught || "-"
}

Homework:
${
    report.homework || "-"
}

Next Class Plan:
${
    report.nextClassPlan || "-"
}
`

                    );


                doc.moveDown();


                if (
                    index !==
                    reports.length - 1
                ) {

                    doc.addPage();

                }

            }
        );


        if (
            reports.length === 0
        ) {

            doc
                .fontSize(12)
                .text(
                    "No teaching reports available."
                );

        }


        doc.end();

    }

    catch (error) {

        console.error(
            "PDF Download Error:",
            error
        );


        if (
            !res.headersSent
        ) {

            return res.status(500).json({

                success: false,

                message:
                    "Unable to generate PDF"

            });

        }

    }

};