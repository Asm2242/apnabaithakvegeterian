import crypto from "crypto";
import jwt from "jsonwebtoken";
import otpModel from "../models/otpModel.js";
import userModel from "../models/userModel.js";
import * as sms from "../utils/sms.js";
const OTP_TTL_MS = 5 * 60 * 1000;      // 5 minutes
const RESEND_COOLDOWN_MS = 30 * 1000;  // 30 seconds
const MAX_ATTEMPTS = 5;
const MAX_REQUESTS_PER_10MIN = 5;

const isIndianMobile = (phone) => /^[6-9]\d{9}$/.test(phone);
const pepper = () => process.env.OTP_PEPPER || "apna-baithak-dev-pepper-change-me";
const hashOtp = (otp) => crypto.createHash("sha256").update(`${otp}:${pepper()}`).digest("hex");
const newOtp = () => String(crypto.randomInt(100000, 1000000));

// SMS provider lives in utils/sms.js (switch with OTP_PROVIDER env var).
const sendOtpSms = async (phone, otp) => {
    const result = await sms.sendOtpSms(phone, otp);
    console.log(`[otp] ${sms.smsProviderName()} sent to ${phone} | ${result}`);
    return result;
};

// no SMS provider + OTP_DEV_SHOW=1 -> return the code in the response so the
// app can show it (testing only). Never enable this in production.
const devOtpEnabled = () =>
    process.env.OTP_DEV_SHOW === "1" &&
    (sms.smsProviderName() === "console" ||
        (!process.env.MSG91_API_KEY &&
            !process.env.TWO_FACTOR_API_KEY &&
            !process.env.TEXTLOCAL_USERNAME &&
            !process.env.FAST2SMS_API_KEY));

// POST /api/otp/request  { phone } — needs login (same as checkout)
const requestOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!isIndianMobile(phone)) {
            return res.json({ success: false, message: "Enter a valid 10-digit Indian mobile number" });
        }
        const since = new Date(Date.now() - 10 * 60 * 1000);
        const recent = await otpModel.find({ phone, createdAt: { $gte: since } })
            .sort({ createdAt: -1 }).limit(MAX_REQUESTS_PER_10MIN + 1);
        if (recent.length >= MAX_REQUESTS_PER_10MIN) {
            return res.json({ success: false, message: "Too many OTP requests. Try again later" });
        }
        if (recent[0] && Date.now() - new Date(recent[0].createdAt).getTime() < RESEND_COOLDOWN_MS) {
            const wait = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - new Date(recent[0].createdAt).getTime())) / 1000);
            return res.json({ success: false, message: `Please wait ${wait}s before resending OTP` });
        }
        const otp = newOtp();
        await otpModel.deleteMany({ phone });
        await new otpModel({
            phone,
            otpHash: hashOtp(otp),
            expiresAt: new Date(Date.now() + OTP_TTL_MS)
        }).save();
        await sendOtpSms(phone, otp);
        res.json({
            success: true,
            message: "OTP sent",
            resendAfter: 30,
            ...(devOtpEnabled() ? { devOtp: otp } : {})
        });
    } catch (error) {
        console.log("[otp] send fail:", error.message);
        res.json({
            success: false,
            message: /^(MSG91|2Factor|Textlocal|Fast2SMS):/.test(error.message)
                ? `SMS nahi gaya: ${error.message.replace(/^[A-Za-z0-9]+: /, "")}`
                : "Could not send OTP"
        });
    }
}

// POST /api/otp/verify  { phone, otp }
const verifyOtp = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        if (!isIndianMobile(phone) || !/^\d{6}$/.test(otp || "")) {
            return res.json({ success: false, message: "Invalid or expired OTP" });
        }
        const row = await otpModel.findOne({ phone }).sort({ createdAt: -1 });
        if (!row || row.verified || row.expiresAt.getTime() < Date.now()) {
            return res.json({ success: false, message: "Invalid or expired OTP. Request a new one" });
        }
        if (row.attempts >= MAX_ATTEMPTS) {
            return res.json({ success: false, message: "Too many attempts. Request a new OTP" });
        }
        const a = Buffer.from(hashOtp(otp));
        const b = Buffer.from(row.otpHash);
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
            row.attempts += 1;
            await row.save();
            return res.json({ success: false, message: "Invalid or expired OTP" });
        }
        row.verified = true;
        await row.save();
        // link phone to this account
        if (req.body.userId) {
            await userModel.findByIdAndUpdate(req.body.userId, { phone, phoneVerified: true });
        }
        res.json({ success: true, message: "Phone verified" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Verification failed" });
    }
}

