const { z } = require("zod");
const User = require("../models/User");
const { sendOtpEmail, generateOtp } = require("../utils/sendOtpEmail");
const log = require("../utils/logger");

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30s
const MAX_OTP_ATTEMPTS = 5; // invalidate OTP after 5 wrong tries

const verifySchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

exports.sendOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).select(
      "+otp +otpExpiry +otpLastSentAt +otpAttempts"
    );
    if (!user) return fail(res, 404, "User not found");
    if (user.isVerified) {
      return res.json({ success: true, alreadyVerified: true });
    }

    const now = Date.now();
    if (
      user.otpLastSentAt &&
      now - new Date(user.otpLastSentAt).getTime() < RESEND_COOLDOWN_MS
    ) {
      const waitMs =
        RESEND_COOLDOWN_MS - (now - new Date(user.otpLastSentAt).getTime());
      return fail(
        res,
        429,
        `Please wait ${Math.ceil(waitMs / 1000)}s before requesting another code`
      );
    }

    const code = generateOtp();
    user.otp = code;
    user.otpExpiry = new Date(now + OTP_TTL_MS);
    user.otpLastSentAt = new Date(now);
    user.otpAttempts = 0; // reset attempt counter for the new code
    await user.save();

    try {
      await sendOtpEmail({ to: user.email, name: user.name, code });
    } catch (err) {
      log.error("otp_send_email_failed", { reason: err.message });
      return fail(res, 502, "Failed to send verification email");
    }

    return res.json({ success: true, expiresInSec: OTP_TTL_MS / 1000 });
  } catch (err) {
    log.error("otp_send_error", { reason: err.message });
    return fail(res, 500, "Server error");
  }
};

exports.verifyOtp = async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success)
    return fail(res, 400, parsed.error.issues[0]?.message || "Invalid input");

  const { code } = parsed.data;
  try {
    const user = await User.findById(req.user.sub).select(
      "+otp +otpExpiry +otpAttempts"
    );
    if (!user) return fail(res, 404, "User not found");
    if (user.isVerified) {
      return res.json({ success: true, user: user.toSafeJSON() });
    }
    if (!user.otp || !user.otpExpiry) {
      return fail(res, 400, "No code requested. Send a new code.");
    }
    if (Date.now() > new Date(user.otpExpiry).getTime()) {
      return fail(res, 400, "Code expired. Request a new one.");
    }

    if (String(user.otp) !== code) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
        // Burn the OTP so future guesses can't continue.
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpAttempts = 0;
        await user.save();
        log.warn("otp_invalidated_too_many_attempts", {
          userId: user._id.toString(),
        });
        return fail(res, 400, "Too many incorrect attempts. Request a new code.");
      }
      await user.save();
      return fail(res, 400, "Incorrect code");
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpLastSentAt = undefined;
    user.otpAttempts = 0;
    await user.save();
    log.info("otp_verified", { userId: user._id.toString() });

    return res.json({ success: true, user: user.toSafeJSON() });
  } catch (err) {
    log.error("otp_verify_error", { reason: err.message });
    return fail(res, 500, "Server error");
  }
};
