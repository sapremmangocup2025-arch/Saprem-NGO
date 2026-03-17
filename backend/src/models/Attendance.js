const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
  date: { type: Date, required: true },
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  status: { 
    type: String, 
    enum: ["Present", "Absent", "Half Day", "Leave", "Pending"],
    default: "Pending"
  },
  checkInLocation: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  checkOutLocation: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  checkInPhoto: { type: String },
  checkOutPhoto: { type: String },
  workingHours: { type: Number, default: 0 },
  remarks: { type: String },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvalStatus: { 
    type: String, 
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending"
  },
  approvalRemarks: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

AttendanceSchema.index({ staff: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", AttendanceSchema);
