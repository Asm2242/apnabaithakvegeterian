import axios from "axios";
import { useEffect, useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const FLOW = ["PLACED", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

const api = (token) => axios.create({ baseURL: API, headers: { token } });

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const res = await axios.post(API + "/api/user/login", { email, password });
      if (res.data.success && res.data.role === "admin") {
        onLogin(res.data.token, res.data.name);
      } else if (res.data.success) {
        setErr("This account is not an admin");
      } else setErr(res.data.message);
    } catch {
      setErr("Login failed");
    }
  };
  return (
    <div className="login-wrap">
      <form onSubmit={submit} className="card login-card">
        <h1>Apna Baithak <span>Admin</span></h1>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin email" type="email" required />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required />
        {err && <p className="err">{err}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

function Orders({ token }) {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [filter, setFilter] = useState("all");
  const load = async () => {
    const [o, r] = await Promise.all([
      api(token).get("/api/order/list"),
      api(token).get("/api/rider/list"),
    ]);
    if (o.data.success) setOrders(o.data.data);
    if (r.data.success) setRiders(r.data.data);
  };
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);
  const setStatus = async (orderId, status, riderId) => {
    await api(token).post("/api/order/status", { orderId, status, riderId });
    load();
  };
  const shown = orders.filter((o) => filter === "all" || o.status === filter);
  return (
    <div>
      <div className="filters">
        {["all", ...FLOW].map((s) => (
          <button key={s} className={filter === s ? "active" : ""} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>
      {shown.map((o) => (
        <div key={o._id} className="card order-card">
          <div className="order-head">
            <b>₹{o.amount}</b>
            <span className="badge">{o.status}</span>
            <span className={`badge ${o.paymentStatus === "PAID" ? "green" : o.paymentStatus === "COD" ? "brown" : "red"}`}>
              {o.paymentMethod?.toUpperCase()} • {o.paymentStatus}
            </span>
            <span>{o.mode}</span>
          </div>
          <p>{o.customerName} • {o.phone}</p>
          <ul>{(o.items || []).map((it, i) => (
            <li key={i}>{it.name} ({it.size}) × {it.qty} — ₹{it.price * it.qty}</li>
          ))}</ul>
          <div className="row">
            <select
              value={o.status}
              onChange={(e) => setStatus(o._id, e.target.value, o.riderId || undefined)}
            >
              {FLOW.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={o.riderId || ""}
              onChange={(e) => setStatus(o._id, o.status, e.target.value || undefined)}
            >
              <option value="">No rider</option>
              {riders.map((r) => <option key={r._id} value={r._id}>{r.name} ({r.phone || "no phone"})</option>)}
            </select>
          </div>
        </div>
      ))}
      {shown.length === 0 && <p>No orders.</p>}
    </div>
  );
}

function Foods({ token, imgBase }) {
  const foodImg = (image) => {
    if (!image) return "";
    if (/^https?:\/\//.test(image)) return image;
    return imgBase + "/images/" + image;
  };
  const [foods, setFoods] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", price: "", halfPrice: "", fullPrice: "", category: "Snacks", isPizza: false, bestSeller: false });
  const [file, setFile] = useState(null);
  const [editing, setEditing] = useState(null);
  const load = async () => {
    const res = await axios.get(API + "/api/food/list");
    if (res.data.success) setFoods(res.data.data);
  };
  useEffect(() => { load(); }, []);
  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append("image", file);
    if (editing) {
      fd.append("id", editing);
      await api(token).post("/api/food/update", fd);
    } else {
      if (!file) { alert("Photo required for new dish"); return; }
      await api(token).post("/api/food/add", fd);
    }
    setForm({ name: "", description: "", price: "", halfPrice: "", fullPrice: "", category: "Snacks", isPizza: false, bestSeller: false });
    setFile(null);
    setEditing(null);
    load();
  };
  const startEdit = (f) => {
    setEditing(f._id);
    setForm({
      name: f.name, description: f.description, price: f.price,
      halfPrice: f.halfPrice ?? "", fullPrice: f.fullPrice ?? "",
      category: f.category, isPizza: !!f.isPizza, bestSeller: !!f.bestSeller,
    });
    window.scrollTo(0, 0);
  };
  const toggleAvail = async (f) => {
    await api(token).post("/api/food/update", { id: f._id, available: !f.available });
    load();
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this dish?")) return;
    await api(token).post("/api/food/remove", { id });
    load();
  };
  const set = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };
  return (
    <div>
      <form onSubmit={submit} className="card">
        <h3>{editing ? "Edit dish" : "Add dish"}</h3>
        <div className="grid">
          <input value={form.name} onChange={set("name")} placeholder="Name" required />
          <input value={form.category} onChange={set("category")} placeholder="Category" required />
          <input value={form.price} onChange={set("price")} placeholder="Price ₹ (Half/Small)" type="number" required />
          <input value={form.halfPrice} onChange={set("halfPrice")} placeholder="Half ₹ / Small ₹" type="number" />
          <input value={form.fullPrice} onChange={set("fullPrice")} placeholder="Full ₹ / Regular ₹" type="number" />
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        </div>
        <input value={form.description} onChange={set("description")} placeholder="Description" />
        <label><input type="checkbox" checked={form.isPizza} onChange={set("isPizza")} /> Pizza (Small/Regular labels)</label>
        <label><input type="checkbox" checked={form.bestSeller} onChange={set("bestSeller")} /> Bestseller</label>
        <div className="row">
          <button type="submit">{editing ? "Save" : "Add dish"}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: "", description: "", price: "", halfPrice: "", fullPrice: "", category: "Snacks", isPizza: false, bestSeller: false }); }}>Cancel</button>}
        </div>
      </form>
      {foods.map((f) => (
        <div key={f._id} className="card food-row">
          <img src={foodImg(f.image)} alt="" />
          <div>
            <b>{f.name}</b> <span>({f.category})</span>
            <p>₹{f.price}{f.halfPrice != null ? ` • Half ₹${f.halfPrice} / Full ₹${f.fullPrice}` : ""} {f.available ? "" : "• SOLD OUT"}</p>
          </div>
          <div className="row">
            <button onClick={() => startEdit(f)}>Edit</button>
            <button onClick={() => toggleAvail(f)}>{f.available ? "Hide" : "Show"}</button>
            <button onClick={() => remove(f._id)} className="danger">Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Riders({ token }) {
  const [riders, setRiders] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", vehicle: "Bike" });
  const load = async () => {
    const res = await api(token).get("/api/rider/list");
    if (res.data.success) setRiders(res.data.data);
  };
  useEffect(() => { load(); }, []);
  const create = async (e) => {
    e.preventDefault();
    const res = await api(token).post("/api/rider/create", form);
    alert(res.data.message);
    if (res.data.success) {
      setForm({ name: "", email: "", password: "", phone: "", vehicle: "Bike" });
      load();
    }
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div>
      <form onSubmit={create} className="card">
        <h3>Add rider</h3>
        <div className="grid">
          <input value={form.name} onChange={set("name")} placeholder="Name" required />
          <input value={form.email} onChange={set("email")} placeholder="Email" type="email" required />
          <input value={form.password} onChange={set("password")} placeholder="Password" type="password" required />
          <input value={form.phone} onChange={set("phone")} placeholder="10-digit mobile" />
          <input value={form.vehicle} onChange={set("vehicle")} placeholder="Vehicle" />
        </div>
        <button type="submit">Create rider</button>
      </form>
      {riders.map((r) => (
        <div key={r._id} className="card">
          <b>{r.name}</b> • {r.email} • {r.phone || "no phone"} • {r.profile?.vehicle} •{" "}
          {r.profile?.onDuty ? "On duty" : "Off duty"} • {r.profile?.totalDeliveries || 0} deliveries
        </div>
      ))}
    </div>
  );
}

function Customers({ token }) {
  const [list, setList] = useState([]);
  const load = async () => {
    const res = await api(token).get("/api/admin/customers");
    if (res.data.success) setList(res.data.data);
  };
  useEffect(() => { load(); }, []);
  const toggle = async (id, active) => {
    await api(token).post("/api/admin/customer/active", { id, active: !active });
    load();
  };
  return (
    <div>
      {list.map((c) => (
        <div key={c._id} className="card food-row">
          <div>
            <b>{c.name}</b> • {c.email} • {c.phone || "no phone"}{" "}
            {c.phoneVerified ? "✓ verified" : "• not verified"} {!c.active && "• DISABLED"}
          </div>
          <button onClick={() => toggle(c._id, c.active)}>{c.active ? "Disable" : "Enable"}</button>
        </div>
      ))}
      {list.length === 0 && <p>No customers yet.</p>}
    </div>
  );
}

function Coupons({ token }) {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ code: "", description: "", type: "flat", value: "", minOrder: 0, maxDiscount: "", firstOrderOnly: false });
  const load = async () => {
    const res = await api(token).get("/api/coupon/admin/all");
    if (res.data.success) setList(res.data.data);
  };
  useEffect(() => { load(); }, []);
  const save = async (e) => {
    e.preventDefault();
    const res = await api(token).post("/api/coupon/admin/save", form);
    if (res.data.success) {
      setForm({ code: "", description: "", type: "flat", value: "", minOrder: 0, maxDiscount: "", firstOrderOnly: false });
      load();
    } else alert(res.data.message);
  };
  const toggle = async (id, active) => {
    await api(token).post("/api/coupon/admin/toggle", { id, active: !active });
    load();
  };
  const set = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };
  return (
    <div>
      <form onSubmit={save} className="card">
        <h3>New coupon</h3>
        <div className="grid">
          <input value={form.code} onChange={set("code")} placeholder="CODE (e.g. DIWALI100)" required />
          <input value={form.value} onChange={set("value")} placeholder="Value (Rs or %)" type="number" required />
          <input value={form.minOrder} onChange={set("minOrder")} placeholder="Min order Rs" type="number" />
          <input value={form.maxDiscount} onChange={set("maxDiscount")} placeholder="Max discount Rs (for %)" type="number" />
        </div>
        <input value={form.description} onChange={set("description")} placeholder="Description" />
        <label><input type="checkbox" checked={form.type === "percent"} onChange={(e) => setForm((f) => ({ ...f, type: e.target.checked ? "percent" : "flat" }))} /> Percent (else flat Rs)</label>
        <label><input type="checkbox" checked={form.firstOrderOnly} onChange={set("firstOrderOnly")} /> First order only</label>
        <div className="row"><button type="submit">Save coupon</button></div>
      </form>
      {list.map((c) => (
        <div key={c._id} className="card food-row">
          <div>
            <b>{c.code}</b> • {c.type === "flat" ? `Rs.${c.value} off` : `${c.value}% off`} • min Rs.{c.minOrder}
            {c.firstOrderOnly ? " • first order" : ""} {c.active ? "" : "• OFF"}
            <br /><small>{c.description}</small>
          </div>
          <button onClick={() => toggle(c._id, c.active)}>{c.active ? "Disable" : "Enable"}</button>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("ab_admin_token") || "");
  const [tab, setTab] = useState("orders");
  const login = (tok) => {
    setToken(tok);
    localStorage.setItem("ab_admin_token", tok);
  };
  const logout = () => {
    setToken("");
    localStorage.removeItem("ab_admin_token");
  };
  if (!token) return <Login onLogin={login} />;
  return (
    <div className="admin">
      <header>
        <b>Apna Baithak Admin</b>
        <nav>
          {["orders", "foods", "riders", "customers", "coupons"].map((t) => (
            <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}</button>
          ))}
          <button onClick={logout}>Logout</button>
        </nav>
      </header>
      <main>
        {tab === "orders" && <Orders token={token} />}
        {tab === "foods" && <Foods token={token} imgBase={API} />}
        {tab === "riders" && <Riders token={token} />}
        {tab === "customers" && <Customers token={token} />}
        {tab === "coupons" && <Coupons token={token} />}
      </main>
    </div>
  );
}

export default App;
