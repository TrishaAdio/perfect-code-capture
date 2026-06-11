const { z } = require("zod");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const Order = require("../models/Order");
const { signToken } = require("../config/jwt");
const { sendOtpEmail, generateOtp } = require("../utils/sendOtpEmail");
const log = require("../utils/logger");

const OTP_TTL_MS = 10 * 60 * 1000;

// Pre-computed dummy bcrypt hash for "this-account-does-not-exist" to keep
// /login response time constant whether or not the email is registered.
// Generated once at boot; matches the cost factor used in User.pre('save').
const DUMMY_HASH = bcrypt.hashSync("dummy-password-not-real-" + crypto.randomBytes(8).toString("hex"), 12);

// Exponential backoff: 1, 2, 4, 8, 15, 30, 60 minutes (capped).
const LOCKOUT_STEPS_MS = [
  1 * 60_000,
  2 * 60_000,
  4 * 60_000,
  8 * 60_000,
  15 * 60_000,
  30 * 60_000,
  60 * 60_000,
];
const LOCKOUT_TRIGGER_AT = 5; // start locking after 5 consecutive failures.

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
  email: z.string().trim().toLowerCase().email("Invalid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email").max(255),
  password: z.string().min(1, "Password is required").max(128),
});

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

exports.signup = async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(res, 400, parsed.error.issues[0]?.message || "Invalid input");

  const { name, password } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();

  try {
    const existing = await User.findOne({ email }).collation({
      locale: "en",
      strength: 2,
    });
    if (existing) return fail(res, 409, "Email is already registered");

    const user = await User.create({ name, email, password });

    try {
      const code = generateOtp();
      user.otp = code;
      user.otpExpiry = new Date(Date.now() + OTP_TTL_MS);
      user.otpLastSentAt = new Date();
      user.otpAttempts = 0;
      await user.save();
      await sendOtpEmail({ to: user.email, name: user.name, code });
    } catch (otpErr) {
      log.warn("signup_otp_failed", { userId: user._id.toString(), reason: otpErr.message });
    }

    const token = signToken({
      sub: user._id.toString(),
      email: user.email,
      tv: user.tokenVersion || 0,
    });

    log.info("signup", { userId: user._id.toString(), reqId: req.id });
    return res
      .status(201)
      .json({ success: true, token, user: user.toSafeJSON() });
  } catch (err) {
    if (err && err.code === 11000) {
      const dupField = err.keyPattern ? Object.keys(err.keyPattern)[0] : null;
      if (dupField === "email") {
        return fail(res, 409, "Email is already registered");
      }
      log.error("signup_dup_key", { field: dupField });
      return fail(res, 409, "Account could not be created");
    }
    log.error("signup_error", { reason: err.message });
    return fail(res, 500, "Server error");
  }
};

exports.login = async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(res, 400, parsed.error.issues[0]?.message || "Invalid input");

  const { email, password } = parsed.data;
  const GENERIC = "Invalid email or password";

  try {
    const user = await User.findOne({ email }).select(
      "+password +loginFailedAttempts +loginLockedUntil"
    );

    // Account lockout — never reveal lock status; just say invalid.
    if (
      user &&
      user.loginLockedUntil &&
      user.loginLockedUntil.getTime() > Date.now()
    ) {
      // Burn time symmetrically so locked-vs-not-locked isn't a timing oracle.
      await bcrypt.compare(password, DUMMY_HASH);
      log.warn("login_locked", {
        userId: user._id.toString(),
        until: user.loginLockedUntil.toISOString(),
        ip: req.ip,
      });
      return fail(res, 401, GENERIC);
    }

    // Always run bcrypt — even if user missing — to equalise response time.
    const ok = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);

    if (!user || !ok) {
      if (user) {
        const next = (user.loginFailedAttempts || 0) + 1;
        user.loginFailedAttempts = next;
        if (next >= LOCKOUT_TRIGGER_AT) {
          const idx = Math.min(
            next - LOCKOUT_TRIGGER_AT,
            LOCKOUT_STEPS_MS.length - 1
          );
          user.loginLockedUntil = new Date(Date.now() + LOCKOUT_STEPS_MS[idx]);
          log.warn("login_lock_applied", {
            userId: user._id.toString(),
            attempts: next,
            until: user.loginLockedUntil.toISOString(),
            ip: req.ip,
          });
        }
        await user.save({ validateBeforeSave: false });
      } else {
        log.warn("login_failed_unknown_email", { ip: req.ip });
      }
      return fail(res, 401, GENERIC);
    }

    // Success — clear counters.
    if (user.loginFailedAttempts || user.loginLockedUntil) {
      user.loginFailedAttempts = 0;
      user.loginLockedUntil = null;
      await user.save({ validateBeforeSave: false });
    }

    const token = signToken({
      sub: user._id.toString(),
      email: user.email,
      tv: user.tokenVersion || 0,
    });
    log.info("login_success", { userId: user._id.toString(), ip: req.ip });
    return res.json({ success: true, token, user: user.toSafeJSON() });
  } catch (err) {
    log.error("login_error", { reason: err.message });
    return fail(res, 500, "Server error");
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) return fail(res, 404, "User not found");
    let totalSaved = 0;
    try {
      const agg = await Order.aggregate([
        { $match: { userId: user._id, status: { $ne: "FAILED" } } },
        { $group: { _id: null, total: { $sum: "$savings" } } },
      ]);
      totalSaved = agg[0]?.total || 0;
    } catch (aggErr) {
      log.warn("me_total_saved_failed", { reason: aggErr.message });
    }
    return res.json({
      success: true,
      user: { ...user.toSafeJSON(), totalSaved },
    });
  } catch (err) {
    log.error("me_error", { reason: err.message });
    return fail(res, 500, "Server error");
  }
};
