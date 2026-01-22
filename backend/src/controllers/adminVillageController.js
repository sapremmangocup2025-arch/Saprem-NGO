const Village = require("../models/Village");
const VillageSubmission = require("../models/VillageSubmission");

/**
 * ADMIN: Get all villages with basic details
 */
exports.getAllVillages = async (req, res) => {
  try {
    const villages = await Village.find()
      .populate("competition", "name","isActive")
      .select(
        "name email status stage baseline competition applicationLetterUrl createdAt"
      );

    res.json(villages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/**
 * ADMIN: Get all villages with marks summary
 */
exports.getAllVillagesWithMarks = async (req, res) => {
  try {
    const villages = await Village.find()
      .populate("competition", "name");

    const result = [];

    for (const village of villages) {
      const submissions = await VillageSubmission.find({
        village: village._id
      });

      const totalMarks = submissions.reduce(
        (sum, s) => sum + (s.totalMarks || 0),
        0
      );

      result.push({
        _id: village._id,
        name: village.name,
        email: village.email,
        status: village.status,
        competition: village.competition?.name,
        totalMarks
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
