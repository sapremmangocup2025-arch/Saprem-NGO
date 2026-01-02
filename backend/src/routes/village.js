const router = require("express").Router();
const { submitBaseline, getCategories, submitCategory } = require("../controllers/villageController");
const { auth } = require("../middleware/auth");
const upload = require("../middleware/upload");



router.post(
  "/baseline/:id",
  upload.single("baselineProof"),
  submitBaseline
);
router.get("/categories", auth, getCategories);
router.post(
  "/submit-category",
  auth,
  upload.array("proofs"),
  submitCategory
);

module.exports = router;