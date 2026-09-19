import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { StoreContext } from "../../Context/StoreContext";
import "./Track.css";

const STEPS = ["PLACED", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];

// Live tracking like Uber/Blinkit: rider GPS map + help + AI bot requests
const Track = () => {
  const { id } = useParams();
  const { url, token } = useContext(StoreContext);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [botOpen, setBotOpen] = useState(false);
  const [reqType, setReqType] = useState("cancel");
  const [reqText, setReqText] = useState("");
  const [myReqs, setMyReqs] = useState([]);
  const [sending, setSending] = useState(false);

  const load = async () => {
    try {
      const res = await axios.get(url + "/api/order/track/" + id, {
        headers: { token },
      });
      if (res.data.success) setData(res.data.data);
      else setErr(res.data.message);
    } catch {
      setErr("Could not load order");
    }
  };

  const loadReqs = async () => {
    try {
      const res = await axios.get(url + "/api/order/requests/" + id, {
        headers: { token },
      });
      if (res.data.success) setMyReqs(res.data.data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!token) {
      navigate("/cart");
      return;
    }
    load();
    loadReqs();
    const t = setInterval(() => {
      load();
      loadReqs();
    }, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  const sendRequest = async () => {
    if (sending) return;
    setSending(true);
    try {
      const res = await axios.post(
        url + "/api/order/request",
        { orderId: id, type: reqType, details: reqText },
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success("Request sent! Restaurant will respond soon.");
        setReqText("");
        loadReqs();
      } else toast.error(res.data.message);
    } catch {
      toast.error("Request failed");
    }
    setSending(false);
  };

  if (err) return <div className="track"><p>{err}</p></div>;
  if (!data) return <div className="track"><p>Loading live status…</p></div>;

  const { order, rider } = data;
  const cancelled = order.status === "CANCELLED";
  const stepIndex = STEPS.indexOf(order.status);
  const closed = cancelled || order.status === "DELIVERED";

  return (
    <div className="track">
      <h2>Order Tracking</h2>
      <p className="track-total">₹{order.amount} • {order.paymentMethod === "cod" ? "Pay cash on delivery" : order.paymentStatus}</p>

      {cancelled ? (
        <p className="cancelled">Order cancelled. Call +91 94549 99442 for help.</p>
      ) : (
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s} className={i <= stepIndex ? "done" : ""}>
              <span className="dot">{i + 1}</span>
              {s.replace(/_/g, " ")}
            </li>
          ))}
        </ol>
      )}

      {rider && !cancelled && (
        <div className="rider-box">
          <div className="rider-head">
            <div className="rider-avatar">{(rider.name || "R")[0]}</div>
            <div>
              <b>{rider.name}</b>
              <p>Delivery partner • Apna Baithak</p>
            </div>
            {rider.phone && (
              <a href={`tel:${rider.phone}`} className="call-btn">📞 Call</a>
            )}
          </div>
          {rider.lat != null ? (
            <>
              <p className="live">🟢 Live {rider.updatedAt ? `(${new Date(rider.updatedAt).toLocaleTimeString("en-IN")})` : ""}</p>
              <iframe
                title="rider location"
                className="rider-map"
                loading="lazy"
                src={`https://maps.google.com/maps?q=${rider.lat},${rider.lng}&z=16&output=embed`}
              />
            </>
          ) : (
            <p>Rider on the way — live location coming soon.</p>
          )}
        </div>
      )}

      <div className="track-items">
        <h3>Your items</h3>
        <ul>
          {(order.items || []).map((it, i) => (
            <li key={i}>{it.name} ({it.size}) × {it.qty} — ₹{it.price * it.qty}</li>
          ))}
        </ul>
      </div>

      <div className="help-box">
        <h3>Help & Support</h3>
        <div className="help-btns">
          <a href="tel:+919454999442">📞 Call restaurant</a>
          <a
            href={`https://wa.me/919454999442?text=${encodeURIComponent(`Hi Apna Baithak! Order ${order._id} help chahiye.`)}`}
            target="_blank"
            rel="noreferrer"
          >
            💬 WhatsApp us
          </a>
          {!closed && (
            <button onClick={() => setBotOpen((v) => !v)}>
              🤖 {botOpen ? "Close helper" : "Talk to helper"}
            </button>
          )}
        </div>
        {botOpen && !closed && (
          <div className="aibot">
            <p>Cancel, item nikalo ya badlo — request bhejo, restaurant turant dekhega:</p>
            <div className="aibot-types">
              {[
                ["cancel", "Cancel order"],
                ["remove_item", "Remove item"],
                ["change_item", "Change item"],
                ["other", "Other"],
              ].map(([v, label]) => (
                <button
                  key={v}
                  className={reqType === v ? "active" : ""}
                  onClick={() => setReqType(v)}
                >
                  {label}
                </button>
              ))}
            </div>
            <textarea
              value={reqText}
              onChange={(e) => setReqText(e.target.value)}
              placeholder="Jaise: 'Paneer momos nikalo' ya 'address change karna hai'…"
              rows={2}
            />
            <button onClick={sendRequest} disabled={sending} className="send-btn">
              {sending ? "Sending…" : "Send request ➤"}
            </button>
            {myReqs.length > 0 && (
              <ul className="req-list">
                {myReqs.map((r) => (
                  <li key={r._id}>
                    <b>{r.type.replace(/_/g, " ")}</b> — {r.status}
                    {r.details ? `: ${r.details}` : ""}
                    {r.adminNote ? ` (Reply: ${r.adminNote})` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Track;
