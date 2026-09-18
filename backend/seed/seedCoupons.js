// Seed default coupons:  node seed/seedCoupons.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import couponModel from "../models/couponModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await couponModel.findOneAndUpdate(
    { code: "WELCOME50" },
    {
      code: "WELCOME50",
      description: "Rs.50 OFF on first order above Rs.149",
      type: "flat", value: 50, minOrder: 149,
      maxDiscount: null, firstOrderOnly: true, active: true
    },
    { upsert: true }
  );
  await couponModel.findOneAndUpdate(
    { code: "BAITHAK10" },
    {
      code: "BAITHAK10",
      description: "10% OFF up to Rs.100 on orders above Rs.299",
      type: "percent", value: 10, minOrder: 299,
      maxDiscount: 100, firstOrderOnly: false, active: true
    },
    { upsert: true }
  );
  console.log("Coupons seeded: WELCOME50, BAITHAK10");
  await mongoose.disconnect();
};

run().catch((e) => { console.error(e.message); process.exit(1); });
