import Razorpay from "razorpay";
import crypto from "crypto";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

const currency = "INR";
const deliveryCharge = 0;
const frontend_URL = "http://localhost:5173";

// Place Order & Create Razorpay Order
const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    // Save order to DB
    const newOrder = new orderModel({
      userId,
      items,
      amount,
      address,
    });
    await newOrder.save();

    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    const razorpayOrder = await razorpay.orders.create({
      amount: (amount + deliveryCharge) * 100, // Amount in paise
      currency,
      receipt: newOrder._id.toString(),
    });

    res.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      orderId: newOrder._id,
      amount: (amount + deliveryCharge) * 100,
      currency,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Order creation failed" });
  }
};

// Verify Payment (called after payment is done on frontend)
const verifyOrder = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  } = req.body;

  try {
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature === razorpay_signature) {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: "Payment verified" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Payment verification failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Verification error" });
  }
};

const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.body.userId });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const updateStatus = async (req, res) => {
  try {
    await orderModel.findByIdAndUpdate(req.body.orderId, {
      status: req.body.status,
    });
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    res.json({ success: false, message: "Error" });
  }
};

export { listOrders, placeOrder, updateStatus, userOrders, verifyOrder };
