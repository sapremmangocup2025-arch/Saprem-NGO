const express = require("express");
const router = express.Router();
const { auth, adminOnly } = require("../middleware/auth");
const dashboardController = require("../controllers/dashboardController");

// Get comprehensive dashboard statistics (Admin only)
router.get("/stats", auth, adminOnly, dashboardController.getDashboardStats);

// Get activity summary for date range (Admin only)
router.get("/activity-summary", auth, adminOnly, dashboardController.getActivitySummary);

module.exports = router;