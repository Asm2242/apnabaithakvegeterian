import { useContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../Context/StoreContext";
import "./OtpGate.css";
import PropTypes from "prop-types";

// Simple email + password gate (no SMS OTP for now).
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
      <form onSubmit={submit} className="otp-gate-card">
        <p className="otp-gate-logo">Apna Baithak</p>
        <p className="otp-gate-sub">Pure Veg • Eldeco City, Lucknow</p>

        <div className="otp-gate-mode">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            Login
          </button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
            Sign Up
          </button>
        </div>

        {mode === "register" && (
          <input
            className="otp-gate-input"
            name="name"
            value={data.name}
            onChange={onChange}
            type="text"
            placeholder="Your name"
            required
          />
        )}
        <input
          className="otp-gate-input"
          name="email"
          value={data.email}
          onChange={onChange}
          type="email"
          placeholder="Email address"
          required
        />
        <input
          className="otp-gate-input"
          name="password"
          value={data.password}
          onChange={onChange}
          type="password"
          placeholder={mode === "register" ? "Password (min 8 characters)" : "Password"}
          required
        />

        <button disabled={busy} className="otp-gate-btn">
          {busy ? "Please wait…" : mode === "login" ? "Login" : "Create account"}
        </button>
        <button type="button" onClick={() => onDone(false)} className="otp-gate-link">
          Skip for now
        </button>
      </form>
    </div>
  );
};

OtpGate.propTypes = {
  onDone: PropTypes.func.isRequired,
};

export default OtpGate;