const mongoose = require("mongoose");

const FieldVisitSchema = new mongoose.Schema({
  village: { type: String, required: true }, // Changed from ObjectId to String for village name
  staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
  visitDate: { type: Date, required: true },
  visitTime: { type: String, required: true },
  purpose: { 
    type: String, 
    required: true,
    enum: ["Survey", "Meeting", "Monitoring", "Awareness", "Training", "Distribution", "Other"]
  },
  purposeDetails: { type: String, required: true },
  workDone: { type: String, required: true },
  peopleMetCount: { type: Number },
  peopleMet: [{
    name: String,
    role: String,
    contact: String
  }],
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: String
  },
  photos: [{ type: String }],
  videos: [{ type: String }],
  observations: { type: String },
  challenges: { type: String },
  recommendations: { type: String },
  followUpRequired: { type: Boolean, default: false },
  followUpDetails: { type: String },
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

module.exports = mongoose.model("FieldVisit", FieldVisitSchema);
