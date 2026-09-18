import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";

// GET /api/admin/customers — all customer accounts (admin only)
const listCustomers = async (req, res) => {
    try {
        const customers = await userModel.find({ role: "customer" })
            .select("name email phone phoneVerified active createdAt")
            .sort({ _id: -1 }).limit(500);
        res.json({ success: true, data: customers });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// POST /api/admin/customer/active  { id, active } — enable/disable account
const setCustomerActive = async (req, res) => {
    try {
        await userModel.findByIdAndUpdate(req.body.id, { active: !!req.body.active });
        res.json({ success: true, message: "Updated" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// GET /api/admin/stats — dashboard counters
const stats = async (req, res) => {
    try {
        const [customers, riders, pendingOrders, todayOrders, foods] = await Promise.all([
            userModel.countDocuments({ role: "customer" }),
            userModel.countDocuments({ role: "rider" }),
            orderModel.countDocuments({ status: { $nin: ["DELIVERED", "CANCELLED"] } }),
            orderModel.countDocuments({ date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
        ]);
        const foodsCount = await (await import("../models/foodModel.js")).default.countDocuments({});
        res.json({ success: true, data: { customers, riders, pendingOrders, todayOrders, foods: foodsCount } });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

export { listCustomers, setCustomerActive, stats };
