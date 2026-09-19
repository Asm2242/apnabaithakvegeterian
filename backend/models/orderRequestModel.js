import mongoose from "mongoose";

// Customer requests on an order: cancel / remove item / change item.
// Admin resolves from Requests tab.
const orderRequestSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "order", required: true, index: true },
    userId: { type: String, required: true },
    type: { type: String, enum: ["cancel", "remove_item", "change_item", "other"], required: true },
    details: { type: String, default: "" },
    status: { type: String, enum: ["pending", "resolved", "rejected"], default: "pending" },
    adminNote: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
})

const orderRequestModel = mongoose.models.orderRequest || mongoose.model("orderRequest", orderRequestSchema);
export default orderRequestModel;
