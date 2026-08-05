const webpush = require("web-push");

const prisma = require("../config/prisma");


// ===============================
// VAPID CONFIG
// ===============================

webpush.setVapidDetails(

    "mailto:ssf@gmail.com",

    process.env.VAPID_PUBLIC_KEY,

    process.env.VAPID_PRIVATE_KEY

);




// ===============================
// SEND PUSH TO USER
// ===============================

exports.sendPushToUser = async (
    userId,
    title,
    message
)=>{


    try{


        const subscriptions =
        await prisma.pushSubscription.findMany({

            where:{
                userId
            }

        });



        if(subscriptions.length === 0){


            console.log(
                "❌ No subscription found for user:",
                userId
            );


            return;


        }





        const payload =
        JSON.stringify({

            title:title,

            body:message,

            icon:"/assets/logo.png",

            data:{
                url:"/volunteer-dashboard.html"
            }

        });







        for(const sub of subscriptions){


            const pushSubscription = {


                endpoint:
                sub.endpoint,


                keys:{


                    p256dh:
                    sub.p256dh,


                    auth:
                    sub.auth


                }


            };




            try{


                await webpush.sendNotification(

                    pushSubscription,

                    payload

                );



                console.log(
                    "✅ Push sent successfully to user:",
                    userId
                );



            }



            catch(error){


                console.error(

                    "❌ Push failed:",
                    error.statusCode,
                    error.message

                );



                // remove expired subscription

                if(
                    error.statusCode === 404 ||
                    error.statusCode === 410
                ){


                    await prisma.pushSubscription.delete({

                        where:{
                            id:sub.id
                        }

                    });


                    console.log(
                        "🗑️ Removed expired subscription"
                    );


                }


            }


        }



    }



    catch(error){


        console.error(
            "Send Push Error:",
            error
        );


    }


};