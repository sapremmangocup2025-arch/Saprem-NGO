const mongoose = require("mongoose");

const VillageSchema = new mongoose.Schema({
  name: String,
  email: String,

  competition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Competition"
  },

  // application letter
  applicationLetterUrl: String,

  // baseline survey data
  baseline: Object,

  status: {
    type: String,
    enum: [
      "applied",
      "baseline_pending",
      "baseline_submitted",
      "active",
      "rejected"
    ],
    default: "applied"
  },

  stage: {
  type: String,
  enum: [
    "letter_uploaded",
    "criteria_selected",
    "baseline_completed",
    "village_selected",
    "training_completed",
    "site_selected",
    "land_prepared",
    "trees_delivered",
    "public_contribution",
    "inauguration_done",
    "awareness_activity",
    "meetings_done",
    "evaluation_done",
    "thank_you_letter",
    "award_function"
  ],
  default: "letter_uploaded"
},


  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

module.exports = mongoose.model("Village", VillageSchema);
