const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const staffTaskController = require("../controllers/staffTaskController");

// Task routes
router.post("/", auth, staffTaskController.createTask);
router.get("/", auth, staffTaskController.getAllTasks);
router.get("/my-tasks", auth, staffTaskController.getMyTasks);
router.get("/statistics", auth, staffTaskController.getTaskStatistics);
router.get("/:id", auth, staffTaskController.getTaskById);
router.put("/:id", auth, staffTaskController.updateTask);
router.put("/:id/status", auth, staffTaskController.updateTaskStatus);
router.delete("/:id", auth, staffTaskController.deleteTask);

module.exports = router;
