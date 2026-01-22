const router = require("express").Router();
const { registerAdmin, login ,getMyProfile,forgotPassword,updatePassword} = require("../controllers/authController");
const { auth } = require("../middleware/auth");

router.post("/register-admin", registerAdmin);
router.post("/login", login);
router.get("/me", auth, getMyProfile);
router.post("/forgot-password", forgotPassword);
router.post("/update-password", auth, updatePassword);

module.exports = router;