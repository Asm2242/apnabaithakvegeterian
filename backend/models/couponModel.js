import mongoose from "mongoose";

// Discount coupons. firstOrderOnly = auto-applied WELCOME50 style offers.
const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: "" },
    type: { type: String, enum: ["flat", "percent"], default: "flat" },
    value: { type: Number, required: true },
    minOrder: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null },
    firstOrderOnly: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null }
}, { timestamps: true })

const couponModel = mongoose.models.coupon || mongoose.model("coupon", couponSchema);
export default couponModel;
