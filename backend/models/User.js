const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    password: {
      type: String,
      required: function () {
        // Password is optional for accounts created via OAuth (Google, etc.).
        return !this.googleId;
      },
      minlength: 8,
      select: false,
    },
    // OAuth fields — set when the account was created via Google sign-in.
    googleId: { type: String, index: true, sparse: true, unique: true },
    avatar: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    // Optional contact number — saved at checkout so repeat purchases prefill.
    whatsapp: {
      type: String,
      default: null,
      trim: true,
      maxlength: 20,
      validate: {
        validator: (v) => v == null || v === "" || /^\+?\d{10,15}$/.test(v),
        message: "Invalid WhatsApp number",
      },
    },
    otp: { type: String, select: false },
    otpExpiry: { type: Date, select: false },
    otpLastSentAt: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
    resetTokenHash: { type: String, select: false, index: true },
    resetTokenExpiry: { type: Date, select: false },

    // Brute-force defence (per-account exponential backoff).
    loginFailedAttempts: { type: Number, default: 0, select: false },
    loginLockedUntil: { type: Date, default: null, select: false },

    // Increment on logout-all / password change to invalidate older JWTs.
    tokenVersion: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (!this.password) return next(); // OAuth-only accounts have no password.
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  // Bump tokenVersion so older sessions are invalidated after a password change.
  if (!this.isNew) this.tokenVersion = (this.tokenVersion || 0) + 1;
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    whatsapp: this.whatsapp || null,
    isVerified: !!this.isVerified,
    hasPassword: !!this.password,
    provider: this.googleId ? "google" : "password",
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
