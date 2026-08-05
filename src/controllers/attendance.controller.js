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
// GET TODAY ATTENDANCE
// ======================================

exports.getTodayAttendance = async (req, res) => {

    try {

        const volunteerId =
            Number(req.user.id);

        const today =
            getTodayDay();


        // ======================================
        // SUNDAY CHECK
        // ======================================

        if (today === "SUNDAY") {

            return res.status(400).json({

                success: false,

                message:
                    "Today is Holiday."

            });

        }


        // ======================================
        // FIND TODAY'S SCHEDULE
        // ======================================

        const schedule =
            await prisma.schedule.findFirst({

                where: {

                    volunteerId,

                    teachingDay: today,

                    status: "ACTIVE"

                },

                include: {

                    group: true

                }

            });


        // ======================================
        // NO CLASS
        // ======================================

        if (!schedule) {

            return res.status(404).json({

                success: false,

                message:
                    "No class scheduled today."

            });

        }


        // ======================================
        // GET STUDENTS
        // ======================================

        const students =
            await prisma.student.findMany({

                where: {

                    groupId:
                        schedule.groupId,

                    isActive: true

                },

                orderBy: {

                    fullName: "asc"

                }

            });


        // ======================================
        // RESPONSE
        // ======================================

        return res.status(200).json({

            success: true,

            attendanceDate:
                new Date(),

            day: today,

            group:
                schedule.group,

            students

        });

    }

    catch (error) {

        console.error(
            "Get Today Attendance Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load attendance."

        });

    }

};


// ======================================
// SAVE ATTENDANCE
// ======================================

exports.saveAttendance = async (req, res) => {

    try {

        const volunteerId =
            Number(req.user.id);

        const { attendance } =
            req.body;


        // ======================================
        // VALIDATE ATTENDANCE
        // ======================================

        if (
            !Array.isArray(attendance) ||
            attendance.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Attendance data is required."

            });

        }


        // ======================================
        // GET TODAY
        // ======================================

        const today =
            getTodayDay();


        if (today === "SUNDAY") {

            return res.status(400).json({

                success: false,

                message:
                    "Today is Holiday."

            });

        }


        // ======================================
        // FIND VOLUNTEER SCHEDULE
        // ======================================

        const schedule =
            await prisma.schedule.findFirst({

                where: {

                    volunteerId,

                    teachingDay: today,

                    status: "ACTIVE"

                },

                include: {

                    group: {

                        include: {

                            camp: true

                        }

                    }

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
        // NORMALIZE DATE
        // ======================================

        const attendanceDate =
            new Date();

        attendanceDate.setHours(
            0,
            0,
            0,
            0
        );


        // ======================================
        // GET STUDENT IDS
        // ======================================

        const studentIds =
            attendance.map(
                item =>
                    Number(item.studentId)
            );


        // ======================================
        // VALIDATE STUDENTS
        // ======================================

        const validStudents =
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


        const validStudentIds =
            new Set(

                validStudents.map(
                    student =>
                        student.id
                )

            );


        const invalidStudent =
            studentIds.some(
                id =>
                    !validStudentIds.has(id)
            );


        if (invalidStudent) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid student attendance data."

            });

        }


        // ======================================
        // PREPARE ATTENDANCE DATA
        // ======================================

        const attendanceData =
            attendance.map(
                student => ({

                    attendanceDate,

                    studentId:
                        Number(
                            student.studentId
                        ),

                    volunteerId,

                    groupId:
                        schedule.groupId,

                    isPresent:
                        Boolean(
                            student.isPresent
                        ),

                    homeworkSubmitted:
                        Boolean(
                            student.homeworkSubmitted
                        ),

                    remarks:
                        student.remarks || null

                })
            );


        // ======================================
        // TRANSACTION
        // ======================================

        await prisma.$transaction(

            async tx => {


                // ======================================
                // DELETE OLD STUDENT ATTENDANCE
                // ======================================

                await tx.attendance.deleteMany({

                    where: {

                        groupId:
                            schedule.groupId,

                        attendanceDate

                    }

                });


                // ======================================
                // SAVE STUDENT ATTENDANCE
                // ======================================

                await tx.attendance.createMany({

                    data:
                        attendanceData

                });


                // ======================================
                // DELETE OLD VOLUNTEER ATTENDANCE
                // ======================================

                await tx.volunteerAttendance.deleteMany({

                    where: {

                        volunteerId,

                        groupId:
                            schedule.groupId,

                        attendanceDate

                    }

                });


                // ======================================
                // MARK VOLUNTEER PRESENT
                // ======================================

                await tx.volunteerAttendance.create({

                    data: {

                        attendanceDate,

                        volunteerId,

                        groupId:
                            schedule.groupId,

                        isPresent: true

                    }

                });

            }

        );


        // ======================================
        // COUNTS
        // ======================================

        const presentCount =
            attendanceData.filter(
                item =>
                    item.isPresent
            ).length;


        const absentCount =
            attendanceData.length -
            presentCount;


        // ======================================
        // SUCCESS RESPONSE
        // ======================================

        return res.status(201).json({

            success: true,

            message:
                "Student and volunteer attendance saved successfully.",

            data: {

                date:
                    attendanceDate,

                group: {

                    id:
                        schedule.group.id,

                    name:
                        schedule.group.name

                },

                camp: {

                    id:
                        schedule.group.camp.id,

                    name:
                        schedule.group.camp.name

                },

                studentAttendance: {

                    total:
                        attendanceData.length,

                    present:
                        presentCount,

                    absent:
                        absentCount

                },

                volunteerAttendance: {

                    volunteerId,

                    status:
                        "PRESENT"

                }

            }

        });

    }

    catch (error) {

        console.error(
            "Save Attendance Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to save attendance."

        });

    }

};


