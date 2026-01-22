const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
name: String,
email: { type: String, unique: true },
password: String,
role: { type: String, enum: ["admin", "village"] },
village: { type: mongoose.Schema.Types.ObjectId, ref: "Village" },
resetPasswordToken: String,
  resetPasswordExpiry: Date
});
module.exports = mongoose.model("User", UserSchema);