const crypto = require("crypto");
const { z } = require("zod");
const User = require("../models/User");
const { sendResetEmail } = require("../utils/sendResetEmail");

const RESET_TTL_MS = 10 * 60 * 1000; // 10 minutes

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email").max(255),
});

const resetSchema = z.object({
  token: z.string().trim().min(20).max(200),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getFrontendBase(req) {
  const env = (process.env.FRONTEND_URL || "").trim().replace(/\/+$/, "");
  if (env) return env;
  const origin = (req.headers.origin || "").trim().replace(/\/+$/, "");
  if (origin) return origin;
  return `${req.protocol}://${req.get("host")}`;
}

exports.forgotPassword = async (req, res) => {
  const parsed = forgotSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(res, 400, parsed.error.issues[0]?.message || "Invalid input");

  const { email } = parsed.data;

  // Generic response — never disclose whether the email exists.
  const generic = {
    success: true,
    message: "If that email is registered, a reset link has been sent.",
  };

  try {
    const user = await User.findOne({ email }).collation({
      locale: "en",
      strength: 2,
    });
    if (!user) return res.json(generic);

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetTokenHash = hashToken(rawToken);
    user.resetTokenExpiry = new Date(Date.now() + RESET_TTL_MS);
    await user.save();

    const base = getFrontendBase(req);
    const link = `${base}/reset-password/${rawToken}`;

    try {
      await sendResetEmail({ to: user.email, name: user.name, link });
    } catch (err) {
      console.error("[forgot] email API failed:", err.message || err);
      // Roll back token so the user can retry without waiting on stale state.
      user.resetTokenHash = undefined;
      user.resetTokenExpiry = undefined;
      await user.save();
      return fail(res, 502, "Failed to send reset email. Try again.");
    }

    return res.json(generic);
  } catch (err) {
    console.error("[forgot]", err);
    return fail(res, 500, "Server error");
  }
};

exports.verifyResetToken = async (req, res) => {
  const token = String(req.params.token || "").trim();
  if (token.length < 20) return fail(res, 400, "Invalid reset link");
  try {
    const user = await User.findOne({
      resetTokenHash: hashToken(token),
    }).select("+resetTokenHash +resetTokenExpiry");
    if (!user || !user.resetTokenExpiry) {
      return fail(res, 400, "Reset link is invalid or has expired");
    }
    if (Date.now() > new Date(user.resetTokenExpiry).getTime()) {
      return fail(res, 400, "Reset link has expired. Please request again.");
    }
    return res.json({ success: true });
  } catch (err) {
    console.error("[verifyResetToken]", err);
    return fail(res, 500, "Server error");
  }
};

exports.resetPassword = async (req, res) => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(res, 400, parsed.error.issues[0]?.message || "Invalid input");

  const { token, newPassword } = parsed.data;

  try {
    const user = await User.findOne({
      resetTokenHash: hashToken(token),
    }).select("+resetTokenHash +resetTokenExpiry +password");
    if (!user || !user.resetTokenExpiry) {
      return fail(res, 400, "Reset link is invalid or has expired");
    }
    if (Date.now() > new Date(user.resetTokenExpiry).getTime()) {
      return fail(res, 400, "Reset link has expired. Please request again.");
    }

    user.password = newPassword; // re-hashed by pre-save hook
    user.resetTokenHash = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return res.json({ success: true });
  } catch (err) {
    console.error("[resetPassword]", err);
    return fail(res, 500, "Server error");
  }
};
