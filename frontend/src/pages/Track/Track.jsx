import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { StoreContext } from "../../Context/StoreContext";
import "./Track.css";

const STEPS = ["PLACED", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];

// idea #3: live order tracking with rider GPS
const Track = () => {
  const { id } = useParams();
  const { url, token } = useContext(StoreContext);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

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

  useEffect(() => {
    if (!token) {
      navigate("/cart");
      return;
    }
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  if (err) return <div className="track"><p>{err}</p></div>;
  if (!data) return <div className="track"><p>Loading live status…</p></div>;

  const { order, rider } = data;
  const cancelled = order.status === "CANCELLED";
  const stepIndex = STEPS.indexOf(order.status);

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

      {rider && (
        <div className="rider-box">
          <h3>Delivery partner</h3>
          <p><b>{rider.name}</b>{rider.phone ? ` • ${rider.phone}` : ""}</p>
          {rider.lat != null ? (
            <>
              <p className="live">🟢 Live location {rider.updatedAt ? `(${new Date(rider.updatedAt).toLocaleTimeString("en-IN")})` : ""}</p>
              <a
                href={`https://www.google.com/maps?q=${rider.lat},${rider.lng}`}
                target="_blank"
                rel="noreferrer"
                className="map-btn"
              >
                See rider on map
              </a>
            </>
          ) : (
            <p>Rider location not shared yet.</p>
          )}
        </div>
      )}

      <div className="track-items">
        <h3>Items</h3>
        <ul>
          {(order.items || []).map((it, i) => (
            <li key={i}>{it.name} ({it.size}) × {it.qty} — ₹{it.price * it.qty}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Track;
