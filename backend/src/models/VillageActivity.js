const mongoose = require("mongoose");

const VillageActivitySchema = new mongoose.Schema({
  village: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Village",
    required: true
  },

  stage: {
    type: String,
    required: true // must match Village.stage values
  },

  data: {
    type: Object, // flexible form data
    default: {}
  },

  proofs: {
    type: [String], // images / PDFs
    default: []
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("VillageActivity", VillageActivitySchema);
