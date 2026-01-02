const router = require("express").Router();
const {
  getAllVillages,
  getAllVillagesWithMarks
} = require("../controllers/adminVillageController");
const { auth, adminOnly } = require("../middleware/auth");

/**
 * Admin only
 */
router.get("/villages", auth, adminOnly, getAllVillages);
router.get("/villages/with-marks", auth, adminOnly, getAllVillagesWithMarks);

module.exports = router;
