// SMS provider for OTP. Switch with OTP_PROVIDER env var — no code change needed.
//   msg91      -> MSG91_API_KEY, MSG91_SENDER, (MSG91_TEMPLATE_ID)
//   twofactor  -> TWO_FACTOR_API_KEY            (free 1000 OTP/month, no DLT)
//   textlocal  -> TEXTLOCAL_USERNAME, TEXTLOCAL_PASSWORD, TEXTLOCAL_SENDER
//   fast2sms   -> FAST2SMS_API_KEY, FAST2SMS_SENDER_ID
//   console    -> dev only, prints the OTP in server logs
const provider = () => (process.env.OTP_PROVIDER || "msg91").toLowerCase();

const stripPlus = (p) => String(p || "").replace(/\D/g, "");

const viaMsg91 = async (phone, otp) => {
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
    try { parsed = JSON.parse(body); } catch { /* not json */ }
    // MSG91 returns HTTP 200 even for failures -> check body.type
    if (!res.ok || (parsed && parsed.type === "error")) {
        const reason =
            parsed?.message?.statement || parsed?.message?.code || body?.slice(0, 200) || `HTTP ${res.status}`;
        throw new Error(`MSG91: ${reason}`);
    }
    return parsed?.message?.statement || "ok";
};

const viaTwoFactor = async (phone, otp) => {
    const key = process.env.TWO_FACTOR_API_KEY;
    if (!key) throw new Error("2Factor: TWO_FACTOR_API_KEY missing");
    const res = await fetch(`https://api.2factor.in/V2/${key}/SMS/91${phone}/${otp}`, {
        headers: { Authorization: key }
    });
    const body = await res.text();
    let parsed = null;
    try { parsed = JSON.parse(body); } catch { /* not json */ }
    console.log(`[sms:2factor] ${phone} -> ${body.slice(0, 300)}`);
    const status = parsed?.Status || parsed?.status;
    if (!res.ok || (status && /error/i.test(String(status)))) {
        throw new Error(`2Factor: ${parsed?.Details || body?.slice(0, 200) || `HTTP ${res.status}`}`);
    }
    return parsed?.Details || status || "ok";
};

const viaTextlocal = async (phone, otp) => {
    const { TEXTLOCAL_USERNAME: u, TEXTLOCAL_PASSWORD: p, TEXTLOCAL_SENDER: s } = process.env;
    if (!u || !p) throw new Error("Textlocal: username/password missing");
    const form = new URLSearchParams({
        username: u,
        password: p,
        sender: s || "TXTLOC",
        number: `91${phone}`,
        text: `Your OTP for Apna Baithak is ${otp}. Valid for 5 minutes.`
    });
    const res = await fetch("https://api.textlocal.in/send", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString()
    });
    const body = await res.text();
    let parsed = null;
    try { parsed = JSON.parse(body); } catch { /* not json */ }
    if (!res.ok || (parsed && Array.isArray(parsed.errors) && parsed.errors.length)) {
        throw new Error(`Textlocal: ${parsed?.errors?.[0]?.message || body?.slice(0, 200) || `HTTP ${res.status}`}`);
    }
    return "ok";
};

const viaFast2Sms = async (phone, otp) => {
    const key = process.env.FAST2SMS_API_KEY;
    if (!key) throw new Error("Fast2SMS: FAST2SMS_API_KEY missing");
    const form = new URLSearchParams({
        route: "otp",
        sender_id: process.env.FAST2SMS_SENDER_ID || "FSTSMS",
        message: `Your OTP for Apna Baithak is {otp}. Valid for 5 minutes.`,
        language: "english",
        numbers: `91${phone}`,
        variables_values: otp,
        var_type: "numeric",
        api_key: key
    });
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString()
    });
    const body = await res.text();
    let parsed = null;
    try { parsed = JSON.parse(body); } catch { /* not json */ }
    if (!res.ok || (parsed && parsed.return === false)) {
        throw new Error(`Fast2SMS: ${parsed?.message?.[0] || body?.slice(0, 200) || `HTTP ${res.status}`}`);
    }
    return "ok";
};

// Sends the OTP. Throws with a human readable reason when the gateway refuses.
export const sendOtpSms = async (phone, otp) => {
    const p = provider();
    const num = stripPlus(phone).slice(-10);
    if (p === "twofactor") return viaTwoFactor(num, otp);
    if (p === "textlocal") return viaTextlocal(num, otp);
    if (p === "fast2sms") return viaFast2Sms(num, otp);
    if (p === "console") {
        console.log(`[OTP dev] ${num}: ${otp}`);
        return "dev";
    }
    return viaMsg91(num, otp);
};

export const smsProviderName = () => provider();
