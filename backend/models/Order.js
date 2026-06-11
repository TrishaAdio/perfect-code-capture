const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderId: { type: String, required: true, unique: true, index: true },
    productName: { type: String, required: true, trim: true, maxlength: 300 },
    productImage: { type: String, default: "", maxlength: 2000 },
    amount: { type: Number, required: true, min: 0 },
    realPrice: { type: Number, default: 0, min: 0 },
    savings: { type: Number, default: 0, min: 0, index: true },
    status: {
      type: String,
      enum: ["PROCESSING", "COMPLETED", "FAILED"],
      default: "PROCESSING",
      index: true,
    },
    invoiceId: { type: String, default: "" },
    promoCode: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

orderSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    orderId: this.orderId,
    productName: this.productName,
    productImage: this.productImage,
    amount: this.amount,
    realPrice: this.realPrice || 0,
    savings: this.savings || 0,
    status: this.status,
    invoiceId: this.invoiceId,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model("Order", orderSchema);
