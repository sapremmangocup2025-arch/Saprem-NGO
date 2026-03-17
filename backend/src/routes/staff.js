const express = require("express");
const router = express.Router();
const { auth, adminOnly } = require("../middleware/auth");
const staffController = require("../controllers/staffController");

// Admin routes
router.post("/", auth, adminOnly, staffController.createStaff);
router.get("/", auth, staffController.getAllStaff);
router.get("/profile", auth, staffController.getStaffByUserId);
router.get("/:id", auth, staffController.getStaffById);
router.put("/:id", auth, adminOnly, staffController.updateStaff);
router.delete("/:id", auth, adminOnly, staffController.deleteStaff);

module.exports = router;
