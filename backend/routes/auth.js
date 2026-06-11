const express = require("express");
const rateLimit = require("express-rate-limit");
const ctrl = require("../controllers/authController");
const otpCtrl = require("../controllers/otpController");
const resetCtrl = require("../controllers/passwordResetController");
const googleCtrl = require("../controllers/googleAuthController");
const requireAuth = require("../middleware/auth");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, try again later." },
});

const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, try again later." },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, try again later." },
});

router.post("/signup", authLimiter, ctrl.signup);
router.post("/login", authLimiter, ctrl.login);
router.get("/me", requireAuth, ctrl.me);
router.post("/send-otp", requireAuth, otpSendLimiter, otpCtrl.sendOtp);
router.post("/verify-otp", requireAuth, otpVerifyLimiter, otpCtrl.verifyOtp);

// Google OAuth — start + callback. Lightly rate-limited to discourage
// state-cookie probing while still allowing legitimate retries.
const googleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, try again later." },
});
router.get("/google", googleLimiter, googleCtrl.start);
router.get("/google/callback", googleLimiter, googleCtrl.callback);

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, try again later." },
});
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, try again later." },
});

router.post("/forgot-password", forgotLimiter, resetCtrl.forgotPassword);
router.get("/reset-password/:token", resetLimiter, resetCtrl.verifyResetToken);
router.post("/reset-password", resetLimiter, resetCtrl.resetPassword);

module.exports = router;
