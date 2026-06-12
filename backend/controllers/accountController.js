const { z } = require("zod");
const User = require("../models/User");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const AuditLog = require("../models/AuditLog");
const log = require("../utils/logger");
const {
  sendDeletionRequestedEmail,
  sendDeletionConfirmedEmail,
} = require("../utils/sendAccountEmail");

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

const deleteSchema = z.object({
  currentPassword: z.string().max(128).optional(),
  confirmText: z.string().max(64).optional(),
});

const REQUIRED_CONFIRM_TEXT = "DELETE MY ACCOUNT";

exports.deleteAccount = async (req, res) => {
  const parsed = deleteSchema.safeParse(req.body || {});
  if (!parsed.success) return fail(res, 400, "Invalid input");

  const { currentPassword, confirmText } = parsed.data;

  try {
    const user = await User.findById(req.user.sub).select("+password");
    if (!user) return fail(res, 404, "User not found");

    const isOAuthOnly = !!user.googleId && !user.password;

    if (isOAuthOnly) {
      if ((confirmText || "").trim() !== REQUIRED_CONFIRM_TEXT) {
        return fail(
          res,
          400,
          `Type "${REQUIRED_CONFIRM_TEXT}" exactly to confirm deletion`
        );
      }
    } else {
      if (!currentPassword) {
        return fail(res, 400, "Current password is required");
      }
      const ok = await user.comparePassword(currentPassword);
      if (!ok) return fail(res, 401, "Current password is incorrect");
    }

    const userId = user._id;
    const userIdStr = userId.toString();
    const email = user.email;
    const name = user.name;
    const ip = req.ip || req.headers["x-forwarded-for"] || "";
    const userAgent = String(req.headers["user-agent"] || "").slice(0, 512);

    // Audit BEFORE deletion (in case anything later throws).
    await AuditLog.create({
      event: "account.delete_requested",
      userId: userIdStr,
      email,
      ip: String(ip).slice(0, 64),
      userAgent,
      meta: { provider: isOAuthOnly ? "google" : "password" },
    });

    // Best-effort "deletion in progress" email — never block on email.
    sendDeletionRequestedEmail({ to: email, name }).catch((e) =>
      log.warn("deletion_email_requested_failed", { reason: e.message })
    );

    // 1. Anonymize completed orders (legal/accounting retention).
    //    Delete all non-completed orders for this user.
    await Order.deleteMany({
      userId,
      status: { $in: ["PROCESSING", "FAILED"] },
    });
    await Order.updateMany(
      { userId, status: "COMPLETED" },
      {
        $set: {
          userId: null,
          // Keep orderId / amount / createdAt for accounting.
          productImage: "",
        },
      },
      { strict: false }
    );

    // 2. Delete cart, then user.
    await Cart.deleteOne({ userId });
    await User.deleteOne({ _id: userId });

    // 3. Final audit + confirmation email.
    await AuditLog.create({
      event: "account.deleted",
      userId: userIdStr,
      email,
      ip: String(ip).slice(0, 64),
      userAgent,
    });

    sendDeletionConfirmedEmail({ to: email, name }).catch((e) =>
      log.warn("deletion_email_confirmed_failed", { reason: e.message })
    );

    log.info("account_deleted", { userId: userIdStr, reqId: req.id });

    // Clear any cookies we may have set (admin uses cookies; user JWTs are
    // in localStorage on the client, which clears them itself).
    res.clearCookie("symdeals_admin", { path: "/" });

    return res.json({ success: true });
  } catch (err) {
    log.error("account_delete_error", { reason: err.message });
    return fail(res, 500, "Failed to delete account. Please try again.");
  }
};
