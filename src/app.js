const express = require("express");
const cors = require("cors");
const notificationRoutes =
    require("./routes/notification.routes");

// ==============================
// Import Routes
// ==============================

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const studentRoutes = require("./routes/student.routes");
const scheduleRoutes = require("./routes/schedule.routes");
const groupRoutes = require("./routes/group.routes");
const volunteerRoutes = require("./routes/volunteer.routes");
const reportRoutes = require("./routes/report.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const campRoutes = require("./routes/camp.routes");
const profileRoutes = require("./routes/profile.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const marksRoutes = require("./routes/marks.routes");
const availabilityRoutes = require("./routes/availability.routes");
const announcementRoutes =
require("./routes/announcement.routes");

// ==============================
// Create Express App
// ==============================

const app = express();

// ==============================
// Middlewares
// ==============================

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

// ==============================
// Health Check
// ==============================

app.get("/api/health", (req, res) => {

    res.status(200).json({

        success: true,
        message: "SSF Teaching Management System API Running 🚀",
        version: "1.0.0",
        timestamp: new Date()

    });

});

// ==============================
// Default Route
// ==============================

app.get("/", (req, res) => {

    res.json({

        success: true,
        message: "Welcome to SSF Teaching Management System"

    });

});

// ==============================
// API Routes
// ==============================

// Authentication
app.use("/api/auth", authRoutes);

app.use(
    "/api/notifications",
    notificationRoutes
);
app.use(
    "/api/announcements",
    announcementRoutes
);
// Admin
app.use("/api/admin", adminRoutes);

// Students
app.use("/api/students", studentRoutes);

// Groups
app.use("/api/groups", groupRoutes);

// Schedules
app.use("/api/schedules", scheduleRoutes);

// Volunteers
app.use("/api/volunteers", volunteerRoutes);

// Reports
app.use("/api/reports", reportRoutes);

// Attendance
app.use("/api/attendance", attendanceRoutes);

// ✅ Marks
app.use("/api/marks", marksRoutes);

// Camps
app.use("/api/camps", campRoutes);

// Profile
app.use("/api/profile", profileRoutes);

// Analytics
app.use("/api/analytics", analyticsRoutes);
 
app.use(
    "/api/availability",
    availabilityRoutes
);
// ==============================
// 404 Route
// ==============================

app.use((req, res) => {

    res.status(404).json({

        success: false,
        message: "Route Not Found"

    });

});

// ==============================
// Export App
// ==============================

module.exports = app;