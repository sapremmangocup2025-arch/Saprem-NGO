const router = require("express").Router();
const { submitBaseline, getCategories, submitCategory, getMyCategorySubmission, getAllVillages} = require("../controllers/villageController");
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

router.get(
  "/category/:categoryId/submission",
  auth,
  getMyCategorySubmission
);

router.get("/all", auth, getAllVillages);


module.exports = router;