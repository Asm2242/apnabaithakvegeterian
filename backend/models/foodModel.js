import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    // single price (base). For dual-price items this is the HALF price.
    price: { type: Number, required: true },
    // HALF / FULL (null = single-price item, no buttons shown)
    halfPrice: { type: Number, default: null },
    fullPrice: { type: Number, default: null },
    // Pizza uses SMALL / REGULAR instead of Half/Full
    isPizza: { type: Boolean, default: false },
    image: { type: String, required: true },
    category: { type: String, required: true },
    isVeg: { type: Boolean, default: true },
    bestSeller: { type: Boolean, default: false },
    available: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
})

const foodModel = mongoose.models.food || mongoose.model("food", foodSchema);
export default foodModel;
