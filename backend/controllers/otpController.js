import crypto from "crypto";
import jwt from "jsonwebtoken";
import otpModel from "../models/otpModel.js";
import userModel from "../models/userModel.js";
const OTP_TTL_MS = 5 * 60 * 1000;      // 5 minutes
const RESEND_COOLDOWN_MS = 30 * 1000;  // 30 seconds
const MAX_ATTEMPTS = 5;
const MAX_REQUESTS_PER_10MIN = 5;

const isIndianMobile = (phone) => /^[6-9]\d{9}$/.test(phone);
const pepper = () => process.env.OTP_PEPPER || "apna-baithak-dev-pepper-change-me";
const hashOtp = (otp) => crypto.createHash("sha256").update(`${otp}:${pepper()}`).digest("hex");
const newOtp = () => String(crypto.randomInt(100000, 1000000));

// MSG91 SMS -> WhatsApp Cloud -> dev console fallback. Secrets stay server-side.
const sendOtpSms = async (phone, otp) => {
    if (process.env.MSG91_API_KEY && process.env.MSG91_SENDER) {
        const res = await fetch("https://api.msg91.com/api/v5/otp", {
            method: "POST",
            headers: { "Content-Type": "application/json", authkey: process.env.MSG91_API_KEY },
            body: JSON.stringify({
                mobile: `91${phone}`,
                sender: process.env.MSG91_SENDER,
                otp,
                ...(process.env.MSG91_TEMPLATE_ID ? { template_id: process.env.MSG91_TEMPLATE_ID } : {})
            })
        });
        const body = await res.text();
        let parsed = null;
        try { parsed = JSON.parse(body); } catch { /* non-json */ }
        // MSG91 returns HTTP 200 even for failures -> must check body.type
        const ok = res.ok && (!parsed || parsed.type === "success");
        if (!ok) {
            const reason =
                parsed?.message?.statement ||
                parsed?.message?.code ||
                parsed?.error?.message ||
                body?.slice(0, 300) ||
                `HTTP ${res.status}`;
            console.log(`[otp] MSG91 REJECTED ${phone}: ${reason}`);
            throw new Error(`MSG91: ${reason}`);
        }
        console.log(`[otp] MSG91 sent to ${phone} | ${parsed?.message?.statement || "ok"}`);
        return;
    }
    if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID) {
        const res = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: `91${phone}`,
                type: "template",
                template: {
                    name: process.env.WHATSAPP_OTP_TEMPLATE || "otp_verification",
                    language: { code: "en" },
                    components: [{ type: "body", parameters: [{ type: "text", text: otp }] }]
                }
            })
        });
        if (!res.ok) throw new Error("Could not send WhatsApp OTP");
        return;
    }
    // no SMS provider configured — log loudly so it is visible in Render logs
    console.log(`[OTP dev] ${phone}: ${otp}`);
};

// no SMS provider + OTP_DEV_SHOW=1 -> return the code in the response so the
// app can show it (testing only). Never enable this in production.
const devOtpEnabled = () =>
    process.env.OTP_DEV_SHOW === "1" &&
    !process.env.MSG91_API_KEY &&
    !process.env.WHATSAPP_TOKEN;

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
            message: /MSG91/.test(error.message)
                ? `SMS nahi gaya: ${error.message.replace("MSG91: ", "")}`
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
            message: /MSG91/.test(error.message)
                ? `SMS nahi gaya: ${error.message.replace("MSG91: ", "")}`
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

// GET /api/otp/diag — admin diagnostic: MSG91 wallet, sender id, template status.
// Helps find out WHY the SMS is not landing on the phone.
const diag = async (req, res) => {
    const out = {
        hasAuthKey: !!process.env.MSG91_API_KEY,
        hasSender: !!process.env.MSG91_SENDER,
        sender: process.env.MSG91_SENDER || "",
        hasTemplate: !!process.env.MSG91_TEMPLATE_ID,
        template: process.env.MSG91_TEMPLATE_ID || "",
        hasWhatsapp: !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID),
        devOtp: devOtpEnabled()
    };
    if (!process.env.MSG91_API_KEY) {
        out.error = "MSG91_API_KEY missing in env";
        return res.json(out);
    }
    try {
        const w = await fetch("https://api.msg91.com/api/v5/balance", {
            headers: { authkey: process.env.MSG91_API_KEY }
        });
        const wj = await w.json();
        out.wallet = wj;
    } catch (e) {
        out.walletError = e.message;
    }
    try {
        const s = await fetch("https://api.msg91.com/api/v5/sender", {
            headers: { authkey: process.env.MSG91_API_KEY }
        });
        const sj = await s.json();
        out.senders = Array.isArray(sj) ? sj : (sj.data || sj);
    } catch (e) {
        out.senderError = e.message;
    }
    try {
        const t = await fetch("https://api.msg91.com/api/v5/template", {
            headers: { authkey: process.env.MSG91_API_KEY }
        });
        const tj = await t.json();
        out.templates = Array.isArray(tj) ? tj : (tj.data || tj);
    } catch (e) {
        out.templateError = e.message;
    }
    res.json(out);
};

export { diag };
