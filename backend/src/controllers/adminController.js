const Village = require("../models/Village");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { sendMail } = require("../utils/mail");

/**
 * STEP 1: Admin approves village application
 * - Updates SAME Village record
 * - Status: applied → baseline_pending
 * - Sends baseline survey email
 */
exports.approveApplication = async (req, res) => {
  try {
    const village = await Village.findById(req.params.id);
    if (!village) {
      return res.status(404).json({ message: "Village not found" });
    }

    village.status = "baseline_pending";
    village.stage = "criteria_selected";  
    await village.save();

    await sendMail({
      to: village.email,
      subject: "Baseline Survey – SAPREM NGO",
      html: `
        <p>Dear ${village.name},</p>
        <p>Your village application has been approved.</p>
        <p>Please complete the baseline survey using the link below:</p>
        <a href="${process.env.FRONTEND_BASE_URL}/baseline/${village._id}">
          Fill Baseline Survey
        </a>
        <p>Regards,<br/>SAPREM NGO</p>
      `
    });

    res.json({
      message: "Application approved, baseline survey email sent"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * STEP 2: Admin approves baseline survey
 * - Creates village login credentials
 * - Status: baseline_submitted → active
 * - Sends login credentials email
 */
exports.approveBaseline = async (req, res) => {
  try {
    const village = await Village.findById(req.params.id);
    if (!village) {
      return res.status(404).json({ message: "Village not found" });
    }

  //   if (!village.competition.isActive) {
  //   return res.status(400).json({
  //     message: "Baseline approval is disabled for past competitions"
  //   });
  // }

    // Prevent duplicate user creation
    if (village.user) {
      return res.status(400).json({ message: "Village already activated" });
    }

    const password = Math.random().toString(36).slice(-8);
    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: village.name,
      email: village.email,
      password: hashed,
      role: "village",
      village: village._id
    });

    village.user = user._id;
    village.status = "active";
    village.stage = "village_selected"; 
    await village.save();

    await sendMail({
      to: village.email,
      subject: "Village Login Credentials – SAPREM NGO",
      html: `
        <p>Dear ${village.name},</p>
        <p>Your baseline survey has been approved and your village account is now active.</p>
        <p><b>Login Details:</b></p>
        <p>Email: ${village.email}</p>
        <p>Password: ${password}</p>
        <p>Login here:</p>
        <a href="${process.env.FRONTEND_BASE_URL}/login">
          Village Login
        </a>
        <p>Please change your password after logging in.</p>
        <p>Regards,<br/>SAPREM NGO</p>
      `
    });

    res.json({
      message: "Baseline approved, village activated & credentials emailed"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.rejectApplication = async (req, res) => {
  try {
    const village = await Village.findById(req.params.id);
    if (!village) {
      return res.status(404).json({ message: "Village not found" });
    }

    // Prevent rejecting an already active village
    if (village.status === "active") {
      return res.status(400).json({
        message: "Active village cannot be rejected"
      });
    }

    village.status = "rejected";
    village.stage = "letter_uploaded"; // safe fallback
    await village.save();

    // Optional rejection email
    await sendMail({
      to: village.email,
      subject: "Application Update – SAPREM NGO",
      html: `
        <p>Dear ${village.name},</p>
        <p>Thank you for applying to the competition.</p>
        <p>After review, your application could not be approved at this time.</p>
        <p>You may apply again in future competitions.</p>
        <p>Regards,<br/>SAPREM NGO</p>
      `
    });

    res.json({
      message: "Application rejected successfully"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.updateVillageStage = async (req, res) => {
  try {
    const { stage } = req.body;

    const village = await Village.findById(req.params.id);
    if (!village) {
      return res.status(404).json({ message: "Village not found" });
    }

    village.stage = stage;
    await village.save();

    res.json({
      message: "Village stage updated",
      stage
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
