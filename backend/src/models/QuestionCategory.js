const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },

  // quantity | mcq_weighted | text
  type: {
    type: String,
    enum: ["quantity", "mcq_weighted", "text"],
    required: true
  },

  // For quantity-based questions
  targetValue: Number,     // e.g. 2 (tons), 10 (trees)
  unit: String,            // tons, trees
  maxMarks: Number,

  // For MCQ weighted questions
  options: [
    {
      label: String,
      value: String,
      marks: Number
    }
  ],

  // Proof requirement
  requiresProof: {
    type: Boolean,
    default: false
  }
});

const QuestionCategorySchema = new mongoose.Schema(
  {
    competition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Competition",
      required: true
    },
    title: String,
    totalMarks: Number,
    questions: [QuestionSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuestionCategory", QuestionCategorySchema);
