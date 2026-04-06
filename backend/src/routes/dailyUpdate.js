const express = require("express");
const router = express.Router();
const { auth, staffOnly, adminOnly } = require("../middleware/auth");
const {
  createOrUpdateDailyUpdate,
  getMyUpdates,
  getTodayUpdate,
  getAllUpdates,
  deleteDailyUpdate
} = require("../controllers/dailyUpdateController");

// Staff routes
router.post("/", auth, staffOnly, createOrUpdateDailyUpdate);
router.get("/my-updates", auth, staffOnly, getMyUpdates);
router.get("/today", auth, staffOnly, getTodayUpdate);
router.delete("/:id", auth, staffOnly, deleteDailyUpdate);

// Admin routes
router.get("/all", auth, adminOnly, getAllUpdates);

module.exports = router;