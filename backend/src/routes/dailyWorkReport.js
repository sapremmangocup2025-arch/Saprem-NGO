const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const dailyWorkReportController = require("../controllers/dailyWorkReportController");

// Daily work report routes
router.post("/", auth, dailyWorkReportController.createReport);
router.get("/", auth, dailyWorkReportController.getAllReports);
router.get("/my-reports", auth, dailyWorkReportController.getMyReports);
router.get("/today", auth, dailyWorkReportController.getTodayReport);
router.get("/:id", auth, dailyWorkReportController.getReportById);
router.put("/:id", auth, dailyWorkReportController.updateReport);
router.put("/:id/comments", auth, dailyWorkReportController.addSupervisorComments);

module.exports = router;
