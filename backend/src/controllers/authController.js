const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const crypto = require("crypto");
const { sendMail } = require("../utils/mail");



exports.registerAdmin = async (req,res)=>{
const hashed = await bcrypt.hash(req.body.password,10);
const admin = await User.create({...req.body,password:hashed,role:"admin"});
res.json(admin);
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate("village");
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        village: user.village
          ? {
              id: user.village._id,
              name: user.village.name,
              status: user.village.status,
              stage: user.village.stage
            }
          : null
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET MY PROFILE
 */
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -resetPasswordToken -resetPasswordExpiry")
      .populate("village");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      village: user.village
        ? {
            id: user.village._id,
            name: user.village.name,
            email: user.village.email,
            status: user.village.status,
            stage: user.village.stage
          }
        : null
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * FORGOT PASSWORD (SEND EMAIL)
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "If user exists, reset link sent" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = token;
    user.resetPasswordExpiry = Date.now() + 15 * 60 * 1000; // 15 min
    await user.save();

    const link = `${process.env.FRONTEND_BASE_URL}/reset-password/${token}`;

    await sendMail({
      to: user.email,
      subject: "Reset Password – SAPREM NGO",
      html: `
        <p>Click the link below to reset your password:</p>
        <a href="${link}">Reset Password</a>
        <p>This link expires in 15 minutes.</p>
      `
    });

    res.json({ message: "If user exists, reset link sent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * CHANGE / RESET PASSWORD (SINGLE API)
 */
exports.updatePassword = async (req, res) => {
  try {
    const { token, oldPassword, newPassword } = req.body;

    // 🔁 RESET PASSWORD FLOW
    if (token) {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpiry: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({
          message: "Invalid or expired reset token"
        });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiry = undefined;
      await user.save();

      return res.json({ message: "Password reset successful" });
    }

    // 🔁 CHANGE PASSWORD FLOW (LOGGED IN)
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) {
      return res.status(400).json({ message: "Old password incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
