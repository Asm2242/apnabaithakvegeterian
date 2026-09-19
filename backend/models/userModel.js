import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // role: customer places orders, rider delivers, admin manages everything
    role: { type: String, enum: ["customer", "rider", "admin"], default: "customer" },
    // Indian mobile for OTP login. Sparse unique so many users can skip phone.
    phone: { type: String, unique: true, sparse: true },
    phoneVerified: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    // saved delivery addresses: address1, address2... (last used first)
    savedAddress: {
        street: { type: String, default: "" },
        city: { type: String, default: "Lucknow" },
        state: { type: String, default: "Uttar Pradesh" },
        zipcode: { type: String, default: "226013" },
        country: { type: String, default: "India" },
        landmark: { type: String, default: "" }
    },
    addresses: [{
        label: { type: String, default: "" },
        street: { type: String, default: "" },
        city: { type: String, default: "Lucknow" },
        state: { type: String, default: "Uttar Pradesh" },
        zipcode: { type: String, default: "" },
        country: { type: String, default: "India" },
        landmark: { type: String, default: "" },
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
        lastUsedAt: { type: Date, default: Date.now }
    }],
    cartData: { type: Object, default: {} }
}, { minimize: false })

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;
