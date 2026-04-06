const mongoose = require("mongoose");

const StaffTaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  project: { type: String },
  village: { type: String }, // Changed to String to store village name manually
  priority: { 
    type: String, 
    enum: ["Low", "Medium", "High", "Urgent"],
    default: "Medium" // Keep for backward compatibility, but not required
  },
  status: { 
    type: String, 
    enum: ["Assigned", "Ongoing", "Completed", "On Hold", "Cancelled"],
    default: "Assigned"
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  completedDate: { type: Date },
  timeSpent: { type: Number, default: 0 }, // in hours
  attachments: [{ type: String }],
  remarks: { type: String },
  completionRemarks: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("StaffTask", StaffTaskSchema);
