const VillageActivity = require("../models/VillageActivity");

/**
 * Village submits activity data for a stage
 */
exports.submitActivity = async (req, res) => {
  try {
    const villageId = req.user.village;
    const { stage, data } = req.body;

    if (!stage) {
      return res.status(400).json({ message: "Stage is required" });
    }

    const proofs = [];
    if (req.files && req.files.length) {
      req.files.forEach(f => proofs.push(f.path));
    }

    const activity = await VillageActivity.create({
      village: villageId,
      stage,
      data: data ? JSON.parse(data) : {},
      proofs
    });

    res.json({
      message: "Activity submitted successfully",
      activity
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Village views its own activities
 */
exports.getMyActivities = async (req, res) => {
  const activities = await VillageActivity.find({
    village: req.user.village
  }).sort({ createdAt: -1 });

  res.json(activities);
};
