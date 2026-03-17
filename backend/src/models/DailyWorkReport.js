const mongoose = require("mongoose");

const DailyWorkReportSchema = new mongoose.Schema({
  staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
  date: { type: Date, required: true },
  tasksWorkedOn: [{
    task: { type: mongoose.Schema.Types.ObjectId, ref: "StaffTask" },
    description: String,
    timeSpent: Number, // in hours
    status: String
  }],
  ongoingActivities: [{ type: String }],
  completedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "StaffTask" }],
  challenges: { type: String },
  achievements: { type: String },
  planForNextDay: { type: String },
  supervisorComments: { type: String },
  supervisorReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

DailyWorkReportSchema.index({ staff: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailyWorkReport", DailyWorkReportSchema);
