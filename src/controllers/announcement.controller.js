const prisma = require("../config/prisma");




// ======================================
// CREATE ANNOUNCEMENT (ADMIN)
// ======================================

exports.createAnnouncement = async (req, res) => {

    try {


        const {
            title,
            message,
            targetType,
            targetId
        } = req.body;



        const createdBy =
        req.user?.id || req.body.createdBy;



        if(!title || !message){

            return res.status(400).json({

                success:false,

                message:
                "Title and message are required."

            });

        }




        const announcement =

        await prisma.announcement.create({

            data:{


                title,

                message,

                targetType,


                targetId:
                targetId
                ?
                Number(targetId)
                :
                null,


                createdBy:
                Number(createdBy)


            }


        });






        return res.json({

            success:true,

            message:
            "Announcement created successfully.",

            data:announcement

        });



    }

    catch(error){


        console.error(
            "Create Announcement Error:",
            error
        );



        return res.status(500).json({

            success:false,

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