import reviewModel from "../models/reviewModel.js";
import foodModel from "../models/foodModel.js";
import userModel from "../models/userModel.js";

// POST /api/review — customer rates a dish (login required, one per dish)
const addReview = async (req, res) => {
    try {
        const { foodId, rating, comment } = req.body;
        const value = Number(rating);
        if (!Number.isInteger(value) || value < 1 || value > 5) {
            return res.json({ success: false, message: "Rating 1 se 5 ke beech do" });
        }
        const food = await foodModel.findById(foodId);
        if (!food) return res.json({ success: false, message: "Dish nahi mila" });
        const user = await userModel.findById(req.body.userId).select("name");

        await reviewModel.findOneAndUpdate(
            { foodId, userId: req.body.userId },
            {
                userName: user?.name || "Customer",
                rating: value,
                comment: String(comment || "").trim().slice(0, 500),
                createdAt: new Date()
            },
            { upsert: true, new: true }
        );
        res.json({ success: true, message: "Review save ho gaya. Dhanyavaad!" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Review save nahi hua" });
    }
};

// GET /api/review/summary — average + count for every dish (public, one call)
const listSummaries = async (req, res) => {
    try {
        const rows = await reviewModel.find({}).select("foodId rating").lean();
        const map = {};
        for (const r of rows) {
            const key = String(r.foodId);
            if (!map[key]) map[key] = { sum: 0, count: 0 };
            map[key].sum += r.rating;
            map[key].count += 1;
        }
        const out = {};
        for (const [key, v] of Object.entries(map)) {
            out[key] = { avg: Math.round((v.sum / v.count) * 10) / 10, count: v.count };
        }
        res.json({ success: true, data: out });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

// GET /api/review/:foodId — reviews of one dish (public)
const listReviews = async (req, res) => {
    try {
        const all = await reviewModel.find({ foodId: req.params.foodId })
            .sort({ createdAt: -1 }).limit(100).lean();
        const avg = all.length
            ? Math.round((all.reduce((s, r) => s + r.rating, 0) / all.length) * 10) / 10
            : 0;
        res.json({ success: true, data: all, avg, count: all.length });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

// DELETE /api/review/:id — admin moderation
const deleteReview = async (req, res) => {
    try {
        await reviewModel.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Review deleted" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

export { addReview, listSummaries, listReviews, deleteReview };
