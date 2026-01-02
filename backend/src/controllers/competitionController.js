const Competition = require("../models/Competition");
const Village = require("../models/Village");

/**
 * Create competition (Admin only)
 */
exports.createCompetition = async (req, res) => {
  try {
    const { name, totalMarks } = req.body;

    const competition = await Competition.create({
      name,
      totalMarks
    });

    res.json(competition);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get all competitions (Admin + Village)
 */
exports.getCompetitions = async (req, res) => {
  try {
    const competitions = await Competition.find().sort({ createdAt: -1 });
    res.json(competitions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Admin: Get villages inside a competition
 */
exports.getCompetitionVillages = async (req, res) => {
  try {
    const villages = await Village.find({
      competition: req.params.id
    }).select("name email status");

    res.json(villages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
