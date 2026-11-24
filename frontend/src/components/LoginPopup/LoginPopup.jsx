import { useContext, useEffect, useState } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../Context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

// Email + password auth (login / sign up) and phone-OTP password reset.
const LoginPopup = ({ setShowLogin }) => {
  const { setToken, url, loadCartData } = useContext(StoreContext);
  const [mode, setMode] = useState("login"); // login | register | reset
  const [resetStep, setResetStep] = useState(1); // 1 = phone, 2 = otp + new password
  const [data, setData] = useState({ name: "", email: "", password: "", phone: "", otp: "", newPassword: "" });
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setData((d) => ({ ...d, [e.target.name]: e.target.value }));

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setShowLogin(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setShowLogin]);

  const switchMode = (next) => {
    setMode(next);
    setResetStep(1);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "reset") {
        if (resetStep === 1) {
          const res = await axios.post(url + "/api/otp/start", { phone: data.phone });
          if (res.data.success) {
            setResetStep(2);
            toast.success("OTP sent to your mobile number");
            if (res.data.devOtp) toast.info(`Dev OTP: ${res.data.devOtp}`);
          } else {
            toast.error(res.data.message);
          }
        } else {
          const res = await axios.post(url + "/api/user/forgot-password/reset", {
            phone: data.phone,
            otp: data.otp,
            newPassword: data.newPassword,
          });
          if (res.data.success) {
            toast.success(res.data.message);
            switchMode("login");
            setData((d) => ({ ...d, otp: "", newPassword: "" }));
          } else {
            toast.error(res.data.message);
          }
        }
        setBusy(false);
        return;
      }

      const res = await axios.post(
        url + (mode === "login" ? "/api/user/login" : "/api/user/register"),
        mode === "login" ? { email: data.email, password: data.password } : data
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
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>
            Login
          </button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")}>
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

          {mode === "reset" ? (
            resetStep === 1 ? (
              <div className="phone-row">
                <span>+91</span>
                <input
                  name="phone"
                  value={data.phone}
                  onChange={onChange}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  required
                />
              </div>
            ) : (
              <>
                <input
                  name="otp"
                  value={data.otp}
                  onChange={onChange}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit OTP"
                  required
                />
                <input
                  name="newPassword"
                  value={data.newPassword}
                  onChange={onChange}
                  type="password"
                  placeholder="New password (min 8 characters)"
                  minLength={8}
                  required
                />
              </>
            )
          ) : (
            <>
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
            </>
          )}
        </div>

        <button disabled={busy}>
          {busy
            ? "Please wait…"
            : mode === "login"
              ? "Login"
              : mode === "register"
                ? "Create account"
                : resetStep === 1
                  ? "Send OTP"
                  : "Reset password"}
        </button>

        <p className="auth-switch">
          {mode === "login" ? (
            <>
              New here? <span onClick={() => switchMode("register")}>Create an account</span>
              <br />
              <span className="auth-forgot" onClick={() => switchMode("reset")}>Forgot password?</span>
            </>
          ) : mode === "register" ? (
            <>Already have an account? <span onClick={() => switchMode("login")}>Login</span></>
          ) : (
            <span onClick={() => switchMode("login")}>Back to login</span>
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
