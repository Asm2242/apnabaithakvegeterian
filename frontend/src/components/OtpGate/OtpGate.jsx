import { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../Context/StoreContext";
import { assets } from "../../assets/assets";
import "./OtpGate.css";
import PropTypes from "prop-types";

// Welcome gate: email/password or phone OTP login.
const OtpGate = ({ onDone }) => {
  const { url, setToken, loadCartData } = useContext(StoreContext);
  const [mode, setMode] = useState("login"); // login | register | phone
  const [data, setData] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  // OTP flow
  const [otpStep, setOtpStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [devOtp, setDevOtp] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const onChange = (e) => setData((d) => ({ ...d, [e.target.name]: e.target.value }));

  const finishLogin = async (tok, name) => {
    setToken(tok);
    localStorage.setItem("token", tok);
    await loadCartData(tok);
    toast.success(`Welcome${mode === "register" ? "" : " back"}, ${name || "friend"}!`);
    onDone(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await axios.post(
        url + (mode === "login" ? "/api/user/login" : "/api/user/register"),
        data
      );
      if (res.data.success) await finishLogin(res.data.token, res.data.name || data.name);
      else toast.error(res.data.message);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
    setBusy(false);
  };

  const cleanPhone = (p) => String(p || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");

  const sendOtp = async () => {
    const num = cleanPhone(phone);
    if (!/^[6-9]\d{9}$/.test(num)) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setBusy(true);
    try {
      const res = await axios.post(url + "/api/otp/start", { phone: num });
      if (res.data.success) {
        setPhone(num);
        setOtpStep(2);
        setResendIn(30);
        setDevOtp(res.data.devOtp || "");
        toast.success(res.data.devOtp ? "Demo OTP generated — dekhne ke liye neeche dekho" : "OTP sent to your mobile");
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else toast.error(res.data.message);
    } catch {
      toast.error("OTP send nahi hua");
    }
    setBusy(false);
  };

  const onOtpChange = (i, value) => {
    const digit = String(value || "").replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[i] = digit;
      return next;
    });
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const verifyOtp = async () => {
    const code = otp.join("");
    if (!/^\d{6}$/.test(code)) {
      toast.error("6-digit OTP daalo");
      return;
    }
    setBusy(true);
    try {
      const res = await axios.post(url + "/api/otp/login", { phone, otp: code, name: data.name || undefined });
      if (res.data.success) await finishLogin(res.data.token, res.data.name);
      else toast.error(res.data.message);
    } catch {
      toast.error("OTP verify nahi hua");
    }
    setBusy(false);
  };

  const goMode = (m) => {
    setMode(m);
    setOtpStep(1);
    setOtp(["", "", "", "", "", ""]);
    setDevOtp("");
    setResendIn(0);
  };

  return (
    <div className="otp-gate">
      <div className="gate-orbs"><span /><span /><span /></div>
      <div className="gate-float gate-float-1">🍛</div>
      <div className="gate-float gate-float-2">🍲</div>
      <div className="gate-float gate-float-3">🫓</div>
      <div className="gate-float gate-float-4">🥘</div>

      <form onSubmit={mode === "phone" ? (e) => e.preventDefault() : submit} className="otp-gate-card">
        <div className="gate-brand">
          <div className="gate-logo-wrap"><img src={assets.baithakLogo} alt="Apna Baithak" /></div>
          <div>
            <p className="otp-gate-logo">Apna Baithak</p>
            <p className="otp-gate-sub">Pure Veg • Eldeco City, Lucknow</p>
          </div>
        </div>

        <div className="gate-welcome"><span>✨</span> Fresh. Hot. Home-style. <span>✨</span></div>

        <div className="otp-gate-mode">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => goMode("login")}>Login</button>
          <button type="button" className={mode === "phone" ? "active" : ""} onClick={() => goMode("phone")}>📱 OTP</button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => goMode("register")}>Sign Up</button>
        </div>

        {mode === "phone" ? (
          <div className="gate-fields">
            {otpStep === 1 ? (
              <>
                <label className="gate-field">
                  <span>📱</span>
                  <input
                    className="otp-gate-input"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    required
                  />
                </label>
                <button type="button" className="otp-gate-btn" onClick={sendOtp} disabled={busy}>
                  {busy ? "Sending…" : "Send OTP →"}
                </button>
              </>
            ) : (
              <>
                <p className="otp-sent">OTP sent to +91 {phone}</p>
                {devOtp && <div className="dev-otp">Demo OTP: <b>{devOtp}</b></div>}
                <div className="otp-boxes">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      value={digit}
                      onChange={(e) => onOtpChange(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      aria-label={`OTP digit ${i + 1}`}
                    />
                  ))}
                </div>
                <button type="button" className="otp-gate-btn" onClick={verifyOtp} disabled={busy}>
                  {busy ? "Verifying…" : "Verify & Login →"}
                </button>
                <button
                  type="button"
                  className="otp-gate-link"
                  disabled={resendIn > 0 || busy}
                  onClick={() => { setOtpStep(1); setOtp(["", "", "", "", "", ""]); setDevOtp(""); }}
                >
                  {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Change number / Resend"}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="gate-fields">
            {mode === "register" && (
              <label className="gate-field"><span>👤</span><input className="otp-gate-input" name="name" value={data.name} onChange={onChange} type="text" placeholder="Your name" required /></label>
            )}
            <label className="gate-field"><span>✉️</span><input className="otp-gate-input" name="email" value={data.email} onChange={onChange} type="email" placeholder="Email address" required /></label>
            <label className="gate-field"><span>🔒</span><input className="otp-gate-input" name="password" value={data.password} onChange={onChange} type="password" placeholder={mode === "register" ? "Password (min 8 characters)" : "Password"} required /></label>
          </div>
        )}

        {mode !== "phone" && (
          <button disabled={busy} className="otp-gate-btn" type="submit">
            {busy ? "Please wait…" : mode === "login" ? "Login to continue →" : "Create my account →"}
          </button>
        )}
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
