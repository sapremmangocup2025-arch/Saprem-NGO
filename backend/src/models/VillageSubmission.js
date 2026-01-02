const mongoose = require("mongoose");

const VillageSubmissionSchema = new mongoose.Schema(
  {
    village: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Village"
    },
    competition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Competition"
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuestionCategory"
    },
    answers: [
      {
        questionId: String,
        achievedValue: Number,
        selectedOption: String,
        textAnswer: String,
        awardedMarks: Number,
        proofUrl: String
      }
    ],
    totalMarks: Number
  },
  { timestamps: true }
);

module.exports = mongoose.model("VillageSubmission", VillageSubmissionSchema);
