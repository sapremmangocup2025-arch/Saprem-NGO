const router = require("express").Router();
const { createCategory, addQuestion } = require("../controllers/categoryController");
const { auth, adminOnly } = require("../middleware/auth");

router.post("/create", auth, adminOnly, createCategory);
router.post("/:categoryId/add-question", auth, adminOnly, addQuestion);

module.exports = router;
