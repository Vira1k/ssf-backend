const cron = require("node-cron");

const prisma = require("../config/prisma");

const {
    sendPushToUser
} = require("./push.service");




// ======================================
// SEND TODAY CLASS NOTIFICATION
// ======================================

async function sendClassNotification(type){


    try{


        const today = new Date();


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


                teachingDay: dayName,

                status:"ACTIVE"


            },


            include:{


                group:{


                    include:{


                        camp:true


                    }


                },


                volunteer:true


            }


        });





        if(schedules.length === 0){


            console.log(
                "No schedule found today"
            );


            return;


        }






        for(const schedule of schedules){



            let title = "";

            let message = "";





            // ===============================
            // MORNING 7 AM
            // ===============================

            if(type === "MORNING"){


                title =
                "🌅 Good Morning - SSF";


                message =

`Hello ${schedule.volunteer.fullName} 👋

You have SSF class today.

📍 Camp: ${schedule.group.camp.name}

👥 Group: ${schedule.group.name}

📚 Subject: ${schedule.subject || "-"}

⏰ Time: ${schedule.teachingTime}

Please confirm your availability.`;

            }





            // ===============================
            // NOON 12 PM
            // ===============================

            if(type === "NOON"){


                title =
                "🔔 SSF Class Reminder";


                message =

`Reminder from Slum Swaraj Foundation.

Your class is scheduled today.

📍 Camp: ${schedule.group.camp.name}

👥 Group: ${schedule.group.name}

⏰ Time: ${schedule.teachingTime}

Please be ready.`;

            }





            // ===============================
            // FINAL 3:30 PM
            // ===============================

            if(type === "FINAL"){


                title =
                "⚠️ SSF Final Reminder";


                message =

`Your SSF class timing is approaching.

📍 Camp: ${schedule.group.camp.name}

👥 Group: ${schedule.group.name}

⏰ Time: ${schedule.teachingTime}

Please reach on time.`;

            }





            await sendPushToUser(

                schedule.volunteerId,

                title,

                message

            );



        }




        console.log(

            `${type} notifications sent`

        );



    }



    catch(error){


        console.error(

            "Scheduler Notification Error:",
            error

        );


    }


}







// ======================================
// START NOTIFICATION SCHEDULER
// ======================================

function startScheduler(){


    console.log(

        "⏰ Notification Scheduler Started"

    );





    // ===============================
    // 7:00 AM IST
    // ===============================

    cron.schedule(

        "0 7 * * *",

        ()=>{


            console.log(
                "🌅 7 AM Trigger"
            );


            sendClassNotification(
                "MORNING"
            );


        },


        {
            timezone:"Asia/Kolkata"
        }

    );






    // ===============================
    // 12:00 PM IST
    // ===============================

    cron.schedule(

        "0 12 * * *",

        ()=>{


            console.log(
                "☀️ 12 PM Trigger"
            );


            sendClassNotification(
                "NOON"
            );


        },


        {
            timezone:"Asia/Kolkata"
        }

    );







    // ===============================
    // 3:30 PM IST
    // ===============================

    cron.schedule(

        "30 15 * * *",

        ()=>{


            console.log(
                "⏰ 3:30 PM Trigger"
            );


            sendClassNotification(
                "FINAL"
            );


        },


        {
            timezone:"Asia/Kolkata"
        }

    );


}







module.exports = {

    startScheduler

};