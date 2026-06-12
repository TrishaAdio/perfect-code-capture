const express = require("express");
const rateLimit = require("express-rate-limit");
const ctrl = require("../controllers/accountController");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// Strict limiter: account deletion is a one-shot destructive action.
// 5 attempts per hour per IP is plenty for legitimate password retries.
const deleteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many deletion attempts. Please try again later.",
  },
});

router.delete("/delete", requireAuth, deleteLimiter, ctrl.deleteAccount);

module.exports = router;
