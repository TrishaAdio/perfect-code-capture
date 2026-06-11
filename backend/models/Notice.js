const mongoose = require("mongoose");

const NOTICE_TYPES = ["info", "success", "warning", "urgent"];

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: 1,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: { values: NOTICE_TYPES, message: "Invalid notice type" },
      default: "info",
    },
    active: { type: Boolean, default: true },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

noticeSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    title: this.title || "",
    message: this.message,
    type: this.type,
    active: this.active,
    startsAt: this.startsAt ? this.startsAt.toISOString() : null,
    expiresAt: this.expiresAt ? this.expiresAt.toISOString() : null,
    createdAt: this.createdAt ? this.createdAt.toISOString() : null,
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : null,
  };
};

module.exports = mongoose.model("Notice", noticeSchema);
module.exports.NOTICE_TYPES = NOTICE_TYPES;
