const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const upload = require("../middleware/upload");
const fieldVisitController = require("../controllers/fieldVisitController");

// Field visit routes
router.post("/", auth, upload.array("photos", 10), fieldVisitController.createVisit);
router.get("/", auth, fieldVisitController.getAllVisits);
router.get("/my-visits", auth, fieldVisitController.getMyVisits);
router.get("/statistics", auth, fieldVisitController.getVisitStatistics);
router.get("/village/:villageId", auth, fieldVisitController.getVisitsByVillage);
router.get("/:id", auth, fieldVisitController.getVisitById);
router.put("/:id", auth, upload.array("photos", 10), fieldVisitController.updateVisit);
router.put("/:id/approve", auth, fieldVisitController.approveVisit);
router.delete("/:id", auth, fieldVisitController.deleteVisit);

module.exports = router;
