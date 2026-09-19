import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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

// mini map per order: shop -> customer pin
const OrderMap = ({ order }) => {
  const shop = [SHOP_LAT, SHOP_LNG];
  const cust =
    order.lat != null && order.lng != null ? [order.lat, order.lng] : null;
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
              <Popup>Customer drop 📍</Popup>
            </Marker>
            <Polyline positions={[shop, cust]} color="#0f8a0f" weight={4} dashArray="8 8" />
          </>
        )}
      </MapContainer>
      {!cust && <p className="no-pin">Customer ne pin nahi lagaya — address se jao.</p>}
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
  const [gps, setGps] = useState(null); // { accuracy, at }
  const watchId = useRef(null);
  const lastSent = useRef(0);

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
      setGps({ accuracy: Math.round(accuracy), at: Date.now() });
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
            <OrderMap order={o} />
            <ul>{(o.items || []).map((it, i) => (
              <li key={i}>{it.name} ({it.size}) × {it.qty}</li>
            ))}</ul>
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${SHOP_LAT},${SHOP_LNG}&destination=${encodeURIComponent(destOf(o))}&travelmode=driving`}
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
    </div>
  );
};

export default App;
