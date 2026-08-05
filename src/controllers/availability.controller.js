const prisma = require("../config/prisma");



// ======================================
// VOLUNTEER CONFIRM AVAILABLE
// ======================================

exports.confirmAvailability = async (req, res) => {

    try {


        const volunteerId = req.user.id;


        const {
            scheduleId
        } = req.body;



        if(!scheduleId){

            return res.status(400).json({

                success:false,

                message:"Schedule ID required."

            });

        }




        const existing =
        await prisma.volunteerAvailability.findFirst({

            where:{

                volunteerId,

                scheduleId,

                status:"AVAILABLE"

            }

        });




        if(existing){

            return res.json({

                success:true,

                message:
                "Already confirmed.",

                data:existing

            });

        }




        const availability =
        await prisma.volunteerAvailability.create({

            data:{

                volunteerId,

                scheduleId:Number(scheduleId),

                status:"AVAILABLE"

            }

        });




        return res.json({

            success:true,

            message:
            "Availability confirmed.",

            data:availability

        });



    }


    catch(error){


        console.error(
            "Confirm Availability Error:",
            error
        );


        return res.status(500).json({

            success:false,

            message:
            "Unable to confirm availability."

        });


    }


};









// ======================================
// VOLUNTEER NOT AVAILABLE
// ======================================

exports.markUnavailable = async (req,res)=>{


    try{


        const volunteerId =
        req.user.id;



        const {

            scheduleId,

            reason,

            alternativeName,

            alternativeMobile,

            alternativeMessage

        } = req.body;





        if(!scheduleId){

            return res.status(400).json({

                success:false,

                message:
                "Schedule ID required."

            });

        }





        const existing =
        await prisma.volunteerAvailability.findFirst({

            where:{

                volunteerId,

                scheduleId

            }

        });






        let availability;



        if(existing){


            availability =
            await prisma.volunteerAvailability.update({

                where:{

                    id:existing.id

                },


                data:{


                    status:"NOT_AVAILABLE",

                    reason,

                    alternativeName,

                    alternativeMobile,

                    alternativeMessage


                }


            });


        }


        else{


            availability =
            await prisma.volunteerAvailability.create({

                data:{


                    volunteerId,

                    scheduleId:Number(scheduleId),

                    status:"NOT_AVAILABLE",

                    reason,

                    alternativeName,

                    alternativeMobile,

                    alternativeMessage


                }


            });


        }





        return res.json({

            success:true,

            message:
            "Unavailable response saved.",

            data:availability

        });



    }



    catch(error){


        console.error(
            "Unavailable Error:",
            error
        );


        return res.status(500).json({

            success:false,

            message:
            "Unable to save response."

        });


    }


};









// ======================================
// GET VOLUNTEER AVAILABILITY HISTORY
// ======================================

exports.getVolunteerAvailability = async(req,res)=>{


    try{


        const volunteerId =
        req.user.id;



        const data =
        await prisma.volunteerAvailability.findMany({

            where:{

                volunteerId

            },


            include:{


                schedule:{


                    include:{


                        group:{

                            include:{

                                camp:true

                            }

                        }


                    }


                }


            },


            orderBy:{

                createdAt:"desc"

            }


        });




        return res.json({

            success:true,

            data

        });



    }


    catch(error){


        console.error(
            "History Error:",
            error
        );


        return res.status(500).json({

            success:false,

            message:
            "Unable to fetch history."

        });


    }


};









// ======================================
// ADMIN GET UNAVAILABLE VOLUNTEERS
// ======================================

exports.getUnavailableVolunteers = async(req,res)=>{


    try{


        const data =
        await prisma.volunteerAvailability.findMany({

            where:{

                status:"NOT_AVAILABLE"

            },


            include:{


                volunteer:{


                    select:{


                        id:true,

                        fullName:true,

                        mobile:true


                    }


                },


                schedule:{


                    include:{


                        group:{


                            include:{


                                camp:true


                            }


                        }


                    }


                }


            },


            orderBy:{

                createdAt:"desc"

            }


        });





        return res.json({

            success:true,

            data

        });



    }


    catch(error){


        console.error(
            "Admin Availability Error:",
            error
        );


        return res.status(500).json({

            success:false,

            message:
            "Unable to fetch data."

        });


    }


};