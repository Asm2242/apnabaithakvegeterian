import mongoose from "mongoose";

// Shop settings (admin toggles) - key/value rows so new switches need no migration.
const settingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null }
}, { timestamps: true })

const settingModel = mongoose.models.setting || mongoose.model("setting", settingSchema);
export default settingModel;