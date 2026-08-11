const prisma = require("../config/prisma");

const {
    sendPushToUser
} = require("../services/push.service");

// ======================================
// CREATE ANNOUNCEMENT (ADMIN)
// ======================================

exports.createAnnouncement = async (req, res) => {

    try {

        const {
            title,
            message,
            targetType
        } = req.body;

        const createdBy =
            req.user?.id || req.body.createdBy;


        // ======================================
        // VALIDATION
        // ======================================

        if (!title || !message) {

            return res.status(400).json({

                success: false,

                message:
                    "Title and message are required."

            });

        }


        if (!createdBy) {

            return res.status(400).json({

                success: false,

                message:
                    "Admin information is required."

            });

        }


        const validTargets = [
            "ALL",
            "MAHAGUN",
            "GOLFLINK",
            "BOTH"
        ];


        if (!validTargets.includes(targetType)) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid announcement target."

            });

        }


        // ======================================
        // CREATE ANNOUNCEMENT
        // ======================================

        const announcement =
            await prisma.announcement.create({

                data: {

                    title: title.trim(),

                    message: message.trim(),

                    targetType,

                    targetId: null,

                    createdBy:
                        Number(createdBy)

                }

            });


        // ======================================
        // FIND TARGET VOLUNTEERS
        // ======================================

        let volunteers = [];


        // ======================================
        // ALL VOLUNTEERS
        // ======================================

        if (targetType === "ALL") {

            volunteers =
                await prisma.user.findMany({

                    where: {

                        role: "VOLUNTEER",

                        status: "APPROVED",

                        isActive: true

                    },

                    select: {

                        id: true

                    }

                });

        }


        // ======================================
        // CAMP TARGET
        // ======================================

        else {

            let campNames = [];


            if (targetType === "MAHAGUN") {

                campNames = ["MAHAGUN"];

            }


            if (targetType === "GOLFLINK") {

                campNames = ["GOLFLINK"];

            }


            if (targetType === "BOTH") {

                campNames = [
                    "MAHAGUN",
                    "GOLFLINK"
                ];

            }


            // ======================================
            // FIND VOLUNTEERS CONNECTED TO CAMP
            // ======================================

            volunteers =
                await prisma.user.findMany({

                    where: {

                        role: "VOLUNTEER",

                        status: "APPROVED",

                        isActive: true,

                        OR: [

                            // Volunteer directly assigned
                            // to a group

                            {

                                group: {

                                    camp: {

                                        name: {

                                            in: campNames,

                                            mode: "insensitive"

                                        }

                                    }

                                }

                            },


                            // Volunteer has primary schedule
                            // in the camp

                            {

                                primarySchedules: {

                                    some: {

                                        status: "ACTIVE",

                                        group: {

                                            camp: {

                                                name: {

                                                    in: campNames,

                                                    mode: "insensitive"

                                                }

                                            }

                                        }

                                    }

                                }

                            },


                            // Volunteer is replacement
                            // for a schedule in the camp

                            {

                                replacementSchedules: {

                                    some: {

                                        status: "ACTIVE",

                                        group: {

                                            camp: {

                                                name: {

                                                    in: campNames,

                                                    mode: "insensitive"

                                                }

                                            }

                                        }

                                    }

                                }

                            }

                        ]

                    },

                    select: {

                        id: true

                    }

                });

        }


        // ======================================
        // SEND PUSH NOTIFICATIONS
        // ======================================

        let notificationsSent = 0;


        for (const volunteer of volunteers) {

            try {

                const result =
                    await sendPushToUser(

                        volunteer.id,

                        `📢 ${title.trim()}`,

                        message.trim(),

                        "/volunteer-dashboard.html"

                    );


                if (
                    result &&
                    result.success
                ) {

                    notificationsSent += result.sent || 0;

                }

            }

            catch (pushError) {

                console.error(

                    `Push failed for volunteer ${volunteer.id}:`,

                    pushError

                );

            }

        }


        // ======================================
        // SUCCESS
        // ======================================

        return res.status(201).json({

            success: true,

            message:
                "Announcement created successfully.",

            data: announcement,

            notification: {

                targetType,

                volunteersFound:
                    volunteers.length,

                notificationsSent

            }

        });


    }

    catch (error) {

        console.error(

            "Create Announcement Error:",

            error

        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to create announcement."

        });

    }

};





// ======================================
// GET ALL ANNOUNCEMENTS (ADMIN)
// ======================================


exports.getAnnouncements =
async(req,res)=>{


try{


const announcements =

await prisma.announcement.findMany({


where:{


isActive:true


},



orderBy:{


createdAt:"desc"


}



});




return res.json({

success:true,

data:announcements

});



}

catch(error){


console.error(

"Get Announcements Error:",

error

);



return res.status(500).json({

success:false,

message:
"Unable to fetch announcements."

});


}



};









// ======================================
// VOLUNTEER ANNOUNCEMENTS
// ONLY LAST 24 HOURS
// ======================================


exports.getVolunteerAnnouncements =
async(req,res)=>{


try{


const expiryTime =

new Date(

Date.now()
-
24 *
60 *
60 *
1000

);






const announcements =

await prisma.announcement.findMany({


where:{


isActive:true,


createdAt:{


gte:expiryTime


}



},



orderBy:{


createdAt:"desc"


}



});






return res.json({


success:true,


data:announcements


});





}

catch(error){



console.error(

"Volunteer Announcement Error:",

error

);



return res.status(500).json({


success:false,


message:
"Unable to fetch announcements."


});


}



};