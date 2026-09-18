import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    customerName: { type: String, default: "" },
    phone: { type: String, default: "" },
    items: { type: Array, required: true },
    amount: { type: Number, required: true },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: "" },
    deliveryCharge: { type: Number, default: 0 },
    address: { type: Object, required: true },
    landmark: { type: String, default: "" },
    notes: { type: String, default: "" },
    mode: { type: String, enum: ["delivery", "takeaway"], default: "delivery" },
    // PLACED -> CONFIRMED -> PREPARING -> READY -> OUT_FOR_DELIVERY -> DELIVERED
    // CANCELLED anytime
    status: { type: String, default: "PLACED" },
    date: { type: Date, default: Date.now() },
    // online (Razorpay) or COD
    paymentMethod: { type: String, enum: ["online", "cod"], default: "online" },
    // PENDING / PAID / COD / FAILED / REFUNDED
    paymentStatus: { type: String, default: "PENDING" },
    payment: { type: Boolean, default: false },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    // assigned delivery partner (users._id with role=rider)
    riderId: { type: String, default: "" },
    otpVerified: { type: Boolean, default: false }
})

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);
export default orderModel;
