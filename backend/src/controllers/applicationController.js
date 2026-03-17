const Village = require("../models/Village");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { sendMail } = require("../utils/mail");

exports.applyVillage = async (req, res) => {
  try {
    const { villageName, email, competition, workflowVersion, baseline } = req.body;

    // Cloudinary uploaded file URL
    const letterUrl = req.file?.path;

    if (!letterUrl) {
      return res.status(400).json({
        message: "Application letter is required"
      });
    }

    // Determine workflow version (default to v1 for backward compatibility)
    const version = workflowVersion || "v1";
    
    let villageData = {
      name: villageName,
      email,
      competition,
      applicationLetterUrl: letterUrl,
      workflowVersion: version
    };

    if (version === "v2") {
      // New workflow: application + baseline in one step
      if (!baseline) {
        return res.status(400).json({
          message: "Baseline data is required for new application process"
        });
      }

      let baselineData;
      try {
        baselineData = typeof baseline === 'string' ? JSON.parse(baseline) : baseline;
      } catch (err) {
        return res.status(400).json({
          message: "Baseline must be valid JSON"
        });
      }

      villageData.baseline = baselineData;
      villageData.status = "pending_approval";
      villageData.stage = "application_submitted";
    } else {
      // Old workflow: application only
      villageData.status = "applied";
      villageData.stage = "letter_uploaded";
    }

    const village = await Village.create(villageData);

    res.json(village);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
