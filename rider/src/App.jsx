import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { QRCodeSVG } from "qrcode.react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Apna Baithak shop — every delivery route starts here
const SHOP_LAT = 26.9381402;
const SHOP_LNG = 80.9129123;

const shopIcon = L.divIcon({
  className: "rm-shop",
  html: "<div>🍽️</div>",
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const homeIcon = L.divIcon({
  className: "rm-home",
  html: "<div>🏠</div>",
  iconSize: [34, 34],
  iconAnchor: [17, 30],
});

const youIcon = L.divIcon({
  className: "rm-you",
  html: "<div>🔵</div>",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// km between two pins (for "X km left")
const kmBetween = (a, b) => {
  const R = 6371;
  const dLa = ((b[0] - a[0]) * Math.PI) / 180;
  const dLo = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLa / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

// mini map per order: shop -> customer pin + YOU live marker
const OrderMap = ({ order, livePos }) => {
  const shop = [SHOP_LAT, SHOP_LNG];
  const cust =
    order.lat != null && order.lng != null ? [order.lat, order.lng] : null;
  const from = livePos || shop;
  return (
    <div className="rider-minimap">
      <MapContainer center={cust || shop} zoom={14} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={shop} icon={shopIcon}>
          <Popup>Apna Baithak (pickup)</Popup>
        </Marker>
        {cust && (
          <>
            <Marker position={cust} icon={homeIcon}>
              <Popup>Customer drop 📍 — EXACT pin</Popup>
            </Marker>
            <Polyline positions={[from, cust]} color="#0f8a0f" weight={4} dashArray="8 8" />
          </>
        )}
        {livePos && (
          <Marker position={livePos} icon={youIcon}>
            <Popup>You are here 🔵</Popup>
          </Marker>
        )}
      </MapContainer>
      {cust ? (
        <p className="dist-line">
          📍 Customer pin{cust && livePos ? ` — ${kmBetween(livePos, cust).toFixed(1)} km from you` : " locked"}
        </p>
      ) : (
        <p className="no-pin">Customer ne pin nahi lagaya — address se jao.</p>
      )}
    </div>
  );
};

const destOf = (o) => {
  // customer dropped pin first (exact), else address text
  if (o.lat != null && o.lng != null) return `${o.lat},${o.lng}`;
  const a = typeof o.address === "string" ? o.address : o.address?.street || "";
  return `${a} ${o.address?.city || "Lucknow"} ${o.address?.zipcode || ""}`.trim();
};

// Apna Baithak Rider — separate delivery partner app
const App = () => {
  const [token, setToken] = useState(localStorage.getItem("ab_rider_token") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState([]);
  const [onDuty, setOnDuty] = useState(localStorage.getItem("ab_duty") === "1");
  const [gps, setGps] = useState(null); // { lat, lng, accuracy, at }
  const [qrOrder, setQrOrder] = useState(null); // order for QR modal
  const watchId = useRef(null);
  const lastSent = useRef(0);

  // owner UPI for doorstep QR (set VITE_OWNER_UPI in Vercel env)
  const OWNER_UPI = import.meta.env.VITE_OWNER_UPI || "9454999442@upi";
  const upiLink = (o) =>
    `upi://pay?pa=${OWNER_UPI}&pn=ApnaBaithak&am=${o.amount}&cu=INR&tn=${o._id}`;

  const auth = { headers: { token } };

  // continuous high-accuracy GPS while on duty — posts every ~10s
  const postGps = async (lat, lng, accuracy, tok) => {
    try {
      await axios.post(
        API + "/api/rider/location",
        { lat, lng, accuracy: Math.round(accuracy) },
        { headers: { token: tok || token } }
      );
      lastSent.current = Date.now();
      setGps({ lat, lng, accuracy: Math.round(accuracy), at: Date.now() });
    } catch { /* retry next tick */ }
  };

  const startWatch = (tok) => {
    if (!navigator.geolocation || watchId.current != null) return;
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        // skip wild fixes (>500m), send at most every 10s
        if (p.coords.accuracy && p.coords.accuracy > 500) return;
        if (Date.now() - lastSent.current < 10000) return;
        postGps(p.coords.latitude, p.coords.longitude, p.coords.accuracy || 0, tok);
      },
      () => setGps((g) => g || { accuracy: null, at: null, denied: true }),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  };

  const stopWatch = () => {
    if (watchId.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
    }
    watchId.current = null;
  };

  // resume GPS if duty was on
  useEffect(() => {
    if (token && localStorage.getItem("ab_duty") === "1") {
      setOnDuty(true);
      startWatch(token);
    }
    return () => stopWatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const load = async (tok) => {
    try {
      const res = await axios.get(API + "/api/rider/myorders", {
        headers: { token: tok || token },
      });
      if (res.data.success) setOrders(res.data.data);
    } catch {
      toast.error("Could not load orders");
    }
  };

  useEffect(() => {
    if (token) load(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(API + "/api/rider/login", { email, password });
      if (res.data.success) {
        setToken(res.data.token);
        localStorage.setItem("ab_rider_token", res.data.token);
        toast.success("Welcome, " + res.data.name);
      } else toast.error(res.data.message);
    } catch {
      toast.error("Login failed");
    }
  };

  const logout = () => {
    stopWatch();
    setToken("");
    localStorage.removeItem("ab_rider_token");
    localStorage.removeItem("ab_duty");
    setOrders([]);
  };

  const setStatus = async (orderId, status) => {
    try {
      const pos = await new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => resolve(null),
          { timeout: 8000 }
        );
      });
      const res = await axios.post(
        API + "/api/rider/status",
        { orderId, status, ...(pos || {}) },
        auth
      );
      if (res.data.success) {
        toast.success(status === "DELIVERED" ? "Delivered!" : "Picked up! Customer sees you moving 🛵");
        load();
      } else toast.error(res.data.message);
    } catch {
      toast.error("Update failed");
    }
  };

  const markDelivered = (orderId) => setStatus(orderId, "DELIVERED");
  const markPickedUp = (orderId) => setStatus(orderId, "OUT_FOR_DELIVERY");

  const collectMoney = async (orderId) => {
    if (!window.confirm("Cash mil gaya? Confirm karo.")) return;
    try {
      const res = await axios.post(API + "/api/rider/collect", { orderId }, auth);
      if (res.data.success) {
        toast.success("Cash collected ✓");
        load();
      } else toast.error(res.data.message);
    } catch {
      toast.error("Failed");
    }
  };

  const toggleDuty = async () => {
    const next = !onDuty;
    let pos = {};
    try {
      pos = await new Promise((resolve) => {
        if (!navigator.geolocation) return resolve({});
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy || 0) }),
          () => resolve({}),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
    } catch { /* location optional */ }
    try {
      await axios.post(API + "/api/rider/location", { onDuty: next, ...pos }, auth);
      setOnDuty(next);
      if (next) {
        localStorage.setItem("ab_duty", "1");
        startWatch();
        toast.success("On duty — live GPS ON 🛰️");
      } else {
        localStorage.removeItem("ab_duty");
        stopWatch();
        toast.success("Off duty");
      }
    } catch {
      toast.error("Could not update duty");
    }
  };

  if (!token) {
    return (
      <div className="rider-wrap">
        <ToastContainer />
        <form onSubmit={login} className="rider-card">
          <h1>Apna Baithak <span>Rider</span></h1>
          <p>Delivery partner login</p>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Rider email" type="email" required />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required />
          <button type="submit">Login</button>
          <small>Account admin banayega (Admin panel → Riders)</small>
        </form>
      </div>
    );
  }

  const active = orders.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED");
  const done = orders.filter((o) => o.status === "DELIVERED");

  return (
    <div className="rider-app">
      <ToastContainer />
      <header>
        <div className="rider-title">
          <b>Apna Baithak Rider</b>
          <p className="gps-line">
            {onDuty
              ? gps?.accuracy != null
                ? `🛰️ GPS ±${gps.accuracy}m ${gps.accuracy > 100 ? "(weak — bahar jao)" : "(accurate ✓)"}`
                : "🛰️ GPS dhoond raha hai… (location ON karo, bahar jao)"
              : "Duty OFF hai — GPS band"}
          </p>
        </div>
        <div>
          <button className={onDuty ? "duty on" : "duty"} onClick={toggleDuty}>
            {onDuty ? "On Duty ✓" : "Off Duty"}
          </button>
          <button onClick={logout} className="ghost">Logout</button>
        </div>
      </header>
      <main>
        <h2>To deliver ({active.length})</h2>
        {active.map((o) => (
          <div key={o._id} className="rider-card">
            <b>₹{o.amount}</b> • {o.paymentMethod === "cod" ? "COLLECT CASH" : o.paymentStatus} • {o.mode}
            <p>{o.customerName} • {o.phone}</p>
            <p>{typeof o.address === "string" ? o.address : o.address?.street}, {o.address?.city} {o.address?.zipcode}</p>
            {o.landmark && <p>Landmark: {o.landmark}</p>}
            <OrderMap order={o} livePos={onDuty && gps?.lat != null ? [gps.lat, gps.lng] : null} />
            <ul>{(o.items || []).map((it, i) => (
              <li key={i}>{it.name} ({it.size}) × {it.qty}</li>
            ))}</ul>
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${onDuty && gps?.lat != null ? `${gps.lat},${gps.lng}` : `${SHOP_LAT},${SHOP_LNG}`}&destination=${encodeURIComponent(destOf(o))}&travelmode=driving`}
              target="_blank"
              rel="noreferrer"
              className="nav-btn"
            >
              🗺️ Choose Route & Navigate
            </a>
            {o.status === "READY" ? (
              <button onClick={() => markPickedUp(o._id)} className="deliver-btn pickup">
                🛵 Picked Up — Start Delivery
              </button>
            ) : (
              <button onClick={() => markDelivered(o._id)} className="deliver-btn">
                ✅ Mark Delivered
              </button>
            )}
            {o.paymentMethod === "cod" && !o.cashCollected ? (
              <button onClick={() => collectMoney(o._id)} className="deliver-btn cash">
                💰 Money Collected (₹{o.amount} cash)
              </button>
            ) : o.paymentMethod === "cod" ? (
              <p className="cash-done">💰 Cash collected ✓</p>
            ) : null}
            {(o.paymentMethod !== "cod" && o.paymentStatus !== "PAID") || (o.paymentMethod === "cod" && !o.cashCollected) ? (
              <button onClick={() => setQrOrder(o)} className="deliver-btn qr">
                📱 Show QR (UPI ₹{o.amount})
              </button>
            ) : null}
          </div>
        ))}
        {active.length === 0 && <p>No deliveries assigned. Stay on duty!</p>}
        <h2>Delivered ({done.length})</h2>
        {done.slice(0, 20).map((o) => (
          <div key={o._id} className="rider-card done">
            <b>₹{o.amount}</b> • {o.customerName} • {new Date(o.date).toLocaleString("en-IN")}
          </div>
        ))}
      </main>
      {qrOrder && (
        <div className="qr-modal" onClick={() => setQrOrder(null)}>
          <div className="qr-box" onClick={(e) => e.stopPropagation()}>
            <h3>Scan & Pay ₹{qrOrder.amount}</h3>
            <QRCodeSVG value={upiLink(qrOrder)} size={230} />
            <p>Apna Baithak • {OWNER_UPI}</p>
            <p className="qr-note">Customer apne UPI app se scan kare</p>
            <button onClick={() => setQrOrder(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
