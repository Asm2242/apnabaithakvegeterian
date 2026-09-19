import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Razorpay from "razorpay";
import userModel from "../models/userModel.js";
import riderModel from "../models/riderModel.js";
import orderModel from "../models/orderModel.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET);

// Admin creates a rider account (name, email, password, phone, vehicle)
const createRider = async (req, res) => {
    try {
        const { name, email, password, phone, vehicle } = req.body;
        if (!name || !email || !password) {
            return res.json({ success: false, message: "Name, email, password required" });
        }
        const exists = await userModel.findOne({ email });
        if (exists) return res.json({ success: false, message: "User already exists" });
        const hashed = await bcrypt.hash(password, await bcrypt.genSalt(10));
        const user = await new userModel({
            name, email, password: hashed, role: "rider", phone: phone || undefined
        }).save();
        await new riderModel({ userId: user._id, vehicle: vehicle || "Bike" }).save();
        res.json({ success: true, message: "Rider created", riderId: user._id });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// Rider login (email + password, role must be rider)
const loginRider = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email, role: "rider", active: true });
        if (!user) return res.json({ success: false, message: "Rider not found" });
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.json({ success: false, message: "Invalid credentials" });
        res.json({ success: true, token: createToken(user._id), name: user.name });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// Orders assigned to this rider (OUT_FOR_DELIVERY + recent delivered)
const myOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ riderId: req.body.userId })
            .sort({ date: -1 }).limit(50);
        res.json({ success: true, data: orders });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// Rider updates delivery status + optional live location
// allowed: OUT_FOR_DELIVERY -> DELIVERED
const updateDeliveryStatus = async (req, res) => {
    try {
        const { orderId, status, lat, lng } = req.body;
        const order = await orderModel.findOne({ _id: orderId, riderId: req.body.userId });
        if (!order) return res.json({ success: false, message: "Order not assigned to you" });
        if (!["OUT_FOR_DELIVERY", "DELIVERED"].includes(status)) {
            return res.json({ success: false, message: "Invalid status" });
        }
        order.status = status;
        await order.save();
        // pickup = journey starts AT shop; live GPS overwrites after
        const locPatch =
          status === "OUT_FOR_DELIVERY"
            ? { lat: 26.9381402, lng: 80.9129123, locationUpdatedAt: new Date() }
            : (lat != null && lng != null ? { lat, lng, locationUpdatedAt: new Date() } : {});
        await riderModel.findOneAndUpdate(
            { userId: req.body.userId },
            {
                ...locPatch,
                ...(status === "DELIVERED" ? { $inc: { totalDeliveries: 1 } } : {})
            }
        );
        res.json({ success: true, message: "Status updated" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// Rider: Razorpay payment link for doorstep QR (create once, reuse)
const payLink = async (req, res) => {
    try {
        const order = await orderModel.findOne({ _id: req.body.orderId, riderId: req.body.userId });
        if (!order) return res.json({ success: false, message: "Order not assigned to you" });
        if (order.paymentStatus === "PAID") {
            return res.json({ success: true, paid: true, message: "Already paid" });
        }
        if (order.razorpayLinkUrl) {
            return res.json({ success: true, short_url: order.razorpayLinkUrl });
        }
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET) {
            return res.json({ success: false, message: "Online payment not configured" });
        }
        const link = await razorpay.paymentLink.create({
            amount: Math.round(order.amount * 100),
            currency: "INR",
            description: `Apna Baithak order Rs.${order.amount}`,
            customer: {
                name: (order.customerName || "Customer").slice(0, 50),
                contact: order.phone || undefined
            },
            notify: { sms: false, email: false },
            notes: { orderId: String(order._id) }
        });
        order.razorpayLinkId = link.id;
        order.razorpayLinkUrl = link.short_url;
        await order.save();
        res.json({ success: true, short_url: link.short_url });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Link create fail" });
    }
};

// Rider: check if Razorpay link got paid -> mark PAID
const payCheck = async (req, res) => {
    try {
        const order = await orderModel.findOne({ _id: req.body.orderId, riderId: req.body.userId });
        if (!order) return res.json({ success: false, message: "Order not assigned to you" });
        if (order.paymentStatus === "PAID") return res.json({ success: true, paid: true });
        if (!order.razorpayLinkId) return res.json({ success: true, paid: false });
        const link = await razorpay.paymentLink.fetch(order.razorpayLinkId);
        if (link.status === "paid") {
            order.paymentStatus = "PAID";
            order.payment = true;
            await order.save();
            return res.json({ success: true, paid: true, message: "Payment received ✓" });
        }
        res.json({ success: true, paid: false, message: "Not paid yet" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Check fail" });
    }
};
const collectCash = async (req, res) => {
    try {
        const order = await orderModel.findOne({ _id: req.body.orderId, riderId: req.body.userId });
        if (!order) return res.json({ success: false, message: "Order not assigned to you" });
        if (order.paymentMethod !== "cod") {
            return res.json({ success: false, message: "Only for COD orders" });
        }
        order.cashCollected = true;
        await order.save();
        res.json({ success: true, message: "Cash collected ✓" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};
const updateLocation = async (req, res) => {
    try {
        const { lat, lng, accuracy, onDuty } = req.body;
        await riderModel.findOneAndUpdate(
            { userId: req.body.userId },
            {
                ...(lat != null && lng != null ? {
                    lat, lng,
                    accuracy: accuracy != null ? Math.round(Number(accuracy)) : null,
                    locationUpdatedAt: new Date()
                } : {}),
                ...(onDuty != null ? { onDuty } : {})
            }
        );
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// Admin: list all riders with profiles
const listRiders = async (req, res) => {
    try {
        const riders = await userModel.find({ role: "rider" }).select("name email phone active");
        const profiles = await riderModel.find({});
        const byUser = Object.fromEntries(profiles.map(p => [String(p.userId), p]));
        res.json({
            success: true,
            data: riders.map(r => ({ ...r.toObject(), profile: byUser[String(r._id)] || null }))
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

export { createRider, loginRider, myOrders, updateDeliveryStatus, updateLocation, listRiders, collectCash, payLink, payCheck };
