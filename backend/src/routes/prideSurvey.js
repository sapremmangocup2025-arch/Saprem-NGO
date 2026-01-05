const router = require("express").Router();
const { submitPrideSurvey,getAllSurveys,getSurveyById } = require("../controllers/prideSurveyController");
const { auth, adminOnly } = require("../middleware/auth");

router.post("/submit", submitPrideSurvey);
router.get("/", auth, adminOnly, getAllSurveys);
router.get("/:id", auth, adminOnly, getSurveyById);

module.exports = router;
