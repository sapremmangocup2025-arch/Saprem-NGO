const mongoose = require("mongoose");

const CompetitionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    totalMarks: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Competition", CompetitionSchema);
