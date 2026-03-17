const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { auth } = require("../middleware/auth");

// General file upload endpoint
router.post("/", auth, upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    res.json({
      message: "File uploaded successfully",
      url: req.file.path,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

// Multiple files upload endpoint
router.post("/multiple", auth, upload.array("files", 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadedFiles = req.files.map(file => ({
      url: file.path,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size
    }));

    res.json({
      message: "Files uploaded successfully",
      files: uploadedFiles
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

module.exports = router;