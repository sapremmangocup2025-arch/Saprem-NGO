const router = require("express").Router();
const { applyVillage } = require("../controllers/applicationController");
const upload = require("../middleware/upload");

router.post(
  "/apply",
  upload.single("letter"),
  applyVillage
);
module.exports = router;
