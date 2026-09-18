import { useContext, useState } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../Context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

// Step 1: enter number only.
// Step 2a returning customer: "Welcome back, NAME!" + OTP.
// Step 2b new customer: "ENTER YOUR NAME" + OTP.
const LoginPopup = ({ setShowLogin }) => {
  const { setToken, url, loadCartData } = useContext(StoreContext);
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [knownName, setKnownName] = useState("");
  const [code, setCode] = useState("");
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

  const goStep2 = async () => {
    if (!phoneValid || busy) return;
    setBusy(true);
    try {
      // who is this number? (returning name or new customer)
      const check = await axios.post(url + "/api/otp/check", { phone });
      if (check.data.success && check.data.exists) {
        setKnownName(check.data.name || "");
      } else {
        setKnownName("");
      }
      // send OTP in the same step
      const res = await axios.post(url + "/api/otp/start", { phone });
      if (res.data.success) {
        setStep(2);
        startCooldown(res.data.resendAfter || 30);
        toast.success("OTP sent to +91 " + phone);
      } else toast.error(res.data.message);
    } catch {
      toast.error("Could not continue");
    }
    setBusy(false);
  };

  const resend = async () => {
    if (cooldown > 0 || busy) return;
    setBusy(true);
    try {
      const res = await axios.post(url + "/api/otp/start", { phone });
      if (res.data.success) {
        startCooldown(res.data.resendAfter || 30);
        toast.success("OTP resent");
      } else toast.error(res.data.message);
    } catch {
      toast.error("Could not resend OTP");
    }
    setBusy(false);
  };

  const verify = async (e) => {
    e.preventDefault();
    if (code.length !== 6 || busy) return;
    if (!knownName && !name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setBusy(true);
    try {
      const res = await axios.post(url + "/api/otp/login", {
        phone,
        otp: code,
        name: knownName || name,
      });
      if (res.data.success) {
        setToken(res.data.token);
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("ab_phone", phone);
        localStorage.setItem("ab_phone_verified", "1");
        await loadCartData(res.data.token);
        toast.success(`Welcome${knownName ? " back" : ""}, ${res.data.name}!`);
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
      <form onSubmit={step === 1 ? (e) => { e.preventDefault(); goStep2(); } : verify} className="login-popup-container otp-only">
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

        {step === 1 ? (
          <>
            <p className="otp-tagline">Enter your number to continue</p>
            <div className="phone-row">
              <span>+91</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                type="tel"
                placeholder="10-digit mobile number"
                inputMode="numeric"
                autoFocus
              />
            </div>
            <button disabled={!phoneValid || busy}>
              {busy ? "Please wait…" : "Continue"}
            </button>
          </>
        ) : (
          <>
            {knownName ? (
              <p className="welcome-back">Welcome back, <b>{knownName}</b>! 👋</p>
            ) : (
              <>
                <p className="welcome-new">New customer? <b>ENTER YOUR NAME</b></p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  placeholder="YOUR NAME"
                  className="otp-input"
                />
              </>
            )}
            <p className="otp-sent">OTP sent to +91 {phone} <span onClick={() => setStep(1)}>Change</span></p>
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
                <>Didn&apos;t get it? <span onClick={resend}>Resend</span></>
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
