const { z } = require("zod");
const User = require("../models/User");

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

const nameSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
});

const emailSchema = z.object({
  newEmail: z.string().trim().toLowerCase().email("Invalid email").max(255),
  currentPassword: z.string().min(1, "Current password is required").max(128),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required").max(128),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(128),
});


exports.updateName = async (req, res) => {
  const parsed = nameSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(res, 400, parsed.error.issues[0]?.message || "Invalid input");

  try {
    const user = await User.findById(req.user.sub);
    if (!user) return fail(res, 404, "User not found");
    user.name = parsed.data.name;
    await user.save();
    return res.json({ success: true, user: user.toSafeJSON() });
  } catch (err) {
    console.error("[updateName]", err);
    return fail(res, 500, "Server error");
  }
};

exports.updateEmail = async (req, res) => {
  const parsed = emailSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(res, 400, parsed.error.issues[0]?.message || "Invalid input");

  const { newEmail, currentPassword } = parsed.data;

  try {
    const user = await User.findById(req.user.sub).select("+password");
    if (!user) return fail(res, 404, "User not found");

    const ok = await user.comparePassword(currentPassword);
    if (!ok) return fail(res, 401, "Current password is incorrect");

    if (user.email === newEmail) {
      return fail(res, 400, "New email is the same as current email");
    }

    const existing = await User.findOne({ email: newEmail }).collation({
      locale: "en",
      strength: 2,
    });
    if (existing) return fail(res, 409, "Email is already registered");

    user.email = newEmail;
    await user.save();
    return res.json({ success: true, user: user.toSafeJSON() });
  } catch (err) {
    if (err && err.code === 11000) {
      return fail(res, 409, "Email is already registered");
    }
    console.error("[updateEmail]", err);
    return fail(res, 500, "Server error");
  }
};

exports.updatePassword = async (req, res) => {
  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(res, 400, parsed.error.issues[0]?.message || "Invalid input");

  const { currentPassword, newPassword } = parsed.data;
  if (currentPassword === newPassword) {
    return fail(res, 400, "New password must be different");
  }

  try {
    const user = await User.findById(req.user.sub).select("+password");
    if (!user) return fail(res, 404, "User not found");

    const ok = await user.comparePassword(currentPassword);
    if (!ok) return fail(res, 401, "Current password is incorrect");

    user.password = newPassword; // pre-save hook re-hashes
    await user.save();
    return res.json({ success: true });
  } catch (err) {
    console.error("[updatePassword]", err);
    return fail(res, 500, "Server error");
  }
};
