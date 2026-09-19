import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { StoreContext } from "../../Context/StoreContext";
import LocationPicker from "../../components/LocationPicker/LocationPicker";
import "../../components/LocationPicker/LocationPicker.css";
import "./PlaceOrder.css";

// Checkout stepper: 1 Pin -> 2 Details popup -> 3 Payment -> animation -> track
const PlaceOrder = () => {
  const [data, setData] = useState({
    fullName: "",
    email: "",
    flat: "",
    street: "",
    city: "Lucknow",
    state: "Uttar Pradesh",
    zipcode: "226013",
    country: "India",
    phone: "",
    altPhone: "",
    landmark: "",
    notes: "",
  });
  const [mode, setMode] = useState("delivery");
  const [step, setStep] = useState("pin"); // pin | details | payment
  const [payment, setPayment] = useState("online");
  const [placing, setPlacing] = useState(false);
  const [pin, setPin] = useState(null);
  const [saved, setSaved] = useState([]);

  const {
    getTotalCartAmount, token, cartLines, url,
    phoneVerified, phone, requestOtp, verifyOtp, setShowLogin,
    coupon, applyCoupon,
  } = useContext(StoreContext);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const navigate = useNavigate();

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const cleanMobile = (p) => String(p || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");

  // init: login gate + saved addresses + gate pin
  useEffect(() => {
    if (!token) {
      toast.info("Login to continue checkout");
      setShowLogin(true);
      return;
    }
    if (getTotalCartAmount() === 0) {
      navigate("/cart");
      return;
    }
    axios
      .get(url + "/api/user/addresses", { headers: { token } })
      .then((res) => {
        if (res.data.success) setSaved(res.data.data || []);
      })
      .catch(() => {});
    try {
      const gp = JSON.parse(localStorage.getItem("ab_pin") || "null");
      if (gp) setPin(gp);
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ---- step 1: pin ----
  const savePin = () => {
    if (mode === "delivery" && !pin) {
      toast.error("Map par pin lagao ya Current location dabao");
      return;
    }
    if (pin) localStorage.setItem("ab_pin", JSON.stringify(pin));
    setStep("details");
    window.scrollTo(0, 0);
  };

  const pickSaved = (a) => {
    setData((d) => ({
      ...d,
      street: a.street || d.street,
      city: a.city || d.city,
      state: a.state || d.state,
      zipcode: a.zipcode || d.zipcode,
      country: a.country || d.country,
      landmark: a.landmark || d.landmark,
    }));
    if (a.lat != null) {
      setPin({ lat: a.lat, lng: a.lng });
      localStorage.setItem("ab_pin", JSON.stringify({ lat: a.lat, lng: a.lng }));
    }
    axios.post(url + `/api/user/addresses/use/${a._id}`, {}, { headers: { token } }).catch(() => {});
    toast.success(`Address set: ${a.label || a.street}`);
  };

  // ---- step 2: details ----
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const sendOtp = async () => {
    const mobile = cleanMobile(data.phone || phone);
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return;
    }
    const res = await requestOtp(mobile);
    if (res.success) {
      setOtpSent(true);
      toast.success("OTP sent to +91 " + mobile);
    } else {
      toast.error(res.message);
    }
  };

  const doVerify = async () => {
    const mobile = cleanMobile(data.phone || phone);
    const res = await verifyOtp(mobile, otp);
    if (res.success) toast.success("Mobile verified");
    else toast.error(res.message);
  };

  const saveDetails = async (e) => {
    e.preventDefault();
    if (!data.fullName.trim()) {
      toast.error("Apna naam likho");
      return;
    }
    const mobile = cleanMobile(data.phone || phone);
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      toast.error("Sahi 10-digit mobile number dalo");
      return;
    }
    if (data.altPhone && !/^[6-9]\d{9}$/.test(cleanMobile(data.altPhone))) {
      toast.error("Alt number galat hai (optional hai — khaali chhodo ya sahi dalo)");
      return;
    }
    if (!phoneVerified) {
      toast.error("Verify OTP before continuing");
      return;
    }
    if (mode === "delivery") {
      if (!data.street.trim()) {
        toast.error("Street / house likho");
        return;
      }
      // save to address book (silent)
      axios
        .post(
          url + "/api/user/addresses",
          {
            label: "",
            flat: data.flat,
            street: [data.flat, data.street].filter(Boolean).join(", "),
            city: data.city,
            state: data.state,
            zipcode: data.zipcode,
            country: data.country,
            landmark: data.landmark,
            lat: pin?.lat ?? null,
            lng: pin?.lng ?? null,
          },
          { headers: { token } }
        )
        .catch(() => {});
    }
    setStep("payment");
    window.scrollTo(0, 0);
  };

  // ---- step 3: payment ----
  const saveAddrLegacy = () => {
    axios
      .post(
        url + "/api/user/address",
        {
          street: [data.flat, data.street].filter(Boolean).join(", "),
          city: data.city,
          state: data.state,
          zipcode: data.zipcode,
          country: data.country,
          landmark: data.landmark,
        },
        { headers: { token } }
      )
      .catch(() => {});
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    if (placing) return;
    setPlacing(true);
    try {
      const orderData = {
        address: {
          name: data.fullName,
          email: data.email,
          flat: data.flat,
          street: [data.flat, data.street].filter(Boolean).join(", "),
          city: data.city,
          state: data.state,
          zipcode: data.zipcode,
          country: data.country,
          altPhone: cleanMobile(data.altPhone),
        },
        items: cartLines(),
        amount: getTotalCartAmount(),
        landmark: data.landmark,
        notes: data.notes,
        mode,
        paymentMethod: payment,
        otpVerified: true,
        couponCode: coupon?.code || "",
        ...(pin ? { lat: pin.lat, lng: pin.lng } : {}),
      };

      const response = await axios.post(url + "/api/order/place", orderData, {
        headers: { token },
      });

      if (!response.data.success) {
        toast.error(response.data.message || "Something went wrong");
        setPlacing(false);
        return;
      }

      if (response.data.cod) {
        saveAddrLegacy();
        applyCoupon(null);
        toast.success("Order placed! Pay cash on delivery");
        navigate("/success/" + response.data.orderId + "?cod=1");
        return;
      }

      const ok = await loadRazorpayScript();
      if (!ok) {
        toast.error("Razorpay failed to load. Are you online?");
        await axios.post(url + "/api/order/failed", { orderId: response.data.orderId }, { headers: { token } });
        setPlacing(false);
        return;
      }

      const { razorpayOrderId, orderId, amount, currency } = response.data;
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: "Apna Baithak",
        description: "Pure Veg Order Payment",
        order_id: razorpayOrderId,
        handler: async function (resp) {
          const verifyRes = await axios.post(
            url + "/api/order/verify",
            {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              orderId,
            },
            { headers: { token } }
          );
          if (verifyRes.data.success) {
            saveAddrLegacy();
            applyCoupon(null);
            toast.success("Payment successful");
            navigate("/success/" + orderId);
          } else {
            toast.error("Payment verification failed");
            navigate("/success/" + orderId + "?failed=1");
          }
        },
        modal: {
          ondismiss: async function () {
            await axios.post(url + "/api/order/failed", { orderId }, { headers: { token } });
            toast.error("Payment cancelled");
            setPlacing(false);
          },
        },
        prefill: {
          name: data.fullName,
          email: data.email,
          contact: data.phone || phone,
        },
        theme: { color: "#9a3412" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      toast.error("Error placing order");
      setPlacing(false);
    }
  };

  const subtotal = getTotalCartAmount();
  const discount = coupon?.discount || 0;
  const delivery = subtotal === 0 || mode === "takeaway" || subtotal - discount >= 399 ? 0 : 39;
  const grand = Math.max(0, subtotal - discount) + delivery;

  return (
    <div className="checkout-steps">
      <div className="mode-toggle">
        {["delivery", "takeaway"].map((m) => (
          <button
            key={m}
            type="button"
            className={mode === m ? "active" : ""}
            onClick={() => {
              setMode(m);
              if (m === "takeaway") setStep("details");
              else setStep("pin");
            }}
          >
            {m === "delivery" ? "🛵 Delivery" : "🛍️ Takeaway"}
          </button>
        ))}
      </div>

      <div className="stepper">
        {["Pin", "Details", "Payment"].map((s, i) => {
          const idx = ["pin", "details", "payment"].indexOf(step);
          return (
            <div key={s} className={`step ${i < idx ? "done" : ""} ${i === idx ? "now" : ""}`}>
              <span>{i + 1}</span> {s}
            </div>
          );
        })}
      </div>

      {step === "pin" && mode === "delivery" && (
        <div className="step-card">
          <h2>📍 Apni location pin karo</h2>
          <p className="muted">Rider seedha isi pin par ayega. Tap karo ya GPS dabao.</p>
          <LocationPicker
            value={pin ? [pin.lat, pin.lng] : null}
            onChange={setPin}
          />
          <button className="place-order-submit" onClick={savePin}>
            Save pin & continue →
          </button>
        </div>
      )}

      {(step === "details" || (step === "pin" && mode === "takeaway")) && (
        <div className="step-card popup-look">
          <h2>👤 Personal details</h2>
          {saved.length > 0 && mode === "delivery" && (
            <div className="saved-chips">
              {saved.slice(0, 3).map((a) => (
                <button key={a._id} type="button" onClick={() => pickSaved(a)}>
                  📍 {a.label || a.street?.slice(0, 22) || "Address"}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={saveDetails}>
            <input name="fullName" value={data.fullName} onChange={onChangeHandler} placeholder="Full name" required />
            <div className="multi-field">
              <input name="phone" value={data.phone} onChange={onChangeHandler} placeholder="10-digit mobile" required />
              <input name="altPhone" value={data.altPhone} onChange={onChangeHandler} placeholder="Alt number (optional)" />
            </div>
            {!phoneVerified ? (
              <div className="otp-box">
                <div className="multi-field">
                  <button type="button" onClick={sendOtp}>{otpSent ? "Resend OTP" : "Send OTP"}</button>
                </div>
                {otpSent && (
                  <div className="multi-field">
                    <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit OTP" inputMode="numeric" />
                    <button type="button" onClick={doVerify}>Verify</button>
                  </div>
                )}
              </div>
            ) : (
              <p className="verified">✓ +91 {data.phone || phone} verified</p>
            )}
            {mode === "delivery" && (
              <>
                <input name="flat" value={data.flat} onChange={onChangeHandler} placeholder="Block / Building / Apartment / Flat" />
                <input name="street" value={data.street} onChange={onChangeHandler} placeholder="House / flat, street" required />
                <div className="multi-field">
                  <input name="city" value={data.city} onChange={onChangeHandler} placeholder="City" required />
                  <input name="zipcode" value={data.zipcode} onChange={onChangeHandler} placeholder="Pincode" required />
                </div>
                <input name="landmark" value={data.landmark} onChange={onChangeHandler} placeholder="Landmark (optional)" />
                <input name="notes" value={data.notes} onChange={onChangeHandler} placeholder="Cooking instructions (optional)" />
              </>
            )}
            <div className="step-btns">
              {mode === "delivery" && (
                <button type="button" className="back-btn" onClick={() => setStep("pin")}>← Pin</button>
              )}
              <button type="submit" className="place-order-submit">Save & continue →</button>
            </div>
          </form>
        </div>
      )}

      {step === "payment" && (
        <form onSubmit={placeOrder} className="place-order">
          <div className="place-order-left">
            <h2 className="font24">💳 Payment</h2>
            <div className="pay-methods">
              <label className={payment === "online" ? "active" : ""}>
                <input type="radio" name="payment" checked={payment === "online"} onChange={() => setPayment("online")} />
                <span><b>Online Payment</b><small>UPI, card, netbanking — pay now</small></span>
              </label>
              <label className={payment === "cod" ? "active" : ""}>
                <input type="radio" name="payment" checked={payment === "cod"} onChange={() => setPayment("cod")} />
                <span><b>Cash on Delivery</b><small>Pay cash when order arrives</small></span>
              </label>
            </div>
            <button type="button" className="back-btn" onClick={() => setStep("details")}>← Details</button>
          </div>
          <div className="place-order-right">
            <div className="cart-total">
              <h2>Order Summary</h2>
              <div>
                <div className="cart-total-details">
                  <p>Subtotal</p>
                  <p>₹{subtotal}</p>
                </div>
                <hr />
                {discount > 0 && (
                  <>
                    <div className="cart-total-details">
                      <p>Coupon ({coupon.code})</p>
                      <p>− ₹{discount}</p>
                    </div>
                    <hr />
                  </>
                )}
                <div className="cart-total-details">
                  <p>Delivery Fee</p>
                  <p>₹{delivery}</p>
                </div>
                <hr />
                <div className="cart-total-details">
                  <b>Total</b>
                  <b>₹{grand}</b>
                </div>
              </div>
            </div>
            <button className="place-order-submit" type="submit" disabled={placing}>
              {placing ? "Processing…" : payment === "online" ? `Pay ₹${grand} securely` : `Place order • ₹${grand}`}
            </button>
            {payment === "online" && (
              <p className="secure-note">Secure payment by Razorpay. Free delivery above ₹399.</p>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default PlaceOrder;
