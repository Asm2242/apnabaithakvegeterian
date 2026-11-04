import mongoose from "mongoose";

// Customer feedback from the website footer form.
const feedbackSchema = new mongoose.Schema({
    name: { type: String, default: "Guest" },
    phone: { type: String, default: "" },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    message: { type: String, required: true, maxlength: 600 },
    seen: { type: Boolean, default: false }
}, { timestamps: true })

const feedbackModel = mongoose.models.feedback || mongoose.model("feedback", feedbackSchema);
export default feedbackModel;