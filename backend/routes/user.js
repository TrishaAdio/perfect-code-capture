const express = require("express");
const rateLimit = require("express-rate-limit");
const ctrl = require("../controllers/userController");
const requireAuth = require("../middleware/auth");

const router = express.Router();

const updateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, try again later." },
});

router.patch("/update-name", requireAuth, updateLimiter, ctrl.updateName);
router.patch("/update-email", requireAuth, updateLimiter, ctrl.updateEmail);
router.patch("/update-password", requireAuth, updateLimiter, ctrl.updatePassword);

module.exports = router;
