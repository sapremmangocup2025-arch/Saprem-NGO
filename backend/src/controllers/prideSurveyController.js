const PrideSurvey = require("../models/PrideSurvey");

/**
 * Submit Pride Project baseline survey
 */
exports.submitPrideSurvey = async (req, res) => {
  try {
    const survey = await PrideSurvey.create(req.body);

    res.json({
      message: "Pride baseline survey submitted successfully",
      surveyId: survey._id
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Admin: list all surveys
 */
exports.getAllSurveys = async (req, res) => {
  const surveys = await PrideSurvey.find().sort({ createdAt: -1 });
  res.json(surveys);
};

/**
 * Admin: get single survey
 */
exports.getSurveyById = async (req, res) => {
  const survey = await PrideSurvey.findById(req.params.id);
  if (!survey) {
    return res.status(404).json({ message: "Survey not found" });
  }
  res.json(survey);
};
