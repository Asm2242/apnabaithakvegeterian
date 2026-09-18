import orderModel from "../models/orderModel.js";
import foodModel from "../models/foodModel.js";
import userModel from "../models/userModel.js";
import riderModel from "../models/riderModel.js";
import couponModel from "../models/couponModel.js";

// ---------- actions the bot can run (admin only) ----------

const FLOW = ["PLACED", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];

const botStats = async () => {
    const [pending, today, riders, foods] = await Promise.all([
        orderModel.countDocuments({ status: { $nin: ["DELIVERED", "CANCELLED"] } }),
        orderModel.countDocuments({ date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
        userModel.countDocuments({ role: "rider", active: true }),
        foodModel.countDocuments({ available: true }),
    ]);
    return `📊 Live: ${pending} active orders • ${today} orders today • ${riders} riders • ${foods} dishes available.`;
};

// advance every non-final order one step (PLACED->CONFIRMED ... OUT_FOR_DELIVERY->DELIVERED)
const advanceOrders = async () => {
    const orders = await orderModel.find({ status: { $nin: ["DELIVERED", "CANCELLED"] } });
    let moved = 0;
    for (const o of orders) {
        const i = FLOW.indexOf(o.status);
        if (i >= 0 && i < FLOW.length - 1) {
            o.status = FLOW[i + 1];
            await o.save();
            moved++;
        }
    }
    return `✅ ${moved} order(s) aage badha diye. Baaki (DELIVERED/CANCELLED) chhoo diye.`;
};

// assign unassigned READY/OUT_FOR_DELIVERY orders to least-busy on-duty rider
const assignRiders = async () => {
    const riders = await userModel.find({ role: "rider", active: true }).select("_id name");
    if (riders.length === 0) return "❌ Koi rider account nahi hai. Pehle Riders tab me rider banao.";
    const profiles = await riderModel.find({ userId: { $in: riders.map((r) => r._id) } });
    const onDuty = profiles.filter((p) => p.onDuty).map((p) => String(p.userId));
    const pool = onDuty.length ? onDuty : riders.map((r) => String(r._id));
    const free = await orderModel.find({
        status: { $in: ["READY", "OUT_FOR_DELIVERY"] },
        $or: [{ riderId: "" }, { riderId: { $exists: false } }]
    });
    if (free.length === 0) return "Sab orders me rider laga hai. Kuch assign karne ko nahi. 👍";
    const counts = await orderModel.aggregate([
        { $match: { riderId: { $in: pool }, status: { $nin: ["DELIVERED", "CANCELLED"] } } },
        { $group: { _id: "$riderId", n: { $sum: 1 } } }
    ]);
    const load = Object.fromEntries(counts.map((c) => [c._id, c.n]));
    let ai = 0;
    for (const o of free) {
        pool.sort((a, b) => (load[a] || 0) - (load[b] || 0));
        const pick = pool[ai++ % pool.length];
        o.riderId = pick;
        if (o.status === "READY") o.status = "OUT_FOR_DELIVERY";
        await o.save();
        load[pick] = (load[pick] || 0) + 1;
    }
    return `🛵 ${free.length} order(s) riders ko assign kar diye (sabse free rider ko pehle).`;
};

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// toggle dish availability by name
const toggleDish = async (name) => {
    if (!name) return "Dish ka naam batao. Jaise: 'chai hide karo'.";
    const foods = await foodModel.find({});
    const dish = foods.find((f) => norm(f.name) === norm(name) || norm(f.name).includes(norm(name)));
    if (!dish) return `"${name}" naam ki dish nahi mili. Foods tab me naam check karo.`;
    dish.available = !dish.available;
    await dish.save();
    return `${dish.available ? "✅" : "🚫"} ${dish.name} ab ${dish.available ? "Available" : "Sold out"} hai.`;
};

// ---------- tutorials ----------
const TUTORIALS = {
    photo: `📸 Bulk photos (zip) upload:\n1. Saari dish photos ek folder me rakho. Naam dish jaisa rakho — jaise "Chai.jpg", "Paneer-Pizza.jpg".\n2. Folder ko right-click → Send to → Compressed (zipped) folder. Max 50MB.\n3. Admin → AI Chat → neeche 📦 button se zip upload karo.\n4. Bot khud match karke Cloudinary me daal dega + report dega: kaunsi lagi, kaunsi nahi.`,
    dish: `🍲 Dish add/edit:\nAdmin → Foods → Add dish: naam, category, price, Half/Full (pizza me Small/Regular), photo → Save. Edit ke liye dish par Edit dabao. Bechna band ho to Hide dabao.`,
    rider: `🛵 Rider:\nAdmin → Riders → naam/email/password/phone → Create. Rider apne phone par rider wale URL se login karega, duty ON karega. Order assign: Orders tab me order ke saamne rider chuno.`,
    coupon: `🎟️ Coupon:\nAdmin → Coupons → CODE + value + min order → Save. Customer cart me code dalega. WELCOME50 first-order auto offer hai.`,
    order: `📦 Orders:\nAdmin → Orders → status filter, payment filter (COD / Online-paid). Status dropdown se aage badhao. "advance all" likho to main sab pending orders ek step aage badha dunga. "assign riders" likho to free riders ko baant dunga.`,
    otp: `📱 OTP:\nCustomer +91 number → OTP → login. OTP abhi Render Logs me dikhta hai ([OTP dev]). Asli SMS ke liye MSG91 key backend env me daalo.`,
};

const helpText = () => `🤖 Main Apna Baithak helper hun! Ye kar sakta hun:\n• "report" — live stats\n• "advance all" — sab orders ek step aage\n• "assign riders" — free orders baanto\n• "chai hide karo" — dish on/off\n• "photo upload kaise" — zip tutorial\n• "dish/rider/coupon/order/otp" — tutorial\n• "help" — ye list`;

// ---------- rule-based brain (no key needed) ----------
const ruleBrain = async (text) => {
    const t = text.toLowerCase();
    if (/(advance|aage|confirm all|auto)/.test(t) && /(order|all)/.test(t)) {
        return advanceOrders();
    }
    if (/assign.*rider|rider.*assign|baant/.test(t)) {
        return assignRiders();
    }
    if (/report|stats|total|summary|hisab/.test(t)) {
        return botStats();
    }
    if (/photo|zip|upload|image/.test(t)) {
        return TUTORIALS.photo;
    }
    if (/(hide|show|off|on|band|chalu|available|sold)/.test(t)) {
        const name = text.replace(/(hide|show|off|on|band|chalu|available|sold|karo|kar|do|please)/gi, "").trim();
        return toggleDish(name);
    }
    if (/rider/.test(t)) return TUTORIALS.rider;
    if (/coupon|offer|discount/.test(t)) return TUTORIALS.coupon;
    if (/dish|food|item|menu|price/.test(t)) return TUTORIALS.dish;
    if (/order/.test(t)) return TUTORIALS.order;
    if (/otp|sms|login|phone/.test(t)) return TUTORIALS.otp;
    if (/help|namaste|hello|hi\b|kaam/.test(t)) return helpText();
    return `Samajh nahi aaya. 🤔 "help" likho — main orders aage badha sakta hun, riders assign, dish on/off, stats aur tutorials de sakta hun.`;
};

// ---------- Gemini brain (free key) with actions ----------
const GEMINI_ACTIONS = [
    {
        name: "advanceOrders",
        description: "Advance all pending orders one status step forward",
        parameters: { type: "OBJECT", properties: {} }
    },
    {
        name: "assignRiders",
        description: "Assign unassigned ready orders to free riders",
        parameters: { type: "OBJECT", properties: {} }
    },
    {
        name: "getStats",
        description: "Live restaurant stats",
        parameters: { type: "OBJECT", properties: {} }
    },
    {
        name: "toggleDish",
        description: "Toggle a dish available/sold-out by name",
        parameters: { type: "OBJECT", properties: { name: { type: "STRING" } }, required: ["name"] }
    }
];

const runAction = async (name, args) => {
    if (name === "advanceOrders") return advanceOrders();
    if (name === "assignRiders") return assignRiders();
    if (name === "getStats") return botStats();
    if (name === "toggleDish") return toggleDish(args?.name);
    return "Action nahi mila.";
};

const geminiBrain = async (text) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    const sys = `You are Apna Baithak restaurant admin helper. Reply in Hinglish (Hindi in Roman script), short. Tutorials: bulk photo zip upload via chat 📦 button (match by dish name), dish CRUD in Foods tab, riders in Riders tab, coupons tab, orders workflow PLACED>CONFIRMED>PREPARING>READY>OUT_FOR_DELIVERY>DELIVERED, OTP via MSG91 env else Render logs. Use actions for live tasks.`;
    try {
        const call = async (contents) => {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        system_instruction: { parts: [{ text: sys }] },
                        contents,
                        tools: [{ function_declarations: GEMINI_ACTIONS }]
                    })
                }
            );
            if (!res.ok) throw new Error("gemini " + res.status);
            return res.json();
        };
        let data = await call([{ role: "user", parts: [{ text }] }]);
        let part = data.candidates?.[0]?.content?.parts?.[0];
        if (part?.functionCall) {
            const { name, args } = part.functionCall;
            const result = await runAction(name, args);
            data = await call([
                { role: "user", parts: [{ text }] },
                { role: "model", parts: [{ functionCall: part.functionCall }] },
                { role: "user", parts: [{ functionResponse: { name, response: { result } } }] }
            ]);
            part = data.candidates?.[0]?.content?.parts?.[0];
        }
        return part?.text || null;
    } catch (e) {
        console.log("[gemini]", e.message);
        return null;
    }
};

// POST /api/admin/bot  { message }
const chat = async (req, res) => {
    try {
        const text = String(req.body.message || "").slice(0, 1000);
        if (!text.trim()) return res.json({ success: true, reply: helpText() });
        const ai = await geminiBrain(text);
        if (ai) return res.json({ success: true, reply: ai, ai: true });
        const reply = await ruleBrain(text);
        res.json({ success: true, reply, ai: false });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Bot error" });
    }
};

export { chat, botStats, advanceOrders, assignRiders, toggleDish };
