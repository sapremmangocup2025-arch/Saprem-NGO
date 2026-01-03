const Village = require("../models/Village");


exports.applyVillage = async (req, res) => {
  try {
    const { villageName, email, competition } = req.body;

    // Cloudinary uploaded file URL
   const letterUrl = req.file?.path;

    if (!letterUrl) {
      return res.status(400).json({
        message: "Application letter is required"
      });
    }

    const village = await Village.create({
      name: villageName,
      email,
      competition,
      applicationLetterUrl: letterUrl,
      status: "applied",
      stage: "letter_uploaded"
    });

    res.json(village);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
