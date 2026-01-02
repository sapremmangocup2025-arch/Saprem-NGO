const router = require("express").Router();
const {
  getMyMarks,
  getVillageReport,
  getCompetitionLeaderboard
} = require("../controllers/reportController");
const { auth, adminOnly } = require("../middleware/auth");

/**
 * Village
 */
router.get("/my-marks", auth, getMyMarks);

/**
 * Admin
 */
router.get("/village/:id", auth, adminOnly, getVillageReport);
router.get(
  "/competition/:competitionId/leaderboard",
  auth,
  adminOnly,
  getCompetitionLeaderboard
);

module.exports = router;
