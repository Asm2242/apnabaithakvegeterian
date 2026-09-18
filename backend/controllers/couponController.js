import couponModel from "../models/couponModel.js";
import orderModel from "../models/orderModel.js";

// shared: compute discount for a coupon on a subtotal for a user
const couponDiscount = async (code, subtotal, userId) => {
    if (!code) return { discount: 0, coupon: null };
    const coupon = await couponModel.findOne({ code: String(code).toUpperCase().trim(), active: true });
    if (!coupon) return { discount: 0, coupon: null, error: "Invalid coupon" };
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
        return { discount: 0, coupon: null, error: "Coupon expired" };
    }
    if (subtotal < coupon.minOrder) {
        return { discount: 0, coupon: null, error: `Needs minimum order Rs.${coupon.minOrder}` };
    }
    if (coupon.firstOrderOnly && userId) {
        const prev = await orderModel.countDocuments({ userId: String(userId) });
        if (prev > 0) {
            return { discount: 0, coupon: null, error: "First order only" };
        }
    }
    let discount = coupon.type === "percent"
        ? Math.round((subtotal * coupon.value) / 100)
        : coupon.value;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    discount = Math.min(discount, subtotal);
    return { discount, coupon };
}

// GET /api/coupon/list — active coupons for customers
const listCoupons = async (req, res) => {
    try {
        const coupons = await couponModel.find({ active: true }).select("-__v");
        res.json({ success: true, data: coupons });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// POST /api/coupon/validate { code, subtotal } — preview (auth)
const validateCoupon = async (req, res) => {
    try {
        const subtotal = Number(req.body.subtotal) || 0;
        const { discount, error } = await couponDiscount(req.body.code, subtotal, req.body.userId);
        if (error) return res.json({ success: false, message: error });
        res.json({ success: true, discount });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// ---- admin ----
// GET /api/coupon/admin/all
const adminList = async (req, res) => {
    try {
        res.json({ success: true, data: await couponModel.find({}).sort({ createdAt: -1 }) });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// POST /api/coupon/admin/save — create or update by id
const adminSave = async (req, res) => {
    try {
        const { id, code, description, type, value, minOrder, maxDiscount, firstOrderOnly, active, expiresAt } = req.body;
        const doc = {
            ...(code ? { code: String(code).toUpperCase().trim() } : {}),
            ...(description !== undefined ? { description } : {}),
            ...(type ? { type } : {}),
            ...(value !== undefined ? { value: Number(value) } : {}),
            ...(minOrder !== undefined ? { minOrder: Number(minOrder) } : {}),
            maxDiscount: maxDiscount ? Number(maxDiscount) : null,
            ...(firstOrderOnly !== undefined ? { firstOrderOnly: !!firstOrderOnly } : {}),
            ...(active !== undefined ? { active: !!active } : {}),
            ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
        };
        if (id) {
            await couponModel.findByIdAndUpdate(id, doc);
        } else {
            if (!doc.code || doc.value == null) {
                return res.json({ success: false, message: "Code + value required" });
            }
            await new couponModel(doc).save();
        }
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.code === 11000 ? "Code exists" : "Error" });
    }
}

// POST /api/coupon/admin/toggle { id, active }
const adminToggle = async (req, res) => {
    try {
        await couponModel.findByIdAndUpdate(req.body.id, { active: !!req.body.active });
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

export { listCoupons, validateCoupon, adminList, adminSave, adminToggle, couponDiscount };
