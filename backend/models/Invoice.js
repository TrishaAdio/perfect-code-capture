const mongoose = require("mongoose");

/**
 * Invoice — server-side record of every payment QR we generate.
 *
 * Bound to a single user, single product/plan, and a single expected amount.
 * /api/orders refuses to create an order unless an Invoice exists with:
 *   - matching userId
 *   - status === "PAID" (re-checked against upstream at order time)
 *   - used === false (then atomically flipped to true to prevent reuse)
 */
const invoiceSchema = new mongoose.Schema(
  {
    invoiceId: { type: String, required: true, unique: true, index: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    months: { type: Number, required: true, min: 1, max: 120 },
    quantity: { type: Number, required: true, min: 1, max: 100, default: 1 },
    // The exact amount the user was asked to pay (per upstream `unique_amount`).
    expectedAmount: { type: Number, required: true, min: 0 },
    // Authoritative price computed from Product.plans at create time.
    productPrice: { type: Number, required: true, min: 0 },
    realPrice: { type: Number, default: 0, min: 0 },
    productNameSnapshot: { type: String, required: true, maxlength: 300 },
    productImageSnapshot: { type: String, default: "", maxlength: 2000 },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "EXPIRED", "FAILED"],
      default: "PENDING",
      index: true,
    },
    used: { type: Boolean, default: false, index: true },
    paidAt: { type: Date, default: null },
    upstreamUtr: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
