import mongoose from "mongoose";

// One review per customer per dish (upsert on submit).
const reviewSchema = new mongoose.Schema({
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: "food", required: true, index: true },
    userId: { type: String, required: true },
    userName: { type: String, default: "Customer" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
});

reviewSchema.index({ foodId: 1, userId: 1 }, { unique: true });

const reviewModel = mongoose.models.review || mongoose.model("review", reviewSchema);
export default reviewModel;
