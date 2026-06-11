/**
 * Seed (or update) the initial admin account.
 *
 * Usage:
 *   cd backend
 *   ADMIN_EMAIL=admin@symdeals.com ADMIN_PASSWORD=YourStrongPass node scripts/seedAdmin.js
 *
 * Reads MONGODB_URI from .env. Safe to re-run — it upserts the admin and
 * resets the password to ADMIN_PASSWORD each time.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const Admin = require("../models/Admin");

async function main() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";

  if (!email || !password) {
    console.error(
      "ADMIN_EMAIL and ADMIN_PASSWORD env vars are required.\n" +
        "Example: ADMIN_EMAIL=admin@symdeals.com ADMIN_PASSWORD=YourStrongPass node scripts/seedAdmin.js"
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set in .env.");
    process.exit(1);
  }

  await connectDB(process.env.MONGODB_URI);

  let admin = await Admin.findOne({ email }).select("+password");
  if (admin) {
    admin.password = password; // pre-save hook re-hashes
    await admin.save();
    console.log(`✓ Admin "${email}" password updated.`);
  } else {
    admin = await Admin.create({ email, password });
    console.log(`✓ Admin "${email}" created.`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
