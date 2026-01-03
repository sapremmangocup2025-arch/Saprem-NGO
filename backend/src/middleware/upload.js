const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const isPdf = file.mimetype === "application/pdf";

    return {
      folder: "saprem_ngo",
      resource_type: isPdf ? "raw" : "image",
      allowed_formats: isPdf
        ? ["pdf"]
        : ["jpg", "jpeg", "png"]
    };
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit (optional but recommended)
  }
});

module.exports = upload;
