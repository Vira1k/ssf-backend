const prisma = require("../config/prisma");




// ======================================
// GET TODAY'S CLASS NOTIFICATION
// ======================================

exports.getTodayNotification = async (req, res) => {

    try {


        const volunteerId =
        Number(req.params.volunteerId);



        if (!volunteerId) {


            return res.status(400).json({

                success:false,

                message:
                "Volunteer id required."

            });


        }




        const today =
        new Date();



        const dayName =
        today
        .toLocaleDateString(
            "en-US",
            {
                weekday:"long"
            }
        )
        .toUpperCase();






        const schedules =

        await prisma.schedule.findMany({


            where:{


                volunteerId,


                teachingDay:
                dayName,


                status:
                "ACTIVE"


            },



            include:{


                group:{


                    include:{


                        camp:true


                    }


                }



            }



        });







        // ===============================
        // NO CLASS
        // ===============================


        if(!schedules || schedules.length === 0){


            return res.json({

                success:true,

                message:
                "No class scheduled today.",

                data:[]

            });


        }








        // ===============================
        // CLASS AVAILABLE
        // ===============================


        return res.json({


            success:true,


            data:schedules


        });



    }


    catch(error){


        console.error(
            "Today Notification Error:",
            error
        );



        return res.status(500).json({


            success:false,


            message:
            "Unable to load today's class."

        });


    }


};











// ======================================
// SAVE PUSH NOTIFICATION SUBSCRIPTION
// ======================================


exports.saveSubscription = async(req,res)=>{


    try{


        const userId =
        req.user.id;




        const {

            endpoint,

            p256dh,

            auth


        } = req.body;






        if(

            !endpoint ||

            !p256dh ||

            !auth

        ){


            return res.status(400).json({


                success:false,


                message:
                "Invalid subscription data."


            });


        }








        const subscription =

        await prisma.pushSubscription.upsert({



            where:{


                endpoint


            },



            update:{


                userId,


                p256dh,


                auth


            },



            create:{


                userId,


                endpoint,


                p256dh,


                auth


            }



        });







        return res.status(200).json({


            success:true,


            message:
            "Notification subscription saved successfully.",


            data:subscription


        });



    }



    catch(error){



        console.error(

            "Save Subscription Error:",

            error

        );



        return res.status(500).json({


            success:false,


            message:
            "Unable to save notification subscription."

        });


    }



};