import mongoose from "mongoose";

// Delivery partner profile. Auth account lives in users collection
// with role="rider"; this holds rider-specific data.
const riderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, unique: true },
    vehicle: { type: String, default: "Bike" },
    active: { type: Boolean, default: true },
    onDuty: { type: Boolean, default: false },
    // live location, updated by rider app
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    accuracy: { type: Number, default: null }, // GPS meters (lower = better)
    locationUpdatedAt: { type: Date, default: null },
    totalDeliveries: { type: Number, default: 0 }
}, { timestamps: true })

const riderModel = mongoose.models.rider || mongoose.model("rider", riderSchema);
export default riderModel;
