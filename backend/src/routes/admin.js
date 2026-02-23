const router = require("express").Router();
const { approveApplication, approveBaseline ,updateVillageStage,rejectApplication} = require("../controllers/adminController");
const { auth, adminOnly } = require("../middleware/auth");
const {downloadVillageReport} = require("../controllers/villageReportController")
router.post("/application/:id/approve", auth, adminOnly, approveApplication);
router.post("/baseline/:id/approve", auth, adminOnly, approveBaseline);
router.post(
  "/village/:id/stage",
  auth,
  adminOnly,
  updateVillageStage
);
router.post(
  "/application/:id/reject",
  auth,
  adminOnly,
  rejectApplication
);

router.get(
  "/villages/:id/report/pdf",
  auth,
  adminOnly,
  downloadVillageReport
);

module.exports = router;