export { requestOtp, verifyOtp };

// ---- Public start-page OTP: no login needed (like every food app) ----
// POST /api/otp/start  { phone } — same limits, no auth
const startOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!isIndianMobile(phone)) {
            return res.json({ success: false, message: "Enter a valid 10-digit Indian mobile number" });
        }
        const since = new Date(Date.now() - 10 * 60 * 1000);
        const recent = await otpModel.find({ phone, createdAt: { $gte: since } })
            .sort({ createdAt: -1 }).limit(MAX_REQUESTS_PER_10MIN + 1);
        if (recent.length >= MAX_REQUESTS_PER_10MIN) {
            return res.json({ success: false, message: "Too many OTP requests. Try again later" });
        }
        if (recent[0] && Date.now() - new Date(recent[0].createdAt).getTime() < RESEND_COOLDOWN_MS) {
            return res.json({ success: false, message: "Please wait before resending OTP" });
        }
        const otp = newOtp();
        await otpModel.deleteMany({ phone });
        await new otpModel({
            phone,
            otpHash: hashOtp(otp),
            expiresAt: new Date(Date.now() + OTP_TTL_MS)
        }).save();
        await sendOtpSms(phone, otp);
        res.json({
            success: true,
            message: "OTP sent",
            resendAfter: 30,
            ...(devOtpEnabled() ? { devOtp: otp } : {})
        });
    } catch (error) {
        console.log("[otp] send fail:", error.message);
        res.json({
            success: false,
            message: /^(MSG91|2Factor|Textlocal|Fast2SMS):/.test(error.message)
                ? `SMS nahi gaya: ${error.message.replace(/^[A-Za-z0-9]+: /, "")}`
                : "Could not send OTP"
        });
    }
}

// POST /api/otp/login  { phone, otp, name? } — verify + find-or-create account, returns JWT
const loginWithOtp = async (req, res) => {
    try {
        const { phone, otp, name } = req.body;
        if (!isIndianMobile(phone) || !/^\d{6}$/.test(otp || "")) {
            return res.json({ success: false, message: "Invalid or expired OTP" });
        }
        const row = await otpModel.findOne({ phone }).sort({ createdAt: -1 });
        if (!row || row.verified || row.expiresAt.getTime() < Date.now()) {
            return res.json({ success: false, message: "Invalid or expired OTP. Request a new one" });
        }
        if (row.attempts >= MAX_ATTEMPTS) {
            return res.json({ success: false, message: "Too many attempts. Request a new OTP" });
        }
        const a = Buffer.from(hashOtp(otp));
        const b = Buffer.from(row.otpHash);
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
            row.attempts += 1;
            await row.save();
            return res.json({ success: false, message: "Invalid or expired OTP" });
        }
        row.verified = true;
        await row.save();

        let user = await userModel.findOne({ phone });
        if (!user) {
            user = await new userModel({
                name: (name || "").trim() || `Guest ${phone.slice(-4)}`,
                email: `91${phone}@otp.apnabaithak.com`,
                password: crypto.randomBytes(24).toString("hex"),
                role: "customer",
                phone,
                phoneVerified: true
            }).save();
        } else {
            user.phoneVerified = true;
            if (name && user.name.startsWith("Guest")) user.name = name.trim();
            if (!user.active) {
                return res.json({ success: false, message: "Account disabled" });
            }
            await user.save();
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.json({ success: true, token, name: user.name, phone });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Login failed" });
    }
}

export { startOtp, loginWithOtp };

// ---- Firebase Phone Auth (free 10k/month) ----
// Frontend verifies OTP with Firebase, sends idToken here.
// We verify via Admin SDK (service account JSON in FIREBASE_SERVICE_ACCOUNT env),
// then find-or-create Mongo user and return our JWT.
let fbAdmin = null;
const getFbAdmin = async () => {
    if (fbAdmin) return fbAdmin;
    let raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw && process.env.FIREBASE_KEY_FILE) {
        const { default: fs } = await import("fs");
        raw = fs.readFileSync(process.env.FIREBASE_KEY_FILE, "utf8");
    }
    if (!raw) return null;
    const { default: admin } = await import("firebase-admin");
    const creds = JSON.parse(raw);
    fbAdmin = admin.apps.length
        ? admin.app()
        : admin.initializeApp({ credential: admin.credential.cert(creds) });
    return fbAdmin;
};

