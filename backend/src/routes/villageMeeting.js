const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const upload = require("../middleware/upload");
const villageMeetingController = require("../controllers/villageMeetingController");

// Village meeting routes
router.post("/", auth, upload.array("photos", 10), villageMeetingController.createMeeting);
router.get("/", auth, villageMeetingController.getAllMeetings);
router.get("/my-meetings", auth, villageMeetingController.getMyMeetings);
router.get("/village/:villageId", auth, villageMeetingController.getMeetingsByVillage);
router.get("/:id", auth, villageMeetingController.getMeetingById);
router.put("/:id", auth, upload.array("photos", 10), villageMeetingController.updateMeeting);
router.put("/:id/approve", auth, villageMeetingController.approveMeeting);
router.delete("/:id", auth, villageMeetingController.deleteMeeting);

module.exports = router;
