// =======================================
// Volunteer Dashboard Controller
// =======================================


const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();




// =======================================
// Get Volunteer Dashboard
// =======================================


exports.getDashboard = async (req,res)=>{


    try{


        const volunteerId =
        Number(req.user.id);



        const today =
        new Date();





        // ===================================
        // Today's Schedule
        // ===================================


        const schedule =
        await prisma.schedule.findFirst({


            where:{


                volunteerId,


                status:"ACTIVE"


            },


            include:{


                group:{


                    include:{


                        camp:true


                    }


                }


            }


        });





        if(!schedule){


            return res.status(200).json({


                success:true,


                todayClass:null,


                previousClass:null


            });


        }









        // ===================================
        // LAST COMPLETED CLASS
        // ===================================


        let previousClass = null;




        previousClass =

        await prisma.teachingReport.findFirst({



            where:{


                groupId:
                schedule.groupId,


                reportDate:{


                    lt:today


                }


            },



            include:{



                volunteer:{


                    select:{


                        id:true,


                        fullName:true


                    }


                },



                group:{


                    include:{


                        camp:true


                    }


                }


            },



            orderBy:{


                reportDate:"desc"


            }



        });








        // ===================================
        // Attendance Data
        // ===================================


        let presentCount = 0;


        let absentCount = 0;


        let absentStudents = [];






        if(previousClass){



            const startDate =

            new Date(
                previousClass.reportDate
            );



            startDate.setHours(
                0,
                0,
                0,
                0
            );



            const endDate =

            new Date(startDate);



            endDate.setDate(
                endDate.getDate()+1
            );







            const attendance =

            await prisma.attendance.findMany({



                where:{


                    groupId:
                    previousClass.groupId,



                    attendanceDate:{


                        gte:startDate,


                        lt:endDate


                    }



                },



                include:{


                    student:{


                        select:{


                            fullName:true


                        }


                    }


                }



            });







            presentCount =

            attendance.filter(

                a=>a.isPresent

            ).length;








            absentStudents =

            attendance

            .filter(

                a=>!a.isPresent

            )

            .map(

                a=>a.student.fullName

            );







            absentCount =

            absentStudents.length;



        }









        // ===================================
        // Prepare Previous Class Response
        // ===================================


        let previousClassData = null;





        if(previousClass){



            previousClassData = {



                id:
                previousClass.id,



                reportDate:
                previousClass.reportDate,



                subject:
                previousClass.subject,



                whatTaught:
                previousClass.whatTaught,



                homework:
                previousClass.homework,



                nextClassPlan:
                previousClass.nextClassPlan,



                photo:
                previousClass.photo,



                volunteer:
                previousClass.volunteer,



                group:
                previousClass.group,



                presentCount,


                absentCount,


                absentStudents



            };



        }









        return res.status(200).json({



            success:true,



            todayClass:schedule,



            previousClass:
            previousClassData



        });




    }



    catch(error){



        console.error(

            "Dashboard Error:",

            error

        );



        return res.status(500).json({



            success:false,


            message:"Server Error"



        });



    }



};
// =======================================
// Get All Volunteers
// =======================================


exports.getAllVolunteers = async (req,res)=>{


    try{


        const volunteers =

        await prisma.user.findMany({



            where:{


                role:"VOLUNTEER",


                status:"APPROVED",


                isActive:true


            },



            select:{


                id:true,


                fullName:true,


                mobile:true,


                email:true,


                college:true,


                gender:true,


                createdAt:true


            },



            orderBy:{


                fullName:"asc"


            }



        });







        return res.status(200).json({



            success:true,


            count:
            volunteers.length,


            data:
            volunteers



        });





    }


    catch(error){



        console.error(

            "Get All Volunteers Error:",
            error

        );



        return res.status(500).json({



            success:false,


            message:
            "Unable to fetch volunteers"



        });



    }



};









// =======================================
// Get My Students
// =======================================


exports.getMyStudents = async(req,res)=>{


    try{


        const volunteerId =
        Number(req.user.id);





        const schedules =

        await prisma.schedule.findMany({



            where:{


                volunteerId,


                status:"ACTIVE"


            },



            include:{


                group:{


                    include:{


                        camp:true


                    }


                }


            }



        });







        if(schedules.length===0){


            return res.status(200).json({


                success:true,


                groups:[],


                students:[],


                totalStudents:0,


                totalGroups:0


            });


        }









        const groupIds =

        [

            ...new Set(

                schedules.map(

                    item=>item.groupId

                )

            )

        ];









        const students =

        await prisma.student.findMany({



            where:{



                groupId:{


                    in:groupIds


                },


                isActive:true



            },



            include:{



                group:{


                    include:{


                        camp:true


                    }


                }



            },



            orderBy:{



                fullName:"asc"



            }



        });









        const groups=[];





        schedules.forEach(schedule=>{



            const exists =

            groups.find(

                g=>

                g.id===schedule.group.id


            );





            if(!exists){


                groups.push(

                    schedule.group

                );


            }



        });









        return res.status(200).json({



            success:true,


            groups,


            students,


            totalStudents:
            students.length,



            totalGroups:
            groups.length



        });







    }


    catch(error){



        console.error(

            "Get My Students Error:",
            error

        );



        return res.status(500).json({



            success:false,


            message:
            "Unable to fetch students"



        });



    }



};