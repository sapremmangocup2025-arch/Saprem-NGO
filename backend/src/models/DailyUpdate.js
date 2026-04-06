const mongoose = require("mongoose");

const DailyUpdateSchema = new mongoose.Schema({
  staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
  date: { type: Date, required: true },
  update: { type: String, required: true }, // Simple text field for daily efforts
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Ensure one update per staff per day
DailyUpdateSchema.index({ staff: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailyUpdate", DailyUpdateSchema);