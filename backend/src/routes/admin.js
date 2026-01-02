const router = require("express").Router();
const { approveApplication, approveBaseline ,updateVillageStage} = require("../controllers/adminController");
const { auth, adminOnly } = require("../middleware/auth");
router.post("/application/:id/approve", auth, adminOnly, approveApplication);
router.post("/baseline/:id/approve", auth, adminOnly, approveBaseline);
router.post(
  "/village/:id/stage",
  auth,
  adminOnly,
  updateVillageStage
);

module.exports = router;