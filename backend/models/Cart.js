const mongoose = require("mongoose");

// Persistent per-user cart. One document per userId. Items list is the
// source of truth. Frontend pushes the full sanitized list via PUT /api/cart
// (debounced) so syncing is atomic and conflict-free.
const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, trim: true, maxlength: 64 },
    months: { type: Number, required: true, min: 1, max: 120 },
    quantity: { type: Number, required: true, min: 1, max: 99 },
    name: { type: String, default: "", trim: true, maxlength: 200 },
    image: { type: String, default: "", trim: true, maxlength: 1024 },
    category: { type: String, default: "", trim: true, maxlength: 80 },
    price: { type: Number, required: true, min: 0, max: 10_000_000 },
    realPrice: { type: Number, default: 0, min: 0, max: 10_000_000 },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
