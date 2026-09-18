import { useContext, useState } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../Context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

const LoginPopup = ({ setShowLogin }) => {
  const { setToken, url, loadCartData } = useContext(StoreContext);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const phoneValid = /^[6-9]\d{9}$/.test(phone);

  const startCooldown = (s) => {
    setCooldown(s);
    const t = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(t);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    if (!phoneValid || busy || cooldown > 0) return;
    setBusy(true);
    try {
      const res = await axios.post(url + "/api/otp/start", { phone });
      if (res.data.success) {
        setSent(true);
        startCooldown(res.data.resendAfter || 30);
        toast.success("OTP sent to +91 " + phone);
      } else toast.error(res.data.message);
    } catch {
      toast.error("Could not send OTP");
    }
    setBusy(false);
  };

  const verify = async (e) => {
    e.preventDefault();
    if (code.length !== 6 || busy) return;
    setBusy(true);
    try {
      const res = await axios.post(url + "/api/otp/login", {
        phone,
        otp: code,
        name,
      });
      if (res.data.success) {
        setToken(res.data.token);
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("ab_phone", phone);
        localStorage.setItem("ab_phone_verified", "1");
        await loadCartData(res.data.token);
        toast.success("Welcome to Apna Baithak!");
        setShowLogin(false);
      } else toast.error(res.data.message);
    } catch {
      toast.error("Verification failed");
    }
    setBusy(false);
  };

  const moveBox = (i, d) => {
    const next = document.getElementById(`login-otp-${i + d}`);
    if (next) next.focus();
  };

  return (
    <div className="login-popup">
      <form onSubmit={verify} className="login-popup-container otp-only">
        <div className="login-popup-title">
          <div className="otp-brand">
            <img src={assets.baithakLogo} alt="Apna Baithak" />
            <h2>Welcome to Apna Baithak</h2>
          </div>
          <img
            className="close"
            onClick={() => setShowLogin(false)}
            src={assets.cross_icon}
            alt="close"
          />
        </div>
        <p className="otp-tagline">Login with your mobile number</p>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="text"
          placeholder="Your name (optional)"
          className="otp-input"
        />
        <div className="phone-row">
          <span>+91</span>
          <input
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
              setSent(false);
              setCode("");
            }}
            type="tel"
            placeholder="10-digit mobile number"
            inputMode="numeric"
          />
        </div>

        {!sent ? (
          <button type="button" disabled={!phoneValid || busy} onClick={sendOtp}>
            {busy ? "Sending…" : "Send OTP"}
          </button>
        ) : (
          <>
            <div className="otp-boxes">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <input
                  key={i}
                  id={`login-otp-${i}`}
                  value={code[i] || ""}
                  inputMode="numeric"
                  maxLength={1}
                  onChange={(e) => {
                    const d = e.target.value.replace(/\D/g, "").slice(-1);
                    const next = (code + "      ").split("");
                    next[i] = d;
                    setCode(next.join("").trim());
                    if (d) moveBox(i, 1);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !code[i]) moveBox(i, -1);
                  }}
                />
              ))}
            </div>
            <button disabled={code.length !== 6 || busy}>
              {busy ? "Verifying…" : "Verify & Login"}
            </button>
            <p className="resend">
              {cooldown > 0 ? (
                `Resend OTP in ${cooldown}s`
              ) : (
                <>Didn&apos;t get it? <span onClick={sendOtp}>Resend</span></>
              )}
            </p>
          </>
        )}
      </form>
    </div>
  );
};

LoginPopup.propTypes = {
  setShowLogin: PropTypes.func.isRequired,
};

export default LoginPopup;
