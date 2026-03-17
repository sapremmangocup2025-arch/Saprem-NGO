const mongoose = require("mongoose");

const StaffSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  employeeId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  project: { type: String },
  assignedVillages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Village" }],
  joiningDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  supervisor: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
  profilePhoto: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Staff", StaffSchema);
