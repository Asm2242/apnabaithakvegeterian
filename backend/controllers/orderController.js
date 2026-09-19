import Razorpay from "razorpay";
import crypto from "crypto";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import foodModel from "../models/foodModel.js";
import riderModel from "../models/riderModel.js";
import { couponDiscount } from "./couponController.js";
import { notifyOwnerNewOrder, notifyCustomer } from "../utils/notify.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

const currency = "INR";
const FREE_DELIVERY_AT = 399;
const DELIVERY_FEE = 39;

const isIndianMobile = (phone) => /^[6-9]\d{9}$/.test(phone || "");

// Server is authoritative: Half/Full from halfPrice/fullPrice.
// Pizza Small/Regular stored in the same fields. Never trust frontend prices.
const priceFor = (food, size) => {
  if (size === "Half" || size === "Small") {
    return food.halfPrice ?? Math.round(food.price / 2);
  }
  if (size === "Full" || (size === "Regular" && food.isPizza)) {
    return food.fullPrice ?? food.price;
  }
  return food.price;
};

// POST /api/order/place (auth) — supports online (Razorpay) + COD
const placeOrder = async (req, res) => {
  try {
    const { userId, items, address, landmark, notes, mode, paymentMethod, otpVerified, couponCode, lat, lng } = req.body;

    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return res.json({ success: false, message: "Cart is empty" });
    }
    if (paymentMethod !== "cod" && paymentMethod !== "online") {
      return res.json({ success: false, message: "Choose Online or COD" });
    }
    if (!otpVerified) {
      return res.json({ success: false, message: "Verify OTP before ordering" });
    }
    const user = await userModel.findById(userId);
    if (!user || !user.active) {
      return res.json({ success: false, message: "Account disabled" });
    }
    const addr = typeof address === "string" ? { street: address } : (address || {});
    if (mode !== "takeaway" && String(addr.street || "").trim().length < 10) {
      return res.json({ success: false, message: "Give full delivery address" });
    }

    // price every line from DB
    let subtotal = 0;
    const lines = [];
    for (const line of items) {
      const food = await foodModel.findById(line.foodId || line._id);
      if (!food || !food.available) {
        return res.json({ success: false, message: `${line.name || "A dish"} is unavailable` });
      }
      const qty = Math.max(1, Math.min(50, Math.round(line.qty || 1)));
      const price = priceFor(food, line.size || "Regular");
      subtotal += price * qty;
      lines.push({ foodId: String(food._id), name: food.name, size: line.size || "Regular", qty, price });
    }
    const deliveryCharge = mode === "takeaway" || subtotal >= FREE_DELIVERY_AT ? 0 : DELIVERY_FEE;
    // customer dropped pin (validated ranges) — rider navigates here
    const pinLat = Number(lat);
    const pinLng = Number(lng);
    const hasPin =
      Number.isFinite(pinLat) && Number.isFinite(pinLng) &&
      pinLat >= -90 && pinLat <= 90 && pinLng >= -180 && pinLng <= 180;
    // coupon / first-order offer (server-side, never trust frontend)
    const { discount, error: couponError } = await couponDiscount(couponCode, subtotal, userId);
    if (couponCode && couponError) {
      return res.json({ success: false, message: couponError });
    }
    const amount = Math.max(0, subtotal - discount) + deliveryCharge;

    if (paymentMethod === "cod") {
      const order = await new orderModel({
        userId,
        customerName: user.name,
        phone: user.phone || "",
        items: lines,
        amount,
        subtotal,
        discount,
        couponCode: couponCode ? String(couponCode).toUpperCase().trim() : "",
        deliveryCharge,
        address: addr,
        landmark: landmark || "",
        notes: notes || "",
        mode: mode || "delivery",
        status: "PLACED",
        paymentMethod: "cod",
        paymentStatus: "COD",
        ...(hasPin ? { lat: pinLat, lng: pinLng } : {}),
        otpVerified: true
      }).save();
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
      notifyOwnerNewOrder(order);
      notifyCustomer(user.phone, `Apna Baithak: order placed Rs.${amount}. Pay cash on delivery. Track: my orders page.`);
      return res.json({ success: true, cod: true, orderId: order._id, amount, message: "Pay cash on delivery" });
    }

    // online: save pending order + Razorpay order
    const order = await new orderModel({
      userId,
      customerName: user.name,
      phone: user.phone || "",
      items: lines,
      amount,
      subtotal,
      discount,
      couponCode: couponCode ? String(couponCode).toUpperCase().trim() : "",
      deliveryCharge,
      address: addr,
      landmark: landmark || "",
      notes: notes || "",
      mode: mode || "delivery",
      status: "PLACED",
      paymentMethod: "online",
      paymentStatus: "PENDING",
      ...(hasPin ? { lat: pinLat, lng: pinLng } : {}),
      otpVerified: true
    }).save();
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency,
      receipt: order._id.toString(),
    });
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      orderId: order._id,
      amount: amount * 100,
      currency,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Order creation failed" });
  }
};

