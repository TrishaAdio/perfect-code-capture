const mongoose = require("mongoose");

/**
 * Append-only audit log for sensitive account actions
 * (account deletion, future: role changes, etc.).
 *
 * Never stores secrets (passwords, tokens, OTPs). The userId may reference
 * a User that no longer exists (after deletion) — that's intentional so the
 * trail survives even after the account is gone.
 */
const auditLogSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      enum: ["account.deleted", "account.delete_requested"],
      index: true,
    },
    userId: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 255 },
    ip: { type: String, default: "", maxlength: 64 },
    userAgent: { type: String, default: "", maxlength: 512 },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
