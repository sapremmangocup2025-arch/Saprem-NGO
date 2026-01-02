const VillageSubmission = require("../models/VillageSubmission");
const Village = require("../models/Village");
const QuestionCategory = require("../models/QuestionCategory");

/**
 * VILLAGE: Get my marks (category-wise + total)
 */
exports.getMyMarks = async (req, res) => {
  try {
    const village = await Village.findById(req.user.village)
      .select("stage status");

    const submissions = await VillageSubmission.find({
      village: req.user.village
    }).populate("category", "title totalMarks");

    const totalObtained = submissions.reduce(
      (sum, s) => sum + (s.totalMarks || 0),
      0
    );

    res.json({
      stage: village.stage,        // ✅ REQUIRED FOR GRAPH
      status: village.status,      // ✅ OPTIONAL BUT USEFUL
      categories: submissions.map(s => ({
        category: s.category.title,
        obtainedMarks: s.totalMarks,
        maxMarks: s.category.totalMarks
      })),
      totalObtained
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * ADMIN: Get full report of one village
 */
exports.getVillageReport = async (req, res) => {
  try {
    const village = await Village.findById(req.params.id)
      .populate("competition", "name");

    const submissions = await VillageSubmission.find({
      village: village._id
    }).populate("category", "title totalMarks");

    const totalObtained = submissions.reduce(
      (sum, s) => sum + (s.totalMarks || 0),
      0
    );

    res.json({
      village: village.name,
      competition: village.competition.name,
      categories: submissions,
      totalObtained
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * ADMIN: Competition leaderboard (all villages)
 */
exports.getCompetitionLeaderboard = async (req, res) => {
  try {
    const villages = await Village.find({
      competition: req.params.competitionId,
      status: "active"
    });

    const leaderboard = [];

    for (const village of villages) {
      const submissions = await VillageSubmission.find({
        village: village._id
      });

      const total = submissions.reduce(
        (sum, s) => sum + (s.totalMarks || 0),
        0
      );

      leaderboard.push({
        village: village.name,
        totalMarks: total
      });
    }

    leaderboard.sort((a, b) => b.totalMarks - a.totalMarks);

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
