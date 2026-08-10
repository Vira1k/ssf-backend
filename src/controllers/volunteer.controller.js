// =======================================
// SSF VOLUNTEER CONTROLLER
// OPTIMIZED VERSION
// =======================================

const prisma = require("../config/prisma");


// =======================================
// MY STUDENTS CACHE
// =======================================

const myStudentsCache = new Map();

const MY_STUDENTS_CACHE_TIME = 60000; // 60 seconds


// =======================================
// DASHBOARD CACHE
// =======================================

const dashboardCache = new Map();

const DASHBOARD_CACHE_TIME = 60000; // 60 seconds



// =======================================
// GET VOLUNTEER DASHBOARD
// =======================================

// =======================================
// GET VOLUNTEER DASHBOARD
// FAST + OPTIMIZED
// =======================================

// =======================================
// GET VOLUNTEER DASHBOARD
// FAST + OPTIMIZED
// =======================================

exports.getDashboard = async (req, res) => {

    const startTime = Date.now();

    try {

        // =======================================
        // VOLUNTEER ID
        // =======================================

        const volunteerId = Number(req.user.id);

        if (!Number.isInteger(volunteerId)) {

            return res.status(400).json({
                success: false,
                message: "Invalid volunteer ID."
            });

        }

        // =======================================
        // SERVER CACHE
        // =======================================

        const cached = dashboardCache.get(volunteerId);

        if (
            cached &&
            Date.now() - cached.time < DASHBOARD_CACHE_TIME
        ) {

            console.log("⚡ Dashboard served from cache");

            return res.status(200).json(cached.data);

        }

        // =======================================
        // CURRENT TIME
        // =======================================

        const now = new Date();

        // =======================================
        // SINGLE DATABASE QUERY
        // =======================================
        // Schedule + Group + Previous Report
        // are fetched together.
        //
        // Previously:
        // 1. Schedule query
        // 2. Previous report query
        //
        // Now:
        // 1. Single DB round-trip
        // =======================================

        const schedule = await prisma.schedule.findFirst({

            where: {
                volunteerId,
                status: "ACTIVE"
            },

            orderBy: {
                id: "asc"
            },

            select: {

                id: true,

                groupId: true,

                subject: true,

                teachingDay: true,

                teachingTime: true,

                group: {

                    select: {

                        id: true,

                        name: true,

                        reports: {

                            where: {
                                reportDate: {
                                    lt: now
                                }
                            },

                            orderBy: {
                                reportDate: "desc"
                            },

                            take: 1,

                            select: {

                                reportDate: true,

                                subject: true,

                                whatTaught: true,

                                homework: true,

                                volunteer: {

                                    select: {
                                        fullName: true
                                    }

                                }

                            }

                        }

                    }

                }

            }

        });

        // =======================================
        // NO ACTIVE SCHEDULE
        // =======================================

        if (!schedule) {

            const data = {
                success: true,
                todayClass: null,
                previousClass: null
            };

            dashboardCache.set(
                volunteerId,
                {
                    time: Date.now(),
                    data
                }
            );

            console.log(
                `⚡ Dashboard DB: ${Date.now() - startTime}ms`
            );

            return res.status(200).json(data);

        }

        // =======================================
        // GET PREVIOUS REPORT
        // =======================================

        const previousReport =
            schedule.group?.reports?.[0] || null;

        // =======================================
        // FORMAT TODAY CLASS
        // =======================================

        const todayClass = {

            id: schedule.id,

            groupId: schedule.groupId,

            subject: schedule.subject,

            teachingDay: schedule.teachingDay,

            teachingTime: schedule.teachingTime,

            group: schedule.group

                ? {
                    id: schedule.group.id,
                    name: schedule.group.name
                }

                : null

        };

        // =======================================
        // FORMAT PREVIOUS CLASS
        // =======================================

        const previousClass = previousReport

            ? {

                reportDate:
                    previousReport.reportDate,

                subject:
                    previousReport.subject,

                whatTaught:
                    previousReport.whatTaught,

                homework:
                    previousReport.homework,

                volunteer:
                    previousReport.volunteer

            }

            : null;

        // =======================================
        // FINAL RESPONSE
        // =======================================

        const dashboardData = {

            success: true,

            todayClass,

            previousClass

        };

        // =======================================
        // SAVE CACHE
        // =======================================

        dashboardCache.set(
            volunteerId,
            {
                time: Date.now(),
                data: dashboardData
            }
        );

        // =======================================
        // PERFORMANCE LOG
        // =======================================

        const totalTime =
            Date.now() - startTime;

        console.log(
            `⚡ Dashboard DB: ${totalTime}ms`
        );

        // =======================================
        // RESPONSE
        // =======================================

        return res.status(200).json(
            dashboardData
        );

    }

    catch (error) {

        console.error(
            "❌ Dashboard Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to load dashboard."

        });

    }

};
// =======================================
// GET TODAY'S CLASS
// Lightweight endpoint for Add Report
// =======================================

