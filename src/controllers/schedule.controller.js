const prisma = require("../config/prisma");


// ======================================
// GET ALL SCHEDULES
// ======================================

exports.getAllSchedules = async (req, res) => {

    try {

        const schedules = await prisma.schedule.findMany({

            orderBy: {
                id: "desc"
            },

            select: {

                id: true,
                volunteerId: true,
                groupId: true,
                subject: true,
                teachingDay: true,
                teachingTime: true,
                isHoliday: true,
                status: true,

                volunteer: {
                    select: {
                        id: true,
                        fullName: true,
                        mobile: true
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

        return res.json({
            success: true,
            data: schedules
        });

    } catch (error) {

        console.error("Get Schedule Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch schedules."
        });

    }

};
// ======================================
// CREATE SCHEDULE
// ======================================

exports.createSchedule = async(req,res)=>{


    try{


        let {

            volunteerId,

            groupId,

            subject,

            teachingDay,

            teachingTime,

            isHoliday,

            status


        } = req.body;



        teachingDay =
        teachingDay
        .trim()
        .toUpperCase();



        const validDays = [

            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY"

        ];



        if(!validDays.includes(teachingDay)){


            return res.status(400).json({

                success:false,

                message:
                "Invalid teaching day."

            });


        }



        const schedule =
        await prisma.schedule.create({

            data:{


                volunteerId:Number(volunteerId),

                groupId:Number(groupId),

                subject,

                teachingDay,

                teachingTime,

                isHoliday,

                status


            }

        });



        return res.status(201).json({

            success:true,

            message:
            "Schedule created successfully.",

            data:schedule


        });


    }


    catch(error){


        console.error(
            "Create Schedule Error:",
            error
        );


        return res.status(500).json({

            success:false,

            message:
            "Unable to create schedule."

        });


    }


};
// ======================================
// UPDATE SCHEDULE
// ======================================

exports.updateSchedule = async(req,res)=>{


    try{


        const id =
        Number(req.params.id);



        let {

            volunteerId,

            groupId,

            subject,

            teachingDay,

            teachingTime,

            isHoliday,

            status


        } = req.body;



        teachingDay =
        teachingDay
        .trim()
        .toUpperCase();




        const schedule =
        await prisma.schedule.update({

            where:{

                id

            },


            data:{


                volunteerId:Number(volunteerId),

                groupId:Number(groupId),

                subject,

                teachingDay,

                teachingTime,

                isHoliday,

                status


            }

        });





        return res.json({

            success:true,

            message:
            "Schedule updated successfully.",

            data:schedule


        });



    }

    catch(error){


        console.error(
            "Update Schedule Error:",
            error
        );


        return res.status(500).json({

            success:false,

            message:
            "Unable to update schedule."

        });


    }


};







// ======================================
// DELETE SCHEDULE
// ======================================

exports.deleteSchedule = async(req,res)=>{


    try{


        const id =
        Number(req.params.id);



        const schedule =
        await prisma.schedule.findUnique({

            where:{

                id

            }

        });



        if(!schedule){


            return res.status(404).json({

                success:false,

                message:
                "Schedule not found."

            });


        }




await prisma.volunteerAvailability.deleteMany({
    where: {
        scheduleId: id
    }
});
       await prisma.$transaction([

    prisma.volunteerAvailability.deleteMany({
        where: {
            scheduleId: id
        }
    }),

    prisma.schedule.delete({
        where: {
            id
        }
    })

]);




        return res.json({

            success:true,

            message:
            "Schedule deleted successfully."

        });



    }

    catch(error){


        console.error(
            "Delete Schedule Error:",
            error
        );


        return res.status(500).json({

            success:false,

            message:
            "Unable to delete schedule."

        });


    }


};
// ======================================
// TODAY CAMP REMINDER
// ======================================

exports.getTodayReminder = async(req,res)=>{


    try{


        const campName =
        req.params.camp;



        const today =
        new Date();



        const dayName =
        today.toLocaleDateString(

            "en-US",

            {
                weekday:"long"
            }

        )
        .toUpperCase();





        const schedules =
        await prisma.schedule.findMany({


            where:{


                teachingDay:{

                    equals:dayName,

                    mode:"insensitive"

                },


                status:"ACTIVE",


                isHoliday:false,



                group:{


                    camp:{


                        name:{


                            equals:campName,

                            mode:"insensitive"


                        }


                    }


                }


            },



            include:{


                volunteer:{


                    select:{


                        id:true,

                        fullName:true,

                        mobile:true


                    }


                },



                group:{


                    select:{


                        id:true,

                        name:true,


                        camp:{


                            select:{


                                name:true


                            }

                        }


                    }


                }


            }



        });





        return res.status(200).json({


            success:true,


            count:schedules.length,


            data:schedules


        });



    }


    catch(error){


        console.error(

            "Today Reminder Error:",

            error

        );



        return res.status(500).json({


            success:false,


            message:
            "Unable to fetch reminder schedules."


        });


    }


};