// POST /api/otp/firelogin  { idToken, name? } — public
const fireLogin = async (req, res) => {
    try {
        const { idToken, name } = req.body;
        if (!idToken) return res.json({ success: false, message: "Missing token" });
        const admin = await getFbAdmin();
        if (!admin) {
            return res.json({ success: false, message: "Firebase not configured, use OTP" });
        }
        const decoded = await admin.auth().verifyIdToken(idToken);
        const e164 = decoded.phone_number || "";
        const m = e164.replace(/^\+91/, "");
        if (!/^[6-9]\d{9}$/.test(m)) {
            return res.json({ success: false, message: "Non-Indian number" });
        }
        let user = await userModel.findOne({ phone: m });
        if (!user) {
            user = await new userModel({
                name: (name || "").trim() || `Guest ${m.slice(-4)}`,
                email: `91${m}@otp.apnabaithak.com`,
                password: crypto.randomBytes(24).toString("hex"),
                role: "customer",
                phone: m,
                phoneVerified: true
            }).save();
        } else {
            user.phoneVerified = true;
            if (name && user.name.startsWith("Guest")) user.name = name.trim();
            if (!user.active) {
                return res.json({ success: false, message: "Account disabled" });
            }
            await user.save();
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.json({ success: true, token, name: user.name, phone: m });
    } catch (error) {
        console.log("[firelogin]", error.message);
        res.json({ success: false, message: "Firebase verify fail" });
    }
};

export { fireLogin };

// POST /api/otp/check  { phone } — public.
// Step 1 of login: is this a returning customer? If yes, return name.
// (User asked to show name for returning customers, like all food apps.)
const checkCustomer = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!isIndianMobile(phone)) {
            return res.json({ success: false, message: "Enter a valid 10-digit Indian mobile number" });
        }
        const user = await userModel.findOne({ phone, active: true }).select("name");
        if (user) {
            return res.json({ success: true, exists: true, name: user.name });
        }
        return res.json({ success: true, exists: false });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

export { checkCustomer };

// GET /api/otp/diag — which SMS provider is active + is it configured?
const diag = async (req, res) => {
    const out = {
        provider: sms.smsProviderName(),
        msg91: {
            hasAuthKey: !!process.env.MSG91_API_KEY,
            hasSender: !!process.env.MSG91_SENDER,
            sender: process.env.MSG91_SENDER || "",
            hasTemplate: !!process.env.MSG91_TEMPLATE_ID,
            template: process.env.MSG91_TEMPLATE_ID || ""
        },
        twofactor: { hasKey: !!process.env.TWO_FACTOR_API_KEY },
        textlocal: {
            hasUser: !!process.env.TEXTLOCAL_USERNAME,
            hasPass: !!process.env.TEXTLOCAL_PASSWORD
        },
        fast2sms: { hasKey: !!process.env.FAST2SMS_API_KEY },
        hasWhatsapp: !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID),
        devOtp: devOtpEnabled()
    };
    if (process.env.MSG91_API_KEY) {
        try {
            const w = await fetch("https://api.msg91.com/api/balance.php?type=1", {
                headers: { authkey: process.env.MSG91_API_KEY }
            });
            const wt = await w.text();
            let j = null;
            try { j = JSON.parse(wt); } catch { /* not json */ }
            out.msg91.balance = j || wt.slice(0, 200);
        } catch (e) {
            out.msg91.balanceError = e.message;
        }
    }
    res.json(out);
};

export { diag };

// GET/POST /api/otp/testsend?phone=... — send a real OTP through the ACTIVE
// provider and return the gateway's raw response.
const testSend = async (req, res) => {
    const phone = String(req.body?.phone || req.query?.phone || "").replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(phone)) {
        return res.json({ success: false, message: "Invalid mobile" });
    }
    const otp = String(crypto.randomInt(100000, 1000000));
    try {
        const result = await sms.sendOtpSms(phone, otp);
        res.json({
            success: true,
            provider: sms.smsProviderName(),
            phone,
            otp,
            result,
            raw: sms.smsLastRaw()
        });
    } catch (e) {
        res.json({
            success: false,
            provider: sms.smsProviderName(),
            phone,
            otp,
            error: e.message,
            raw: sms.smsLastRaw()
        });
    }
};

export { testSend };
