const router = require("express").Router();
const { auth, adminOnly } = require("../middleware/auth");
const VillageActivity = require("../models/VillageActivity");

router.get(
  "/village/:villageId",
  auth,
  adminOnly,
  async (req, res) => {
    const activities = await VillageActivity.find({
      village: req.params.villageId
    }).sort({ createdAt: -1 });

    res.json(activities);
  }
);

module.exports = router;
