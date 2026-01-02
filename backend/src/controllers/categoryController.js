const QuestionCategory = require("../models/QuestionCategory");

/**
 * Admin creates category
 */
exports.createCategory = async (req, res) => {
  try {
    const { competitionId, title, totalMarks } = req.body;

    const category = await QuestionCategory.create({
      competition: competitionId,
      title,
      totalMarks,
      questions: []
    });

    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Admin adds question (quantity / mcq_weighted / text)
 */
exports.addQuestion = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await QuestionCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.questions.push(req.body);
    await category.save();

    res.json({
      message: "Question added successfully",
      category
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
