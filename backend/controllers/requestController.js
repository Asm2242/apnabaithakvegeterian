import orderModel from "../models/orderModel.js";
import orderRequestModel from "../models/orderRequestModel.js";
import { notifyCustomer } from "../utils/notify.js";

// POST /api/order/request (auth, own order) — cancel / remove / change requests
const createRequest = async (req, res) => {
    try {
        const { orderId, type, details } = req.body;
        if (!["cancel", "remove_item", "change_item", "other"].includes(type)) {
            return res.json({ success: false, message: "Invalid request type" });
        }
        const order = await orderModel.findOne({ _id: orderId, userId: req.body.userId });
        if (!order) return res.json({ success: false, message: "Order not found" });
        if (["DELIVERED", "CANCELLED"].includes(order.status)) {
            return res.json({ success: false, message: "Order already closed" });
        }
        await new orderRequestModel({
            orderId,
            userId: req.body.userId,
            type,
            details: String(details || "").slice(0, 500)
        }).save();
        res.json({ success: true, message: "Request sent! Restaurant will respond soon." });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// GET /api/order/requests/:orderId (auth, own order) — my requests on this order
const myRequests = async (req, res) => {
    try {
        const list = await orderRequestModel.find({
            orderId: req.params.orderId, userId: req.body.userId
        }).sort({ createdAt: -1 });
        res.json({ success: true, data: list });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// GET /api/order/requests (admin) — all pending first
const listRequests = async (req, res) => {
    try {
        const list = await orderRequestModel.aggregate([
            { $sort: { createdAt: -1 } },
            { $limit: 200 },
            {
                $lookup: {
                    from: "orders", localField: "orderId",
                    foreignField: "_id", as: "order"
                }
            }
        ]);
        res.json({ success: true, data: list });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// POST /api/order/request/resolve (admin) { id, action: resolved|rejected, adminNote }
// resolving a cancel request also cancels the order
const resolveRequest = async (req, res) => {
    try {
        const { id, action, adminNote } = req.body;
        if (!["resolved", "rejected"].includes(action)) {
            return res.json({ success: false, message: "Invalid action" });
        }
        const r = await orderRequestModel.findById(id);
        if (!r) return res.json({ success: false, message: "Not found" });
        r.status = action;
        r.adminNote = String(adminNote || "").slice(0, 300);
        await r.save();
        if (r.type === "cancel" && action === "resolved") {
            const order = await orderModel.findByIdAndUpdate(
                r.orderId, { status: "CANCELLED" }, { new: true }
            );
            if (order) {
                const user = await (await import("../models/userModel.js")).default
                    .findById(order.userId).select("phone");
                notifyCustomer(user?.phone, `Apna Baithak: your order is cancelled as requested. Refund (if paid) in 3-5 days.`);
            }
        }
        res.json({ success: true, message: "Done" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

export { createRequest, myRequests, listRequests, resolveRequest };
