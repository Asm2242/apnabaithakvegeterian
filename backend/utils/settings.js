import settingModel from "../models/settingModel.js";

export const SETTING_DEFAULTS = {
    onlinePayment: true
};

export const getSetting = async (key) => {
    try {
        const row = await settingModel.findOne({ key }).lean();
        if (row && row.value !== null && row.value !== undefined) return row.value;
    } catch (error) {
        console.log("settings read fail:", error.message);
    }
    return SETTING_DEFAULTS[key];
};

export const getAllSettings = async () => {
    const out = { ...SETTING_DEFAULTS };
    try {
        const rows = await settingModel.find({}).lean();
        for (const r of rows) {
            if (r.value !== null && r.value !== undefined) out[r.key] = r.value;
        }
    } catch (error) {
        console.log("settings read fail:", error.message);
    }
    return out;
};

export const setSetting = async (key, value) => {
    await settingModel.findOneAndUpdate(
        { key },
        { $set: { value } },
        { upsert: true, new: true }
    );
    return value;
};

export const isOnlinePaymentOn = async () => !!(await getSetting("onlinePayment"));