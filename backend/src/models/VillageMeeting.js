const mongoose = require("mongoose");

const VillageMeetingSchema = new mongoose.Schema({
  village: { type: mongoose.Schema.Types.ObjectId, ref: "Village", required: true },
  conductedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
  meetingDate: { type: Date, required: true },
  meetingTime: { type: String, required: true },
  purpose: { type: String, required: true },
  agenda: { type: String, required: true },
  numberOfParticipants: { type: Number, required: true },
  participantDetails: [{
    name: String,
    role: String,
    contact: String
  }],
  photos: [{ type: String }],
  minutesOfMeeting: { type: String },
  actionPoints: [{
    action: String,
    responsiblePerson: String,
    deadline: Date,
    status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" }
  }],
  followUpTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "StaffTask" }],
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
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

module.exports = mongoose.model("VillageMeeting", VillageMeetingSchema);
