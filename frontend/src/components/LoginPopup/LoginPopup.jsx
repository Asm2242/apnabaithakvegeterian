import { useContext, useState } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../Context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

// Simple email + password auth (login / sign up).
const LoginPopup = ({ setShowLogin }) => {
  const { setToken, url, loadCartData } = useContext(StoreContext);
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
        setShowLogin(false);
      } else {
        toast.error(res.data.message);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
    setBusy(false);
  };

  return (
    <div className="login-popup">
      <form onSubmit={submit} className="login-popup-container otp-only">
        <div className="login-popup-title">
          <div className="otp-brand">
            <img src={assets.baithakLogo} alt="Apna Baithak" />
            <h2>Apna Baithak</h2>
          </div>
          <img
            className="close"
            onClick={() => setShowLogin(false)}
            src={assets.cross_icon}
            alt="close"
          />
        </div>

        <div className="login-mode-toggle">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            Login
          </button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
            Sign Up
          </button>
        </div>

        <div className="login-popup-inputs">
          {mode === "register" && (
            <input
              name="name"
              value={data.name}
              onChange={onChange}
              type="text"
              placeholder="Your name"
              required
            />
          )}
          <input
            name="email"
            value={data.email}
            onChange={onChange}
            type="email"
            placeholder="Email address"
            required
          />
          <input
            name="password"
            value={data.password}
            onChange={onChange}
            type="password"
            placeholder={mode === "register" ? "Password (min 8 characters)" : "Password"}
            required
          />
        </div>

        <button disabled={busy}>
          {busy ? "Please wait…" : mode === "login" ? "Login" : "Create account"}
        </button>

        <p className="auth-switch">
          {mode === "login" ? (
            <>New here? <span onClick={() => setMode("register")}>Create an account</span></>
          ) : (
            <>Already have an account? <span onClick={() => setMode("login")}>Login</span></>
          )}
        </p>
      </form>
    </div>
  );
};

LoginPopup.propTypes = {
  setShowLogin: PropTypes.func.isRequired,
};

export default LoginPopup;