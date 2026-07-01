// One-shot. `node scripts/seed-operator.mjs <email> <password> [name]`.
// Inserts a single operator row using bcrypt. Idempotent: errors if email exists.
// Reads MONGODB_URI from server/.env via dotenv.
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const [email, password, name = "Operator"] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: node scripts/seed-operator.mjs <email> <password> [name]");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set. Make sure server/.env is present.");
  process.exit(1);
}

await mongoose.connect(uri);
const operators = mongoose.connection.collection("operators");

const lower = email.toLowerCase();
const existing = await operators.findOne({ email: lower });
if (existing) {
  console.error(`Operator already exists: ${lower} (id ${existing._id})`);
  await mongoose.disconnect();
  process.exit(1);
}

const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);
const passwordHash = await bcrypt.hash(password, rounds);
const now = new Date();
const { insertedId } = await operators.insertOne({
  name,
  email: lower,
  passwordHash,
  role: "operator",
  createdAt: now,
  updatedAt: now,
});
console.log(`Created operator ${lower} (id ${insertedId})`);

await mongoose.disconnect();
