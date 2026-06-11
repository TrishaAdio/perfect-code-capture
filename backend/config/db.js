const mongoose = require("mongoose");

async function dropStaleUserIndexes() {
  const users = mongoose.connection.db.collection("users");
  const indexes = await users.indexes();
  const staleIndexes = indexes.filter(
    (index) => index.name === "username_1" || Object.prototype.hasOwnProperty.call(index.key || {}, "username")
  );

  for (const index of staleIndexes) {
    await users.dropIndex(index.name);
    console.log(`✓ Dropped stale MongoDB index: ${index.name}`);
  }
}

async function connectDB(uri) {
  if (!uri) throw new Error("MongoDB URI is required");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  await dropStaleUserIndexes();
  console.log("✓ Connected to MongoDB");
}

module.exports = { connectDB };