exports.getTodayClass = async (req, res) => {

    try {

        const volunteerId =
            Number(req.user.id);


        if (!Number.isInteger(volunteerId)) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid volunteer ID."

            });

        }


        const schedule =
            await prisma.schedule.findFirst({

                where: {

                    volunteerId,

                    status: "ACTIVE"

                },

                select: {

                    id: true,

                    groupId: true,

                    subject: true,

                    teachingDay: true,

                    teachingTime: true,

                    group: {

                        select: {

                            id: true,

                            name: true

                        }

                    }

                }

            });


        if (!schedule) {

            return res.status(200).json({

                success: true,

                todayClass: null

            });

        }


        return res.status(200).json({

            success: true,

            todayClass:
                schedule

        });

    }


    catch (error) {

        console.error(
            "Today Class Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load today's class."

        });

    }

};



// =======================================
// GET ALL VOLUNTEERS
// =======================================

exports.getAllVolunteers = async (req, res) => {

    try {

        const volunteers =
            await prisma.user.findMany({

                where: {

                    role: "VOLUNTEER",

                    status: "APPROVED",

                    isActive: true

                },

                select: {

                    id: true,

                    fullName: true,

                    mobile: true,

                    email: true,

                    college: true,

                    gender: true,

                    createdAt: true

                },

                orderBy: {

                    fullName: "asc"

                }

            });


        return res.status(200).json({

            success: true,

            count:
                volunteers.length,

            data:
                volunteers

        });

    }


    catch (error) {

        console.error(
            "Get All Volunteers Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch volunteers"

        });

    }

};



// =======================================
// GET MY STUDENTS
// FAST + CACHED
// =======================================

exports.getMyStudents = async (req, res) => {

    try {

        const volunteerId =
            Number(req.user.id);


        if (!Number.isInteger(volunteerId)) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid volunteer ID."

            });

        }


        // =======================================
        // CHECK CACHE
        // =======================================

        const cached =
            myStudentsCache.get(
                volunteerId
            );


        if (
            cached &&
            Date.now() - cached.time <
                MY_STUDENTS_CACHE_TIME
        ) {

            return res.status(200).json(
                cached.data
            );

        }


        // =======================================
        // GET ASSIGNED GROUPS
        // =======================================

        const schedules =
            await prisma.schedule.findMany({

                where: {

                    volunteerId,

                    status: "ACTIVE"

                },

                select: {

                    groupId: true,

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

                }

            });


        // =======================================
        // NO GROUP
        // =======================================

        if (
            schedules.length === 0
        ) {

            const data = {

                success: true,

                groups: [],

                students: [],

                totalStudents: 0,

                totalGroups: 0

            };


            myStudentsCache.set(

                volunteerId,

                {

                    time: Date.now(),

                    data

                }

            );


            return res.status(200).json(
                data
            );

        }


        // =======================================
        // UNIQUE GROUP IDS
        // =======================================

        const groupIds = [

            ...new Set(

                schedules.map(
                    schedule =>
                        schedule.groupId
                )

            )

        ];


        // =======================================
        // GET STUDENTS
        // =======================================

        const students =
            await prisma.student.findMany({

                where: {

                    groupId: {

                        in: groupIds

                    },

                    isActive: true

                },

                select: {

                    id: true,

                    fullName: true,

                    dob: true,

                    gender: true,

                    phone: true,

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

                }

            });


        // =======================================
        // UNIQUE GROUPS
        // =======================================

        const groups = [];

        const groupMap = new Map();


        for (
            const schedule of schedules
        ) {

            const group =
                schedule.group;


            if (
                !groupMap.has(group.id)
            ) {

                groupMap.set(
                    group.id,
                    group
                );

                groups.push(
                    group
                );

            }

        }


        // =======================================
        // FINAL RESPONSE
        // =======================================

        const data = {

            success: true,

            groups,

            students,

            totalStudents:
                students.length,

            totalGroups:
                groups.length

        };


        // =======================================
        // SAVE CACHE
        // =======================================

        myStudentsCache.set(

            volunteerId,

            {

                time: Date.now(),

                data

            }

        );


        // =======================================
        // SEND RESPONSE
        // =======================================

        return res.status(200).json(
            data
        );

    }


    catch (error) {

        console.error(
            "Get My Students Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch students"

        });

    }

};