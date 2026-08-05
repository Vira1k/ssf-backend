const prisma = require("../config/prisma");
const jwt = require("jsonwebtoken");

// =======================================
// REGISTER
// =======================================

exports.register = async (req, res) => {

    try {

       const {

    fullName,
    mobile,
    email,
    college,
    gender,
    password

} = req.body;

        if (!fullName || !mobile || !gender || !password) {

            return res.status(400).json({

                success: false,

                message: "All required fields are mandatory."

            });

        }

        // ===========================
        // DEBUG LOG
        // ===========================

       console.log("Incoming Data:", {

    fullName,
    mobile,
    email,
    college,
    gender,
    password

});
 const formattedEmail = email && email.trim() !== ""
    ? email.trim()
    : null;

const existingUser = await prisma.user.findFirst({

    where: {

        OR: [

            {
                mobile: mobile
            },

            ...(formattedEmail ? [

                {
                    email: formattedEmail
                }

            ] : [])

        ]

    }

});
        console.log("Existing User:", existingUser);

        if (existingUser) {

            return res.status(400).json({

                success: false,

                message: "Volunteer already exists."

            });

        }

        const user = await prisma.user.create({

    data: {

    fullName,

    mobile,

    email: formattedEmail,

    college,

    gender,

    password

}

        });

        const { password: _, ...userData } = user;

        return res.status(201).json({

            success: true,

            message: "Registration successful. Wait for Admin approval.",

            user: userData

        });

    }

    catch (error) {

        console.error("REGISTER ERROR:", error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// =======================================
// LOGIN
// =======================================

exports.login = async (req, res) => {

    try {

        const {

            mobile,
            password

        } = req.body;

        const user = await prisma.user.findUnique({

            where: {

                mobile

            }

        });

        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found."

            });

        }

        if (password !== user.password) {

            return res.status(400).json({

                success: false,

                message: "Invalid password."

            });

        }

        if (user.status !== "APPROVED") {

            return res.status(403).json({

                success: false,

                message: "Waiting for Admin approval."

            });

        }

        const token = jwt.sign(

            {

                id: user.id,
                role: user.role

            },

            process.env.JWT_SECRET,

            {

                expiresIn: "7d"

            }

        );

        const { password: _, ...userData } = user;

        return res.status(200).json({

            success: true,

            token,

            user: userData

        });

    }

    catch (error) {

        console.error("LOGIN ERROR:", error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
// =======================================
// VERIFY TOKEN
// =======================================

exports.verifyToken = async (req, res) => {

    try {

        const user = await prisma.user.findUnique({

            where: {

                id: req.user.id

            },

            select: {

                id: true,
                fullName: true,
                mobile: true,
                role: true,
                status: true

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

            user

        });

    }

    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};