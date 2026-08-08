// =======================================
// Volunteer Dashboard Controller
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
// Get Volunteer Dashboard
// =======================================
exports.getDashboard = async (req, res) => {

    try {

        const totalStart = Date.now();

        const volunteerId = Number(req.user.id);

        // =======================================
// CHECK DASHBOARD CACHE
// =======================================

const cached = dashboardCache.get(volunteerId);

if (
    cached &&
    Date.now() - cached.time < DASHBOARD_CACHE_TIME
) {
    return res.status(200).json(cached.data);
}

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        // ===================================
        // Today's Schedule
        // ===================================

        const scheduleStart = Date.now();

        const schedule = await prisma.schedule.findFirst({

            where: {

                volunteerId,
                status: "ACTIVE"

            },

            select: {

                id: true,
                volunteerId: true,
                groupId: true,

                subject: true,
                teachingDay: true,
                teachingTime: true,

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

        console.log(
            "Schedule:",
            Date.now() - scheduleStart,
            "ms"
        );

        if (!schedule) {

            console.log(
                "TOTAL DASHBOARD:",
                Date.now() - totalStart,
                "ms"
            );

            return res.status(200).json({

                success: true,

                todayClass: null,

                previousClass: null

            });

        }
        // ===================================
        // Previous Class
        // ===================================

        const previousClassStart = Date.now();

        const previousClass = await prisma.teachingReport.findFirst({

            where: {

                groupId: schedule.groupId,

                reportDate: {

                    lt: today

                }

            },

            orderBy: {

                reportDate: "desc"

            },

            select: {

                id: true,

                reportDate: true,

                subject: true,

                whatTaught: true,

                homework: true,

                nextClassPlan: true,

                photo: true,

                groupId: true,

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

            }

        });

        console.log(
            "Previous Class:",
            Date.now() - previousClassStart,
            "ms"
        );

        let previousClassData = null;

        if (previousClass) {

            const startDate = new Date(previousClass.reportDate);

            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(startDate);

            endDate.setDate(endDate.getDate() + 1);

            const attendanceStart = Date.now();

            const attendance = await prisma.attendance.findMany({

                where: {

                    groupId: previousClass.groupId,

                    attendanceDate: {

                        gte: startDate,

                        lt: endDate

                    }

                },

                select: {

                    isPresent: true,

                    student: {

                        select: {

                            fullName: true

                        }

                    }

                }

            });

            console.log(
                "Attendance:",
                Date.now() - attendanceStart,
                "ms"
            );

           let presentCount = 0;

const absentStudents = [];

for (const item of attendance) {

    if (item.isPresent) {

        presentCount++;

    } else {

        absentStudents.push(
            item.student.fullName
        );

    }

}

            previousClassData = {

                ...previousClass,

                presentCount,

                absentCount: absentStudents.length,

                absentStudents

            };

        }

        console.log(
            "TOTAL DASHBOARD:",
            Date.now() - totalStart,
            "ms"
        );

       const dashboardData = {

    success: true,

    todayClass: schedule,

    previousClass: previousClassData

};

dashboardCache.set(

    volunteerId,

    {

        time: Date.now(),

        data: dashboardData

    }

);

return res.status(200).json(dashboardData);

    }

    catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

}; 
// =======================================
// Get Today's Class
// Lightweight endpoint for Add Report
// =======================================

exports.getTodayClass = async (req, res) => {

    try {

        const volunteerId = Number(req.user.id);

        const schedule = await prisma.schedule.findFirst({

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

            todayClass: schedule

        });

    }

    catch (error) {

        console.error(
            "Today Class Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: "Unable to load today's class."

        });

    }

};

// =======================================
// Get All Volunteers
// =======================================

exports.getAllVolunteers = async (req, res) => {

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

            count: volunteers.length,

            data: volunteers

        });

    }

    catch (error) {

        console.error(
            "Get All Volunteers Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: "Unable to fetch volunteers"

        });

    }

};



// =======================================
// Get My Students - Fast + Cached
// =======================================

exports.getMyStudents = async (req, res) => {

    try {

        const volunteerId = Number(req.user.id);

        // =======================================
        // CHECK CACHE
        // =======================================

        const cached = myStudentsCache.get(volunteerId);

        if (
            cached &&
            Date.now() - cached.time < MY_STUDENTS_CACHE_TIME
        ) {

            return res.status(200).json(cached.data);

        }


        // =======================================
        // GET ASSIGNED GROUPS
        // =======================================

        const schedules = await prisma.schedule.findMany({

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

        if (schedules.length === 0) {

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

            return res.status(200).json(data);

        }


        // =======================================
        // UNIQUE GROUP IDS
        // =======================================

        const groupIds = [

            ...new Set(

                schedules.map(
                    schedule => schedule.groupId
                )

            )

        ];


        // =======================================
        // GET STUDENTS
        // =======================================

        const students = await prisma.student.findMany({

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

        for (const schedule of schedules) {

            if (
                !groups.some(
                    group =>
                        group.id === schedule.group.id
                )
            ) {

                groups.push(schedule.group);

            }

        }


        // =======================================
        // FINAL RESPONSE
        // =======================================

        const data = {

            success: true,

            groups,

            students,

            totalStudents: students.length,

            totalGroups: groups.length

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

        return res.status(200).json(data);

    }

    catch (error) {

        console.error(
            "Get My Students Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: "Unable to fetch students"

        });

    }

};