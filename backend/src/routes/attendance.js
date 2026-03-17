const express = require("express");
const router = express.Router();
const { auth, adminOnly } = require("../middleware/auth");
const attendanceController = require("../controllers/attendanceController");

// Staff routes
router.post("/check-in", auth, attendanceController.checkIn);
router.post("/check-out", auth, attendanceController.checkOut);
router.get("/today", auth, attendanceController.getTodayAttendance);
router.get("/history", auth, attendanceController.getAttendanceHistory);
router.post("/leave", auth, attendanceController.markLeave);

// Admin/Supervisor routes
router.get("/live-presence", auth, attendanceController.getLivePresence);
router.put("/:id/approve", auth, attendanceController.approveAttendance);

module.exports = router;
