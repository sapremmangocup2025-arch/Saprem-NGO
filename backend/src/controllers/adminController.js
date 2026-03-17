const Village = require("../models/Village");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { sendMail } = require("../utils/mail");

/**
 * STEP 1: Admin approves village application
 * - V1 workflow: Updates status to baseline_pending, sends baseline email
 * - V2 workflow: Creates user credentials immediately, sends login email
 */
exports.approveApplication = async (req, res) => {
  try {
    const village = await Village.findById(req.params.id);
    if (!village) {
      return res.status(404).json({ message: "Village not found" });
    }

    if (village.workflowVersion === "v2") {
      // New workflow: approve application with baseline, create user immediately
      if (village.status !== "pending_approval") {
        return res.status(400).json({
          message: "Village is not pending approval"
        });
      }

      // Prevent duplicate user creation
      if (village.user) {
        return res.status(400).json({ message: "Village already activated" });
      }

      console.log('🏘️ Creating user for village:', village.name, 'ID:', village._id);

      const password = Math.random().toString(36).slice(-8);
      const hashed = await bcrypt.hash(password, 10);

      const user = await User.create({
        name: village.name,
        email: village.email,
        password: hashed,
        role: "village",
        village: village._id
      });

      console.log('👤 User created successfully:', user._id);

      village.user = user._id;
      village.status = "active";
      village.stage = "village_selected";
      
      console.log('🏘️ Updating village with user reference:', user._id);
      const savedVillage = await village.save();
      console.log('✅ Village updated successfully:', savedVillage._id, 'User ref:', savedVillage.user);

      // Try to send email, but don't fail if email fails
      try {
        await sendMail({
          to: village.email,
          subject: "Village Application Approved – SAPREM NGO",
          html: `
            <p>Dear ${village.name},</p>
            <p>Your village application and baseline survey have been approved. Your village account is now active.</p>
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
          message: "Application approved, village activated & credentials emailed",
          credentials: {
            email: village.email,
            password: password
          }
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        
        // Still return success with credentials since the village was created successfully
        res.json({
          message: "Application approved and village activated. Email failed to send, but here are the credentials:",
          credentials: {
            email: village.email,
            password: password
          },
          emailError: "Email notification failed - please provide credentials manually"
        });
      }
    } else {
      // Old workflow: approve application, send baseline survey email
      village.status = "baseline_pending";
      village.stage = "criteria_selected";  
      await village.save();

      try {
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
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        
        res.json({
          message: "Application approved. Email failed to send - please contact village manually.",
          baselineLink: `${process.env.FRONTEND_BASE_URL}/baseline/${village._id}`,
          emailError: "Email notification failed"
        });
      }
    }
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

    console.log('🏘️ Creating user for village (baseline):', village.name, 'ID:', village._id);

    const password = Math.random().toString(36).slice(-8);
    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: village.name,
      email: village.email,
      password: hashed,
      role: "village",
      village: village._id
    });

    console.log('👤 User created successfully (baseline):', user._id);

    village.user = user._id;
    village.status = "active";
    village.stage = "village_selected"; 
    
    console.log('🏘️ Updating village with user reference (baseline):', user._id);
    const savedVillage = await village.save();
    console.log('✅ Village updated successfully (baseline):', savedVillage._id, 'User ref:', savedVillage.user);

    try {
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
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      res.json({
        message: "Baseline approved and village activated. Email failed to send, but here are the credentials:",
        credentials: {
          email: village.email,
          password: password
        },
        emailError: "Email notification failed - please provide credentials manually"
      });
    }
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
    // Set appropriate stage based on workflow version
    village.stage = village.workflowVersion === "v2" ? "application_submitted" : "letter_uploaded";
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