// ======================================
// VOLUNTEER ATTENDANCE HISTORY
// ======================================

exports.getAttendanceHistory = async (req, res) => {

    try {

        const volunteerId =
            Number(req.user.id);


        const history =
            await prisma.volunteerAttendance.findMany({

                where: {

                    volunteerId

                },

                include: {

                    group: {

                        select: {

                            id: true,

                            name: true

                        }

                    }

                },

                orderBy: {

                    attendanceDate:
                        "desc"

                }

            });


        return res.status(200).json({

            success: true,

            count:
                history.length,

            data:
                history

        });

    }

    catch (error) {

        console.error(
            "Attendance History Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch attendance history."

        });

    }

};


// ======================================
// ADMIN - GET STUDENT ATTENDANCE
// BY GROUP AND DATE
// ======================================

exports.getAttendanceByDate = async (req, res) => {

    try {

        const groupId =
            Number(
                req.params.groupId
            );


        // ======================================
        // VALIDATE GROUP ID
        // ======================================

        if (!groupId) {

            return res.status(400).json({

                success: false,

                message:
                    "Valid group ID is required."

            });

        }


        // ======================================
        // DATE
        // ======================================

        const attendanceDate =
            new Date(
                `${req.params.attendanceDate}T00:00:00`
            );


        if (
            isNaN(
                attendanceDate.getTime()
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid attendance date."

            });

        }


        attendanceDate.setHours(
            0,
            0,
            0,
            0
        );


        // ======================================
        // GET ATTENDANCE
        // ======================================

        const attendance =
            await prisma.attendance.findMany({

                where: {

                    groupId,

                    attendanceDate

                },

                include: {

                    student: {

                        select: {

                            id: true,

                            fullName: true,

                            studentCode: true

                        }

                    }

                },

                orderBy: {

                    student: {

                        fullName: "asc"

                    }

                }

            });


        // ======================================
        // COUNTS
        // ======================================

        const present =
            attendance.filter(
                record =>
                    record.isPresent
            ).length;


        const absent =
            attendance.filter(
                record =>
                    !record.isPresent
            ).length;


        // ======================================
        // RESPONSE
        // ======================================

        return res.status(200).json({

            success: true,

            count:
                attendance.length,

            present,

            absent,

            attendance

        });

    }

    catch (error) {

        console.error(
            "Get Student Attendance Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch attendance."

        });

    }

};


// ======================================
// ADMIN - VOLUNTEER ATTENDANCE REPORT
// ======================================

