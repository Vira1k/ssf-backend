const prisma = require("../config/prisma");


// ======================================
// GET MY PROFILE
// Admin + Volunteer
// ======================================

exports.getMyProfile = async (req, res) => {

    try {

        const userId = Number(req.user.id);

        const user = await prisma.user.findUnique({

            where: {
                id: userId
            },

            select: {

                id: true,
                fullName: true,
                mobile: true,
                email: true,
                gender: true,
                college: true,
                profilePhoto: true,
                role: true,
                status: true,
                createdAt: true,

                primarySchedules: {

                    where: {
                        status: "ACTIVE"
                    },

                    select: {

                        id: true,
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
                                        name: true,
                                        address: true

                                    }

                                }

                            }

                        }

                    }

                }

            }

        });


        if (!user) {

            return res.status(404).json({

                success: false,
                message: "User not found."

            });

        }


        return res.status(200).json({

            success: true,
            data: user

        });

    }

    catch (error) {

        console.error(
            "Get My Profile Error:",
            error
        );

        return res.status(500).json({

            success: false,
            message: "Unable to load profile."

        });

    }

};
// ======================================
// ADMIN - GET VOLUNTEER PROFILE
// ======================================

exports.getVolunteerProfile = async (req, res) => {

    try {

        // ======================================
        // ADMIN ONLY
        // ======================================

        if (req.user.role !== "ADMIN") {

            return res.status(403).json({

                success: false,
                message: "Access Denied. Admin only."

            });

        }


        // ======================================
        // VOLUNTEER ID
        // ======================================

        const volunteerId =
            Number(req.params.id);


        if (!Number.isInteger(volunteerId)) {

            return res.status(400).json({

                success: false,
                message: "Invalid volunteer ID."

            });

        }


        // ======================================
        // GET VOLUNTEER
        // ======================================

        const volunteer =
            await prisma.user.findFirst({

                where: {

                    id: volunteerId,

                    role: "VOLUNTEER"

                },

                select: {

                    id: true,
                    fullName: true,
                    mobile: true,
                    email: true,
                    gender: true,
                    college: true,
                    profilePhoto: true,
                    role: true,
                    status: true,
                    isActive: true,
                    createdAt: true,

                    group: {

                        select: {

                            id: true,
                            name: true,

                            camp: {

                                select: {

                                    id: true,
                                    name: true,
                                    address: true

                                }

                            }

                        }

                    }

                }

            });


        // ======================================
        // NOT FOUND
        // ======================================

        if (!volunteer) {

            return res.status(404).json({

                success: false,
                message: "Volunteer not found."

            });

        }


        // ======================================
        // RESPONSE
        // ======================================

        return res.status(200).json({

            success: true,
            data: volunteer

        });

    }

    catch (error) {

        console.error(
            "Get Volunteer Profile Error:",
            error
        );

        return res.status(500).json({

            success: false,
            message: "Unable to load volunteer profile."

        });

    }

};
// ======================================
// UPDATE MY PROFILE
// ======================================

exports.updateMyProfile = async (req, res) => {

    try {

        const userId =
            Number(req.user.id);


        const {

            fullName,
            email,
            college,
            gender,
            profilePhoto

        } = req.body;


        // ======================================
        // CHECK USER
        // ======================================

        const existingUser =
            await prisma.user.findUnique({

                where: {
                    id: userId
                }

            });


        if (!existingUser) {

            return res.status(404).json({

                success: false,
                message: "User not found."

            });

        }


        // ======================================
        // CHECK EMAIL DUPLICATE
        // ======================================

        const formattedEmail =
            email && email.trim() !== ""
                ? email.trim()
                : null;


        if (formattedEmail) {

            const emailExists =
                await prisma.user.findFirst({

                    where: {

                        email: formattedEmail,

                        NOT: {
                            id: userId
                        }

                    }

                });


            if (emailExists) {

                return res.status(400).json({

                    success: false,
                    message:
                        "Email already belongs to another account."

                });

            }

        }


        // ======================================
        // UPDATE
        // ======================================

        const updatedUser =
            await prisma.user.update({

                where: {
                    id: userId
                },

                data: {

                    ...(fullName !== undefined && {
                        fullName: fullName.trim()
                    }),

                    ...(email !== undefined && {
                        email: formattedEmail
                    }),

                    ...(college !== undefined && {
                        college:
                            college.trim() || null
                    }),

                    ...(gender !== undefined && {
                        gender
                    }),

                    ...(profilePhoto !== undefined && {
                        profilePhoto:
                            profilePhoto.trim() || null
                    })

                },

                select: {

                    id: true,
                    fullName: true,
                    mobile: true,
                    email: true,
                    college: true,
                    gender: true,
                    profilePhoto: true,
                    role: true,
                    status: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true

                }

            });


        return res.status(200).json({

            success: true,

            message:
                "Profile updated successfully.",

            data: updatedUser

        });

    }

    catch (error) {

        console.error(
            "Update Profile Error:",
            error
        );


        return res.status(500).json({

            success: false,
            message: "Unable to update profile."

        });

    }

};