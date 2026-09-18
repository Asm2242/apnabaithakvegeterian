import mongoose from "mongoose";

// 6-digit OTP for Indian mobiles. Hash stored, 5-min expiry,
// max 5 attempts. Rate limiting enforced in controller.
const otpSchema = new mongoose.Schema({
    phone: { type: String, required: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
})

// auto-delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const otpModel = mongoose.models.otp || mongoose.model("otp", otpSchema);
export default otpModel;
