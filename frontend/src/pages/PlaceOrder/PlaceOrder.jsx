import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { StoreContext } from "../../Context/StoreContext";
import "./PlaceOrder.css";

const PlaceOrder = () => {
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "Lucknow",
    state: "Uttar Pradesh",
    zipcode: "226013",
    country: "India",
    phone: "",
    landmark: "",
    notes: "",
  });
  const [mode, setMode] = useState("delivery");
  const [payment, setPayment] = useState("online");
  const [placing, setPlacing] = useState(false);

  const {
    getTotalCartAmount, token, food_list, cartLines, url,
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
    const mobile = (data.phone || phone).replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
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
    const mobile = (data.phone || phone).replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    const res = await verifyOtp(mobile, otp);
    if (res.success) toast.success("Mobile verified");
    else toast.error(res.message);
  };

  const saveAddr = () => {
    // remember address for next time (idea #1) — silent fail ok
    axios
      .post(
        url + "/api/user/address",
        {
          street: data.street,
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

    if (!/^[6-9]\d{9}$/.test((data.phone || phone).replace(/\D/g, "").replace(/^91(?=\d{10}$)/, ""))) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return;
    }
    if (!phoneVerified) {
      toast.error("Verify OTP before placing the order");
      return;
    }

    const lines = cartLines();
    if (lines.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const orderData = {
      address: data,
      items: lines,
      amount: getTotalCartAmount(),
      landmark: data.landmark,
      notes: data.notes,
      mode,
      paymentMethod: payment,
      otpVerified: true,
      couponCode: coupon?.code || "",
    };

    setPlacing(true);
    try {
      const response = await axios.post(url + "/api/order/place", orderData, {
        headers: { token },
      });

      if (!response.data.success) {
        toast.error(response.data.message || "Something went wrong");
        setPlacing(false);
        return;
      }

      // COD: no Razorpay, straight to cinematic confirmation
      if (response.data.cod) {
        saveAddr();
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
            saveAddr();
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
          name: data.firstName + " " + data.lastName,
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

  useEffect(() => {
    if (!token) {
      // checkout clicked while logged out -> open login popup right here
      toast.info("Login to continue checkout");
      setShowLogin(true);
    } else if (getTotalCartAmount() === 0) {
      navigate("/cart");
    } else {
      // saved address autofill (idea #1)
      axios
        .get(url + "/api/user/address", { headers: { token } })
        .then((res) => {
          if (res.data.success && res.data.address?.street) {
            setData((d) => ({ ...d, ...res.data.address }));
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const subtotal = getTotalCartAmount();
  const discount = coupon?.discount || 0;
  const delivery = subtotal === 0 || mode === "takeaway" || subtotal - discount >= 399 ? 0 : 39;
  const grand = Math.max(0, subtotal - discount) + delivery;

  return (
    <form onSubmit={placeOrder} className="place-order">
      <div className="place-order-left">
        <p className="title">Delivery Information</p>
        <div className="mode-toggle">
          {["delivery", "takeaway"].map((m) => (
            <button
              key={m}
              type="button"
              className={mode === m ? "active" : ""}
              onClick={() => setMode(m)}
            >
              {m === "delivery" ? "Delivery" : "Takeaway"}
            </button>
          ))}
        </div>
        <div className="multi-field">
          <input type="text" name="firstName" onChange={onChangeHandler} value={data.firstName} placeholder="First name" required />
          <input type="text" name="lastName" onChange={onChangeHandler} value={data.lastName} placeholder="Last name" required />
        </div>
        <input type="email" name="email" onChange={onChangeHandler} value={data.email} placeholder="Email address" required />
        {mode === "delivery" && (
          <>
            <input type="text" name="street" onChange={onChangeHandler} value={data.street} placeholder="House / flat, street" required />
            <div className="multi-field">
              <input type="text" name="city" onChange={onChangeHandler} value={data.city} placeholder="City" required />
              <input type="text" name="zipcode" onChange={onChangeHandler} value={data.zipcode} placeholder="Pincode" required />
            </div>
            <input type="text" name="landmark" onChange={onChangeHandler} value={data.landmark} placeholder="Landmark (optional)" />
          </>
        )}
        <input type="text" name="notes" onChange={onChangeHandler} value={data.notes} placeholder="Cooking instructions (optional)" />

        <p className="title">Mobile verification</p>
        {!phoneVerified ? (
          <div className="otp-box">
            <div className="multi-field">
              <input
                type="tel"
                name="phone"
                onChange={onChangeHandler}
                value={data.phone}
                placeholder="10-digit mobile number"
                required
              />
              <button type="button" onClick={sendOtp}>
                {otpSent ? "Resend OTP" : "Send OTP"}
              </button>
            </div>
            {otpSent && (
              <div className="multi-field">
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit OTP"
                  inputMode="numeric"
                />
                <button type="button" onClick={doVerify}>Verify</button>
              </div>
            )}
          </div>
        ) : (
          <p className="verified">✓ {(data.phone || phone) && `+91 ${data.phone || phone}`} verified</p>
        )}

        <p className="title">Payment</p>
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
      </div>
      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>
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
  );
};

export default PlaceOrder;
