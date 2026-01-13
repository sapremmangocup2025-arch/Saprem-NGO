const Village = require("../models/Village");
const QuestionCategory = require("../models/QuestionCategory");
const VillageSubmission = require("../models/VillageSubmission");


exports.submitBaseline = async (req, res) => {
  try {
    const villageId = req.params.id;
    const village = await Village.findById(villageId);

    if (!village) {
      return res.status(404).json({ message: "Village not found" });
    }

    if (village.status !== "baseline_pending") {
      return res.status(400).json({
        message: "Baseline not allowed at current stage"
      });
    }

    if (!req.body.baseline) {
      return res.status(400).json({
        message: "Baseline data is required"
      });
    }

    let baselineData;
    try {
      baselineData = JSON.parse(req.body.baseline);
    } catch (err) {
      return res.status(400).json({
        message: "Baseline must be valid JSON"
      });
    }

    village.baseline = {
      ...baselineData,
      proofUrl: req.file?.path || ""

    };

    village.status = "baseline_submitted";
    village.stage = "baseline_completed";

    await village.save();

    res.json({ message: "Baseline submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};



exports.getCategories = async (req,res)=>{
const village = await Village.findById(req.user.village);
const categories = await QuestionCategory.find({competition:village.competition});
res.json(categories);
};


exports.submitCategory = async (req, res) => {
  try {
    const { categoryId } = req.body;

    // answers come as JSON string when using multipart/form-data
    const answers = typeof req.body.answers === "string"
      ? JSON.parse(req.body.answers)
      : req.body.answers;

    const category = await QuestionCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Map uploaded proof files
    const proofMap = {};
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        proofMap[file.originalname] = file.path;

      });
    }

    let totalMarks = 0;

    const evaluatedAnswers = answers.map(ans => {
      const question = category.questions.find(
        q => q._id.toString() === ans.questionId
      );
      if (!question) return null;

      let awardedMarks = 0;

      // 🟢 Quantity-based evaluation
      if (question.type === "quantity") {
        const achieved = Number(ans.achievedValue || 0);
        const percent = Math.min(
          achieved / question.targetValue,
          1
        );
        awardedMarks = Number(
          (percent * question.maxMarks).toFixed(2)
        );
      }

      // 🟢 MCQ weighted evaluation
      if (question.type === "mcq_weighted") {
        const opt = question.options.find(
          o => o.value === ans.selectedOption
        );
        awardedMarks = opt ? opt.marks : 0;
      }

      // 🟡 Text answers → no auto marks
      if (question.type === "text") {
        awardedMarks = 0;
      }

      // 🔐 Proof handling
      const proofUrl = ans.proofKey
        ? proofMap[ans.proofKey]
        : "";

      if (question.requiresProof && !proofUrl) {
        throw new Error(
          `Proof required for question: ${question.text}`
        );
      }

      totalMarks += awardedMarks;

      return {
        questionId: ans.questionId,
        achievedValue: ans.achievedValue,
        selectedOption: ans.selectedOption,
        textAnswer: ans.textAnswer,
        awardedMarks,
        proofUrl
      };
    });

    const submission = await VillageSubmission.create({
      village: req.user.village,
      competition: category.competition,
      category: category._id,
      answers: evaluatedAnswers,
      totalMarks
    });

    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyCategorySubmission = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const submission = await VillageSubmission.findOne({
      village: req.user.village,
      category: categoryId
    });

    if (!submission) {
      return res.json({
        submitted: false,
        answers: [],
        totalMarks: 0
      });
    }

    res.json({
      submitted: true,
      answers: submission.answers,
      totalMarks: submission.totalMarks
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
