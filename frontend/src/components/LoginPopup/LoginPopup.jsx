import { useContext, useEffect, useRef, useState } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../Context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

// Email/password, phone OTP login and phone-OTP password reset.
const LoginPopup = ({ setShowLogin }) => {
  const { setToken, url, loadCartData } = useContext(StoreContext);
  const [mode, setMode] = useState("login"); // login | register | reset | otp
  const [resetStep, setResetStep] = useState(1); // 1 = phone, 2 = otp + new password
  const [otpStep, setOtpStep] = useState(1); // 1 = phone, 2 = otp
  const [data, setData] = useState({ name: "", email: "", password: "", phone: "", otp: "", newPassword: "" });
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [devOtp, setDevOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const otpRefs = useRef([]);

  const onChange = (e) => setData((d) => ({ ...d, [e.target.name]: e.target.value }));

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setShowLogin(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setShowLogin]);

  const switchMode = (next) => {
    setMode(next);
    setResetStep(1);
    setOtpStep(1);
    setOtpDigits(["", "", "", "", "", ""]);
    setDevOtp("");
  };

  const finishLogin = async (tok, name) => {
    setToken(tok);
    localStorage.setItem("token", tok);
    await loadCartData(tok);
    toast.success(`Welcome, ${name || "friend"}!`);
    setShowLogin(false);
  };

  const cleanPhone = (p) => String(p || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");

  const sendLoginOtp = async () => {
    const num = cleanPhone(data.phone);
    if (!/^[6-9]\d{9}$/.test(num)) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setBusy(true);
    try {
      const res = await axios.post(url + "/api/otp/start", { phone: num });
      if (res.data.success) {
        setData((d) => ({ ...d, phone: num }));
        setOtpStep(2);
        setDevOtp(res.data.devOtp || "");
        toast.success(res.data.devOtp ? "Demo OTP generated" : "OTP sent to your mobile");
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else toast.error(res.data.message);
    } catch {
      toast.error("OTP send nahi hua");
    }
    setBusy(false);
  };

  const onOtpDigit = (i, value) => {
    const digit = String(value || "").replace(/\D/g, "").slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[i] = digit;
      return next;
    });
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const verifyLoginOtp = async () => {
    const code = otpDigits.join("");
    if (!/^\d{6}$/.test(code)) {
      toast.error("6-digit OTP daalo");
      return;
    }
    setBusy(true);
    try {
      const res = await axios.post(url + "/api/otp/login", { phone: data.phone, otp: code });
      if (res.data.success) await finishLogin(res.data.token, res.data.name);
      else toast.error(res.data.message);
    } catch {
      toast.error("OTP verify nahi hua");
    }
    setBusy(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy || mode === "otp") return;
    setBusy(true);
    try {
      if (mode === "reset") {
        if (resetStep === 1) {
          const res = await axios.post(url + "/api/otp/start", { phone: data.phone });
          if (res.data.success) {
            setResetStep(2);
            toast.success(res.data.devOtp ? `Demo OTP: ${res.data.devOtp}` : "OTP sent to your mobile number");
          } else toast.error(res.data.message);
        } else {
          const res = await axios.post(url + "/api/user/forgot-password/reset", {
            phone: data.phone, otp: data.otp, newPassword: data.newPassword,
          });
          if (res.data.success) {
            toast.success(res.data.message);
            switchMode("login");
            setData((d) => ({ ...d, otp: "", newPassword: "" }));
          } else toast.error(res.data.message);
        }
        setBusy(false);
        return;
      }

      const res = await axios.post(
        url + (mode === "login" ? "/api/user/login" : "/api/user/register"),
        mode === "login" ? { email: data.email, password: data.password } : data
      );
      if (res.data.success) await finishLogin(res.data.token, res.data.name || data.name);
      else toast.error(res.data.message);
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
          <img className="close" onClick={() => setShowLogin(false)} src={assets.cross_icon} alt="close" />
        </div>

        <div className="login-mode-toggle">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>Login</button>
          <button type="button" className={mode === "otp" ? "active" : ""} onClick={() => switchMode("otp")}>📱 OTP</button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")}>Sign Up</button>
        </div>

        <div className="login-popup-inputs">
          {mode === "otp" ? (
            otpStep === 1 ? (
              <>
                <input name="phone" value={data.phone} onChange={(e) => setData((d) => ({ ...d, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} type="tel" inputMode="numeric" placeholder="Mobile number" required />
              </>
            ) : (
              <>
                <p className="otp-sent">OTP sent to +91 {data.phone}</p>
                {devOtp && <div className="dev-otp">Demo OTP: <b>{devOtp}</b></div>}
                <div className="otp-boxes">
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      value={digit}
                      onChange={(e) => onOtpDigit(i, e.target.value)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      aria-label={`OTP digit ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )
          ) : mode === "reset" ? (
            resetStep === 1 ? (
              <input name="phone" value={data.phone} onChange={onChange} type="tel" placeholder="Mobile number" required />
            ) : (
              <>
                <input name="otp" value={data.otp} onChange={onChange} type="text" inputMode="numeric" maxLength={6} placeholder="6-digit OTP" required />
                <input name="newPassword" value={data.newPassword} onChange={onChange} type="password" placeholder="New password (min 8 characters)" required />
              </>
            )
          ) : (
            <>
              {mode === "register" && <input name="name" value={data.name} onChange={onChange} type="text" placeholder="Your name" required />}
              <input name="email" value={data.email} onChange={onChange} type="email" placeholder="Email address" required />
              <input name="password" value={data.password} onChange={onChange} type="password" placeholder={mode === "register" ? "Password (min 8 characters)" : "Password"} required />
            </>
          )}
        </div>

        {mode === "otp" ? (
          otpStep === 1 ? (
            <button type="button" onClick={sendLoginOtp} disabled={busy}>{busy ? "Sending…" : "Send OTP →"}</button>
          ) : (
            <>
              <button type="button" onClick={verifyLoginOtp} disabled={busy}>{busy ? "Verifying…" : "Verify & Login →"}</button>
              <button type="button" className="auth-switch" onClick={() => { setOtpStep(1); setOtpDigits(["", "", "", "", "", ""]); setDevOtp(""); }}>Change number</button>
            </>
          )
        ) : (
          <button disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Login" : mode === "register" ? "Create account" : resetStep === 1 ? "Send OTP" : "Reset password"}
          </button>
        )}

        <p className="auth-switch">
          {mode === "login" ? (
            <>
              New here? <span onClick={() => switchMode("register")}>Create an account</span>
              <br />
              <span className="auth-forgot" onClick={() => switchMode("reset")}>Forgot password?</span>
            </>
          ) : mode === "register" ? (
            <>Already have an account? <span onClick={() => switchMode("login")}>Login</span></>
          ) : mode === "reset" ? (
            <span onClick={() => switchMode("login")}>Back to login</span>
          ) : (
            <span onClick={() => switchMode("login")}>Login with email instead</span>
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
