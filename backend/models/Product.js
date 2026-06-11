const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    months: {
      type: Number,
      required: [true, "Months is required"],
      min: 1,
      max: 120,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
      max: 10_000_000,
    },
    realPrice: {
      type: Number,
      default: 0,
      min: 0,
      max: 10_000_000,
    },
  },
  { _id: false }
);

const PRODUCT_CATEGORIES = [
  "Subscriptions",
  "Combo Pack",
  "Software",
  "Music",
  "Adult",
];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    service_id: {
      type: Number,
      required: [true, "Service ID is required"],
      unique: true,
      min: [1000, "Service ID must be a 4-digit number"],
      max: [9999, "Service ID must be a 4-digit number"],
      validate: {
        validator: (v) => Number.isInteger(v) && v >= 1000 && v <= 9999,
        message: "Service ID must be a 4-digit integer",
      },
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: PRODUCT_CATEGORIES,
        message: "Invalid category",
      },
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: 2000,
    },
    image: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
      maxlength: 2000,
    },
    plans: {
      type: [planSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length >= 1 && v.length <= 12,
        message: "At least one plan is required",
      },
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

productSchema.methods.toSafeJSON = function () {
  const plans = (this.plans || []).map((p) => ({
    months: p.months,
    price: p.price,
    realPrice: p.realPrice || 0,
  }));
  return {
    id: this._id.toString(),
    service_id: this.service_id,
    name: this.name,
    category: this.category,
    description: this.description,
    image: this.image,
    plans,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("Product", productSchema);
module.exports.PRODUCT_CATEGORIES = PRODUCT_CATEGORIES;
