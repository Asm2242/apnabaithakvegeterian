// WhatsApp order updates (Cloud API if configured, else server log).
// Env: WHATSAPP_TOKEN, WHATSAPP_PHONE_ID. Owner: OWNER_PHONE (default Baithak).
const ownerPhone = () => (process.env.OWNER_PHONE || "919454999442").replace(/\D/g, "");

const sendWhatsApp = async (to, text) => {
    const phone = String(to || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    if (!/^[6-9]\d{9}$/.test(phone)) return;
    if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID) {
        try {
            await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
                method: "POST",
                headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: `91${phone}`,
                    type: "text",
                    text: { body: text }
                })
            });
            return;
        } catch (e) {
            console.log("[WA fail]", e.message);
        }
    }
    console.log(`[WA to 91${phone}] ${text}`);
};

const notifyOwnerNewOrder = (order) => {
    const items = (order.items || []).map((i) => `${i.name} x${i.qty}`).join(", ");
    sendWhatsApp(ownerPhone(),
        `🔔 New order ${order._id} • Rs.${order.amount} • ${order.paymentMethod === "cod" ? "COD" : "Online"} • ${order.customerName} ${order.phone} • ${items}`);
};

const notifyCustomer = (phone, text) => sendWhatsApp(phone, text);

export { sendWhatsApp, notifyOwnerNewOrder, notifyCustomer, ownerPhone };
