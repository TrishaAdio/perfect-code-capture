const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
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
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    // Bumped on logout / forced revoke to invalidate all outstanding JWTs.
    tokenVersion: { type: Number, default: 0, select: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

adminSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

adminSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    email: this.email,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("Admin", adminSchema);
