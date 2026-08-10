// ======================================
// SSF SERVER
// ======================================

"use strict";

// ======================================
// ENVIRONMENT
// ======================================

require("dotenv").config();

// ======================================
// PRISMA
// ======================================

const prisma = require("./config/prisma");

// ======================================
// APP
// ======================================

const app = require("./app");

// ======================================
// SCHEDULER
// ======================================

const {
    startScheduler
} = require("./services/scheduler.service");

// ======================================
// PORT
// ======================================

const PORT = process.env.PORT || 5000;


// ======================================
// START SERVER
// ======================================

app.listen(
    PORT,
    async () => {

        console.log(
            "===================================="
        );

        console.log(
            "🚀 SSF Teaching Management API"
        );

        console.log(
            `🌐 Server Running : http://localhost:${PORT}`
        );

        console.log(
            "===================================="
        );


        // ======================================
        // WARM DATABASE CONNECTION
        // ======================================

        try {

            await prisma.$connect();

            console.log(
                "✅ Database connection warmed"
            );

        } catch (error) {

            console.error(
                "❌ Database connection failed:",
                error.message
            );

        }


        // ======================================
        // START NOTIFICATION SCHEDULER
        // ======================================

        startScheduler();

    }
);