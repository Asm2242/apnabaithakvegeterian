import Razorpay from "razorpay";
import crypto from "crypto";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import foodModel from "../models/foodModel.js";

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
    const { userId, items, address, landmark, notes, mode, paymentMethod, otpVerified } = req.body;

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
    const amount = subtotal + deliveryCharge;

    if (paymentMethod === "cod") {
      const order = await new orderModel({
        userId,
        customerName: user.name,
        phone: user.phone || "",
        items: lines,
        amount,
        subtotal,
        deliveryCharge,
        address: addr,
        landmark: landmark || "",
        notes: notes || "",
        mode: mode || "delivery",
        status: "PLACED",
        paymentMethod: "cod",
        paymentStatus: "COD",
        otpVerified: true
      }).save();
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
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
      deliveryCharge,
      address: addr,
      landmark: landmark || "",
      notes: notes || "",
      mode: mode || "delivery",
      status: "PLACED",
      paymentMethod: "online",
      paymentStatus: "PENDING",
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
      await orderModel.findByIdAndUpdate(orderId, {
        payment: true,
        paymentStatus: "PAID",
        razorpayPaymentId: razorpay_payment_id
      });
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

// POST /api/order/status (admin) — status + optional rider assign
const updateStatus = async (req, res) => {
  try {
    if (!ORDER_FLOW.includes(req.body.status)) {
      return res.json({ success: false, message: "Invalid status" });
    }
    const patch = { status: req.body.status };
    if (req.body.riderId) patch.riderId = req.body.riderId;
    await orderModel.findByIdAndUpdate(req.body.orderId, patch);
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    res.json({ success: false, message: "Error" });
  }
};

export { listOrders, placeOrder, updateStatus, userOrders, verifyOrder, markFailed };
