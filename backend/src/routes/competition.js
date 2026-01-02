const router = require("express").Router();
const {
  createCompetition,
  getCompetitions,
  getCompetitionVillages
} = require("../controllers/competitionController");
const { auth, adminOnly } = require("../middleware/auth");

/**
 * Admin only
 */
router.post("/create", auth, adminOnly, createCompetition);

/**
 * Admin + Village
 */
router.get("/", auth, getCompetitions);

/**
 * Admin only: villages inside competition
 */
router.get("/:id/villages", auth, adminOnly, getCompetitionVillages);

module.exports = router;
