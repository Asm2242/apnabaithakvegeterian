import { useContext, useState } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../Context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

const LoginPopup = ({ setShowLogin }) => {
  const { setToken, url, loadCartData } = useContext(StoreContext);
  const [mode, setMode] = useState("otp"); // otp | email
  const [currState, setCurrState] = useState("Sign Up");

  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const cleanPhone = (p) => String(p || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");

  // ---- OTP login (+91) ----
  const sendOtp = async () => {
    const mobile = cleanPhone(data.phone);
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setBusy(true);
    try {
      const res = await axios.post(url + "/api/otp/start", { phone: mobile });
      if (res.data.success) {
        setSent(true);
        toast.success("OTP sent to +91 " + mobile);
      } else toast.error(res.data.message);
    } catch {
      toast.error("Could not send OTP");
    }
    setBusy(false);
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    const mobile = cleanPhone(data.phone);
    if (code.length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }
    setBusy(true);
    try {
      const res = await axios.post(url + "/api/otp/login", {
        phone: mobile,
        otp: code,
        name: data.name,
      });
      if (res.data.success) {
        setToken(res.data.token);
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("ab_phone", mobile);
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

  // ---- Email login/signup (old flow) ----
  const onLogin = async (e) => {
    e.preventDefault();

    let new_url = url;
    if (currState === "Login") {
      new_url += "/api/user/login";
    } else {
      new_url += "/api/user/register";
    }
    const response = await axios.post(new_url, data);
    if (response.data.success) {
      setToken(response.data.token);
      localStorage.setItem("token", response.data.token);
      loadCartData(response.data.token);
      setShowLogin(false);
    } else {
      toast.error(response.data.message);
    }
  };

  return (
    <div className="login-popup">
      <form onSubmit={mode === "otp" ? verifyOtp : onLogin} className="login-popup-container">
        <div className="login-popup-title">
          <h2>{mode === "otp" ? "OTP Login" : currState}</h2>{" "}
          <img
            onClick={() => setShowLogin(false)}
            src={assets.cross_icon}
            alt=""
          />
        </div>

        <div className="login-mode-toggle">
          <button
            type="button"
            className={mode === "otp" ? "active" : ""}
            onClick={() => setMode("otp")}
          >
            Mobile OTP
          </button>
          <button
            type="button"
            className={mode === "email" ? "active" : ""}
            onClick={() => setMode("email")}
          >
            Email
          </button>
        </div>

        {mode === "otp" ? (
          <div className="login-popup-inputs">
            <input
              name="name"
              onChange={onChangeHandler}
              value={data.name}
              type="text"
              placeholder="Your name (optional)"
            />
            <div className="phone-row">
              <span>+91</span>
              <input
                name="phone"
                onChange={onChangeHandler}
                value={data.phone}
                type="tel"
                placeholder="10-digit mobile number"
                inputMode="numeric"
              />
            </div>
            {!sent ? (
              <button type="button" disabled={busy} onClick={sendOtp}>
                {busy ? "Sending…" : "Send OTP"}
              </button>
            ) : (
              <>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit OTP"
                  inputMode="numeric"
                />
                <button disabled={busy || code.length !== 6}>
                  {busy ? "Verifying…" : "Verify & Login"}
                </button>
                <p>
                  Wrong number?{" "}
                  <span onClick={() => { setSent(false); setCode(""); }}>Resend / change</span>
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="login-popup-inputs">
              {currState === "Sign Up" ? (
                <input
                  name="name"
                  onChange={onChangeHandler}
                  value={data.name}
                  type="text"
                  placeholder="Your name"
                  required
                />
              ) : (
                <></>
              )}
              <input
                name="email"
                onChange={onChangeHandler}
                value={data.email}
                type="email"
                placeholder="Your email"
              />
              <input
                name="phone"
                onChange={onChangeHandler}
                value={data.phone}
                type="tel"
                placeholder="+91 mobile number (for OTP + delivery)"
              />
              <input
                name="password"
                onChange={onChangeHandler}
                value={data.password}
                type="password"
                placeholder="Password"
                required
              />
            </div>
            <button>{currState === "Login" ? "Login" : "Create account"}</button>
            <div className="login-popup-condition">
              <input type="checkbox" name="" id="" required />
              <p>By continuing, i agree to the terms of use & privacy policy.</p>
            </div>
            {currState === "Login" ? (
              <p>
                Create a new account?{" "}
                <span onClick={() => setCurrState("Sign Up")}>Click here</span>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <span onClick={() => setCurrState("Login")}>Login here</span>
              </p>
            )}
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
