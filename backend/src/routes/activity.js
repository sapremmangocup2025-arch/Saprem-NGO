const router = require("express").Router();
const upload = require("../middleware/upload");
const { auth } = require("../middleware/auth");
const {
  submitActivity,
  getMyActivities
} = require("../controllers/activityController");

router.post(
  "/submit",
  auth,
  upload.array("proofs", 10),
  submitActivity
);

router.get("/my", auth, getMyActivities);

module.exports = router;
