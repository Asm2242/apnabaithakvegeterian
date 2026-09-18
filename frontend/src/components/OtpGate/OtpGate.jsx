import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../Context/StoreContext";
import "./OtpGate.css";
import PropTypes from "prop-types";

// First screen of the customer app: +91 number -> OTP -> open.
// Skip allowed for browsing; checkout will ask again.
const OtpGate = ({ onDone }) => {
  const { url, setToken, loadCartData } = useContext(StoreContext);
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const phoneValid = /^[6-9]\d{9}$/.test(phone);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async () => {
    if (!phoneValid || busy || cooldown > 0) return;
    setBusy(true);
    try {
      const res = await axios.post(url + "/api/otp/start", { phone });
      if (res.data.success) {
        setSent(true);
        setCooldown(res.data.resendAfter || 30);
        toast.success("OTP sent to +91 " + phone);
      } else {
        toast.error(res.data.message);
      }
    } catch {
      toast.error("Could not send OTP");
    }
    setBusy(false);
  };

  const verify = async () => {
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
        onDone(true);
      } else {
        toast.error(res.data.message);
      }
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
        <h2>Login with mobile number</h2>
        <div className="otp-gate-phone">
          <span>+91</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10-digit mobile number"
            inputMode="numeric"
          />
        </div>
        {!sent ? (
          <button disabled={!phoneValid || busy} onClick={send} className="otp-gate-btn">
            {busy ? "Sending…" : "Send OTP"}
          </button>
        ) : (
          <>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="otp-gate-input"
            />
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
                    const nextBox = document.getElementById(`otp-box-${i + 1}`);
                    if (d && nextBox) nextBox.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !code[i]) {
                      const prev = document.getElementById(`otp-box-${i - 1}`);
                      if (prev) prev.focus();
                    }
                  }}
                  id={`otp-box-${i}`}
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
            <button
              disabled={cooldown > 0 || busy}
              onClick={send}
              className="otp-gate-link"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
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