// POST /api/order/verify — HMAC check, mark PAID (never trust frontend)
const verifyOrder = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
  try {
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature === razorpay_signature) {
      const order = await orderModel.findByIdAndUpdate(orderId, {
        payment: true,
        paymentStatus: "PAID",
        razorpayPaymentId: razorpay_payment_id
      }, { new: true });
      if (order) {
        notifyOwnerNewOrder(order);
        const u = await userModel.findById(order.userId).select("phone");
        notifyCustomer(u?.phone, `Apna Baithak: payment Rs.${order.amount} received. Cooking started!`);
      }
      res.json({ success: true, message: "Payment verified" });
    } else {
      await orderModel.findByIdAndUpdate(orderId, { paymentStatus: "FAILED" });
      res.json({ success: false, message: "Payment verification failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Verification error" });
  }
};

// POST /api/order/failed — mark FAILED after cancelled Razorpay attempt (keeps order for retry)
const markFailed = async (req, res) => {
  try {
    await orderModel.findOneAndUpdate(
      { _id: req.body.orderId, userId: req.body.userId, paymentStatus: "PENDING" },
      { paymentStatus: "FAILED" }
    );
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({}).sort({ date: -1 }).limit(200);
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.body.userId }).sort({ date: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const ORDER_FLOW = ["PLACED", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

// Apna Baithak shop coords — rider journey starts here on pickup
const SHOP_LAT = 26.9381402;
const SHOP_LNG = 80.9129123;

// POST /api/order/status (admin) — status + optional rider assign
const updateStatus = async (req, res) => {
  try {
    if (!ORDER_FLOW.includes(req.body.status)) {
      return res.json({ success: false, message: "Invalid status" });
    }
    const patch = { status: req.body.status };
    if (req.body.riderId) patch.riderId = req.body.riderId;
    const order = await orderModel.findByIdAndUpdate(req.body.orderId, patch, { new: true });
    // rider journey starts AT the shop on pickup
    if (order && req.body.status === "OUT_FOR_DELIVERY" && order.riderId) {
      await riderModel.findOneAndUpdate(
        { userId: order.riderId, $or: [{ lat: null }, { lng: null }] },
        { lat: SHOP_LAT, lng: SHOP_LNG, locationUpdatedAt: new Date() }
      );
    }
    if (order) {
      const u = await userModel.findById(order.userId).select("phone");
      const stepMsg = {
        CONFIRMED: "confirmed! Cooking will start soon.",
        PREPARING: "is being cooked fresh.",
        READY: "is ready! Rider arriving soon.",
        OUT_FOR_DELIVERY: "is on the way! Rider coming to you.",
        DELIVERED: "delivered. Enjoy! Rate us ⭐",
        CANCELLED: "was cancelled. Call +91 94549 99442 for help."
      }[order.status];
      if (stepMsg) notifyCustomer(u?.phone, `Apna Baithak: your order ${stepMsg}`);
    }
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    res.json({ success: false, message: "Error" });
  }
};

// GET /api/order/track/:id (auth, own order) — order + rider live GPS
const trackOrder = async (req, res) => {
  try {
    const order = await orderModel.findOne({ _id: req.params.id, userId: req.body.userId });
    if (!order) return res.json({ success: false, message: "Order not found" });
    let rider = null;
    if (order.riderId) {
      const [ru, rp] = await Promise.all([
        userModel.findById(order.riderId).select("name phone"),
        riderModel.findOne({ userId: order.riderId })
      ]);
      if (ru) {
        rider = {
          name: ru.name, phone: ru.phone,
          lat: rp?.lat ?? null, lng: rp?.lng ?? null,
          accuracy: rp?.accuracy ?? null,
          updatedAt: rp?.locationUpdatedAt || null
        };
      }
    }
    res.json({ success: true, data: { order, rider } });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export { listOrders, placeOrder, updateStatus, userOrders, verifyOrder, markFailed, trackOrder };
