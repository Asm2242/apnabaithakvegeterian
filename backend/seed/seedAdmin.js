// Create admin account:  node seed/seedAdmin.js <name> <email> <password>
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import userModel from "../models/userModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const run = async () => {
  const [name, email, password] = process.argv.slice(2);
  if (!name || !email || !password) throw new Error("Usage: node seed/seedAdmin.js <name> <email> <password>");
  await mongoose.connect(process.env.MONGO_URI);
  const exists = await userModel.findOne({ email });
  const hashed = await bcrypt.hash(password, await bcrypt.genSalt(10));
  if (exists) {
    exists.role = "admin";
    exists.name = name;
    exists.password = hashed;
    await exists.save();
    console.log("Admin updated:", email);
  } else {
    await new userModel({ name, email, password: hashed, role: "admin" }).save();
    console.log("Admin created:", email);
  }
  await mongoose.disconnect();
};

run().catch((e) => { console.error(e.message); process.exit(1); });
