import { useContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../Context/StoreContext";
import "./OtpGate.css";
import PropTypes from "prop-types";

// Start page: Step 1 number only -> Step 2a name shown / 2b name asked + OTP.
// Skip allowed for browsing; checkout will ask again.
const OtpGate = ({ onDone }) => {
  const { url, setToken, loadCartData } = useContext(StoreContext);
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
      const check = await axios.post(url + "/api/otp/check", { phone });
      setKnownName(check.data.success && check.data.exists ? check.data.name || "" : "");
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

  const verify = async () => {
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
        onDone(true);
      } else toast.error(res.data.message);
    } catch {
      toast.error("Verification failed");
    }
    setBusy(false);
  };

  return (
    <div className="otp-gate">
      <div className="otp-gate-card">
        <p className="otp-gate-logo">Apna Baithak</p>
        <p className="otp-gate-sub">Pure Veg • Eldeco City, Lucknow</p>

        {step === 1 ? (
          <>
            <h2>Enter your number</h2>
            <div className="otp-gate-phone">
              <span>+91</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit mobile number"
                inputMode="numeric"
              />
            </div>
            <button disabled={!phoneValid || busy} onClick={goStep2} className="otp-gate-btn">
              {busy ? "Please wait…" : "Continue"}
            </button>
          </>
        ) : (
          <>
            {knownName ? (
              <h2>Welcome back, {knownName}! 👋</h2>
            ) : (
              <>
                <h2>New customer?</h2>
                <p className="otp-gate-new">ENTER YOUR NAME</p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="YOUR NAME"
                  className="otp-gate-input"
                />
              </>
            )}
            <div className="otp-gate-boxes">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <input
                  key={i}
                  value={code[i] || ""}
                  inputMode="numeric"
                  maxLength={1}
                  onChange={(e) => {
                    const d = e.target.value.replace(/\D/g, "").slice(-1);
                    const next = (code + "      ").split("");
                    next[i] = d;
                    setCode(next.join("").trim());
                    const nextBox = document.getElementById(`gate-otp-${i + 1}`);
                    if (d && nextBox) nextBox.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !code[i]) {
                      const prev = document.getElementById(`gate-otp-${i - 1}`);
                      if (prev) prev.focus();
                    }
                  }}
                  id={`gate-otp-${i}`}
                />
              ))}
            </div>
            <button
              disabled={code.length !== 6 || busy}
              onClick={verify}
              className="otp-gate-btn"
            >
              {busy ? "Verifying…" : "Verify & Continue"}
            </button>
          </>
        )}
        <button onClick={() => onDone(false)} className="otp-gate-link">
          Skip for now
        </button>
      </div>
    </div>
  );
};

OtpGate.propTypes = {
  onDone: PropTypes.func.isRequired,
};

export default OtpGate;
