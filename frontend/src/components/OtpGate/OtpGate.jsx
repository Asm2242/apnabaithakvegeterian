import { useContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../Context/StoreContext";
import { assets } from "../../assets/assets";
import "./OtpGate.css";
import PropTypes from "prop-types";

// Warm welcome gate shown before the app on a fresh visit.
const OtpGate = ({ onDone }) => {
  const { url, setToken, loadCartData } = useContext(StoreContext);
  const [mode, setMode] = useState("login"); // login | register
  const [data, setData] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setData((d) => ({ ...d, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await axios.post(
        url + (mode === "login" ? "/api/user/login" : "/api/user/register"),
        data
      );
      if (res.data.success) {
        const tok = res.data.token;
        setToken(tok);
        localStorage.setItem("token", tok);
        await loadCartData(tok);
        toast.success(`Welcome${mode === "login" ? " back" : ""}, ${res.data.name || data.name}!`);
        onDone(true);
      } else {
        toast.error(res.data.message);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
    setBusy(false);
  };

  return (
    <div className="otp-gate">
      <div className="gate-orbs"><span /><span /><span /></div>
      <div className="gate-float gate-float-1">🍛</div>
      <div className="gate-float gate-float-2">🍲</div>
      <div className="gate-float gate-float-3">🫓</div>
      <div className="gate-float gate-float-4">🥘</div>

      <form onSubmit={submit} className="otp-gate-card">
        <div className="gate-brand">
          <div className="gate-logo-wrap"><img src={assets.baithakLogo} alt="Apna Baithak" /></div>
          <div>
            <p className="otp-gate-logo">Apna Baithak</p>
            <p className="otp-gate-sub">Pure Veg • Eldeco City, Lucknow</p>
          </div>
        </div>

        <div className="gate-welcome">
          <span>✨</span> Fresh. Hot. Home-style. <span>✨</span>
        </div>

        <div className="otp-gate-mode">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            Login
          </button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
            Sign Up
          </button>
        </div>

        <div className="gate-fields">
          {mode === "register" && (
            <label className="gate-field">
              <span>👤</span>
              <input className="otp-gate-input" name="name" value={data.name} onChange={onChange} type="text" placeholder="Your name" required />
            </label>
          )}
          <label className="gate-field">
            <span>✉️</span>
            <input className="otp-gate-input" name="email" value={data.email} onChange={onChange} type="email" placeholder="Email address" required />
          </label>
          <label className="gate-field">
            <span>🔒</span>
            <input className="otp-gate-input" name="password" value={data.password} onChange={onChange} type="password" placeholder={mode === "register" ? "Password (min 8 characters)" : "Password"} required />
          </label>
        </div>

        <button disabled={busy} className="otp-gate-btn">
          {busy ? "Please wait…" : mode === "login" ? "Login to continue →" : "Create my account →"}
        </button>
        <button type="button" onClick={() => onDone(false)} className="otp-gate-link">
          Skip for now — just browsing
        </button>
        <p className="gate-footnote">🔒 Your data stays safe with us</p>
      </form>
    </div>
  );
};

OtpGate.propTypes = {
  onDone: PropTypes.func.isRequired,
};

export default OtpGate;
