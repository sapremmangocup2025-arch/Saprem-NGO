const express = require("express");
const router = express.Router();
const { auth, staffOnly, supervisorOnly } = require("../middleware/auth");
const staffReportController = require("../controllers/staffReportController");

// Staff report routes
router.get("/my-report", auth, staffOnly, staffReportController.getMyComprehensiveReport);
router.get("/my-report/pdf", auth, staffOnly, staffReportController.generateMyReportPDF);

// Admin report routes
router.get("/all-staff", auth, supervisorOnly, staffReportController.getAllStaffReports);
router.get("/performance", auth, staffReportController.getStaffPerformanceReport);
router.get("/activity-summary", auth, staffReportController.getActivitySummary);
router.get("/village-activity", auth, staffReportController.getVillageActivityReport);
router.get("/monthly-attendance", auth, staffReportController.getMonthlyAttendanceReport);
router.get("/task-completion", auth, staffReportController.getTaskCompletionReport);

module.exports = router;
