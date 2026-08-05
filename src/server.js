// ======================================
// SSF SERVER
// ======================================


// Scheduler Import

const {
    startScheduler
} = require("./services/scheduler.service");



// Environment

require("dotenv").config();



// App Import

const app =
require("./app");



// Port

const PORT =
process.env.PORT || 5000;




// ======================================
// START SERVER
// ======================================


app.listen(
PORT,
()=>{


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



    // Start Notification Scheduler

    startScheduler();



});