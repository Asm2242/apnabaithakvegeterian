import axios from "axios";
import { useEffect, useRef, useState } from "react";
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

function Requests({ token }) {
  const [list, setList] = useState([]);
  const [note, setNote] = useState({});
  const load = async () => {
    const res = await api(token).get("/api/order/requests");
    if (res.data.success) setList(res.data.data);
  };
  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);
  const resolve = async (id, action) => {
    await api(token).post("/api/order/request/resolve", {
      id,
      action,
      adminNote: note[id] || ""
    });
    load();
  };
  const pending = list.filter((r) => r.status === "pending");
  const done = list.filter((r) => r.status !== "pending");
  return (
    <div>
      <h3>Pending ({pending.length})</h3>
      {pending.map((r) => (
        <div key={r._id} className="card">
          <b>{r.type.replace(/_/g, " ").toUpperCase()}</b> • order ₹{r.order?.[0]?.amount} • {r.order?.[0]?.customerName} {r.order?.[0]?.phone}
          <p>{r.details || "(no details)"}</p>
          <input
            placeholder="Reply note (optional)"
            value={note[r._id] || ""}
            onChange={(e) => setNote((n) => ({ ...n, [r._id]: e.target.value }))}
          />
          <div className="row">
            <button onClick={() => resolve(r._id, "resolved")}>✓ Accept</button>
            <button onClick={() => resolve(r._id, "rejected")} className="danger">✕ Reject</button>
          </div>
        </div>
      ))}
      {pending.length === 0 && <p>No pending requests. 👍</p>}
      <h3>Done ({done.length})</h3>
      {done.slice(0, 30).map((r) => (
        <div key={r._id} className="card">
          <b>{r.type.replace(/_/g, " ")}</b> • {r.status} • {r.order?.[0]?.customerName}
          {r.adminNote ? <p>Reply: {r.adminNote}</p> : null}
        </div>
      ))}
    </div>
  );
}

function Chat({ token }) {
  const [msgs, setMsgs] = useState([
    { from: "bot", text: "Namaste! 🙏 Main Apna Baithak helper hun. Neeche button dabao ya likho — jaise 'advance all', 'report', 'chai hide karo'." }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const [pending, setPending] = useState(null); // { bundleId, suggestions:[{file, options}] }
  const [mapping, setMapping] = useState({});
  const [dishes, setDishes] = useState([]);
  const bottom = useRef(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput("");
    setMsgs((m) => [...m, { from: "me", text: msg }]);
    setBusy(true);
    try {
      const res = await api(token).post("/api/admin/bot", { message: msg });
      setMsgs((m) => [...m, { from: "bot", text: res.data.reply || res.data.message }]);
    } catch {
      setMsgs((m) => [...m, { from: "bot", text: "Bot error. Phir try karo." }]);
    }
    setBusy(false);
  };

  const uploadZip = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setZipBusy(true);
    setPending(null);
    setMapping({});
    setMsgs((m) => [...m, { from: "me", text: `📦 ${file.name} upload kar raha hun…` }]);
    try {
      const fd = new FormData();
      fd.append("zip", file);
      const res = await api(token).post("/api/food/bulk-photos", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000
      });
      const d = res.data;
      let text = d.message || "Done";
      setMsgs((m) => [...m, { from: "bot", text }]);
      if (d.suggestions?.length) {
        setPending({ bundleId: d.bundleId, suggestions: d.suggestions });
        if (dishes.length === 0) {
          const foods = await axios.get(API + "/api/food/list");
          if (foods.data.success) setDishes(foods.data.data);
        }
      } else if (d.unmatched?.length) {
        setMsgs((m) => [...m, { from: "bot", text: `❌ Match nahi hui: ` + d.unmatched.slice(0, 10).join(", ") }]);
      }
    } catch {
      setMsgs((m) => [...m, { from: "bot", text: "Zip upload fail. 50MB se chhota .zip bhejo." }]);
    }
    setZipBusy(false);
    e.target.value = "";
  };

  const confirmMapping = async () => {
    const map = {};
    for (const s of pending.suggestions) {
      if (mapping[s.file]) map[s.file] = mapping[s.file];
    }
    if (Object.keys(map).length === 0) {
      setMsgs((m) => [...m, { from: "bot", text: "Koi dish select nahi ki. Dropdown se chuno." }]);
      return;
    }
    setZipBusy(true);
    try {
      const res = await api(token).post("/api/food/bulk-confirm", {
        bundleId: pending.bundleId,
        mapping: map
      });
      setMsgs((m) => [...m, { from: "bot", text: res.data.message || "Done" }]);
      setPending(null);
      setMapping({});
    } catch {
      setMsgs((m) => [...m, { from: "bot", text: "Confirm fail. Zip dobara bhejo." }]);
    }
    setZipBusy(false);
  };

  return (
    <div className="chat">
      <div className="chat-msgs">
        {msgs.map((m, i) => (
          <div key={i} className={m.from === "me" ? "msg me" : "msg bot"}>{m.text}</div>
        ))}
        {pending && (
          <div className="msg bot suggest-box">
            <b>🤔 Spelling mismatch? Sahi dish chuno:</b>
            {pending.suggestions.map((s) => (
              <div key={s.file} className="suggest-row">
                <span className="suggest-file">{s.file}</span>
                <select
                  value={mapping[s.file] || ""}
                  onChange={(e) => setMapping((mp) => ({ ...mp, [s.file]: e.target.value }))}
                >
                  <option value="">— chhodo —</option>
                  {s.options.map((o) => (
                    <option key={o.id} value={o.id}>{o.name} ({Math.round(o.score * 100)}%)</option>
                  ))}
                  {dishes
                    .filter((d) => !s.options.some((o) => o.id === String(d._id)))
                    .map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                </select>
              </div>
            ))}
            <button className="confirm-btn" onClick={confirmMapping} disabled={zipBusy}>
              {zipBusy ? "Lag rahi hain…" : "✅ Accept & lagao"}
            </button>
          </div>
        )}
        <div ref={bottom} />
      </div>
      <div className="chat-quick">
        {["report", "advance all", "assign riders", "help"].map((q) => (
          <button key={q} onClick={() => send(q)} disabled={busy}>{q}</button>
        ))}
        <label className="zip-btn">
          {zipBusy ? "Uploading…" : "📦 photos.zip"}
          <input type="file" accept=".zip" hidden onChange={uploadZip} disabled={zipBusy} />
        </label>
      </div>
      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Likho… jaise 'samosa hide karo'"
        />
        <button type="submit" disabled={busy}>➤</button>
      </form>
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
          {["orders", "requests", "foods", "riders", "customers", "coupons", "chat"].map((t) => (
            <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t === "chat" ? "🤖 chat" : t}</button>
          ))}
          <button onClick={logout}>Logout</button>
        </nav>
      </header>
      <main>
        {tab === "orders" && <Orders token={token} />}
        {tab === "requests" && <Requests token={token} />}
        {tab === "foods" && <Foods token={token} imgBase={API} />}
        {tab === "riders" && <Riders token={token} />}
        {tab === "customers" && <Customers token={token} />}
        {tab === "coupons" && <Coupons token={token} />}
        {tab === "chat" && <Chat token={token} />}
      </main>
    </div>
  );
}

export default App;