exports.getAdminVolunteerAttendance = async (req, res) => {

    try {

        // ======================================
        // ADMIN CHECK
        // ======================================

        if (
            req.user.role !== "ADMIN"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Access denied. Admin only."

            });

        }


        // ======================================
        // GET DATE
        // ======================================

        const dateString =
            req.query.date;


        if (!dateString) {

            return res.status(400).json({

                success: false,

                message:
                    "Date is required."

            });

        }


        const selectedDate =
            new Date(
                `${dateString}T00:00:00`
            );


        if (
            isNaN(
                selectedDate.getTime()
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid date."

            });

        }


        selectedDate.setHours(
            0,
            0,
            0,
            0
        );


        // ======================================
        // GET DAY NAME
        // ======================================

        const days = [

            "SUNDAY",
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY"

        ];


        const dayName =
            days[
                selectedDate.getDay()
            ];


        // ======================================
        // SUNDAY
        // ======================================

        if (
            dayName === "SUNDAY"
        ) {

            return res.status(200).json({

                success: true,

                date:
                    selectedDate,

                day:
                    dayName,

                total: 0,

                present: 0,

                absent: 0,

                data: [],

                message:
                    "Sunday is a holiday."

            });

        }


        // ======================================
        // OPTIONAL FILTERS
        // ======================================

        const campId =
            req.query.campId
                ? Number(
                    req.query.campId
                )
                : null;


        const groupId =
            req.query.groupId
                ? Number(
                    req.query.groupId
                )
                : null;


        // ======================================
        // SCHEDULE FILTER
        // ======================================

        const scheduleWhere = {

            teachingDay:
                dayName,

            status:
                "ACTIVE"

        };


        if (groupId) {

            scheduleWhere.groupId =
                groupId;

        }

        else if (campId) {

            scheduleWhere.group = {

                campId

            };

        }


        // ======================================
        // GET SCHEDULED VOLUNTEERS
        // ======================================

        const schedules =
            await prisma.schedule.findMany({

                where:
                    scheduleWhere,

                include: {

                    volunteer: {

                        select: {

                            id: true,

                            fullName: true,

                            mobile: true,

                            status: true,

                            isActive: true

                        }

                    },

                    group: {

                        include: {

                            camp: true

                        }

                    }

                },

                orderBy: {

                    teachingTime:
                        "asc"

                }

            });


        // ======================================
        // VOLUNTEER ATTENDANCE FILTER
        // ======================================

        const attendanceWhere = {

            attendanceDate:
                selectedDate

        };


        if (groupId) {

            attendanceWhere.groupId =
                groupId;

        }

        else if (campId) {

            attendanceWhere.group = {

                campId

            };

        }


        // ======================================
        // GET VOLUNTEER ATTENDANCE
        // ======================================

        const attendanceRecords =
            await prisma.volunteerAttendance.findMany({

                where:
                    attendanceWhere

            });


        // ======================================
        // CREATE ATTENDANCE MAP
        // ======================================

        const attendanceMap =
            new Map();


        attendanceRecords.forEach(
            record => {

                const key =
                    `${record.volunteerId}-${record.groupId}`;


                attendanceMap.set(
                    key,
                    record
                );

            }
        );


        // ======================================
        // BUILD REPORT
        // ======================================

        const report =
            schedules

                .filter(
                    schedule => {

                        return (

                            schedule.volunteer &&

                            schedule.volunteer.isActive &&

                            schedule.volunteer.status ===
                                "APPROVED"

                        );

                    }
                )

                .map(
                    schedule => {

                        const key =
                            `${schedule.volunteerId}-${schedule.groupId}`;


                        const attendance =
                            attendanceMap.get(
                                key
                            );


                        return {

                            scheduleId:
                                schedule.id,

                            volunteerId:
                                schedule.volunteer.id,

                            volunteerName:
                                schedule.volunteer.fullName,

                            mobile:
                                schedule.volunteer.mobile,

                            campId:
                                schedule.group.camp.id,

                            campName:
                                schedule.group.camp.name,

                            groupId:
                                schedule.group.id,

                            groupName:
                                schedule.group.name,

                            subject:
                                schedule.subject,

                            teachingDay:
                                schedule.teachingDay,

                            teachingTime:
                                schedule.teachingTime,

                            status:
                                attendance &&
                                attendance.isPresent
                                    ? "PRESENT"
                                    : "ABSENT"

                        };

                    }
                );


        // ======================================
        // STATISTICS
        // ======================================

        const present =
            report.filter(
                item =>
                    item.status ===
                    "PRESENT"
            ).length;


        const absent =
            report.filter(
                item =>
                    item.status ===
                    "ABSENT"
            ).length;


        // ======================================
        // RESPONSE
        // ======================================

        return res.status(200).json({

            success: true,

            date:
                selectedDate,

            day:
                dayName,

            total:
                report.length,

            present,

            absent,

            data:
                report

        });

    }

    catch (error) {

        console.error(
            "Admin Volunteer Attendance Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch volunteer attendance."

        });

    }

};