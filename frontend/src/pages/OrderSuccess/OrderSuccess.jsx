import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { StoreContext } from "../../Context/StoreContext";
import "./OrderSuccess.css";

// Cinematic confirmation: food plate loading -> tick/cross -> auto track page
const OrderSuccess = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { url, token, setCartItems } = useContext(StoreContext);
  const navigate = useNavigate();
  const [phase, setPhase] = useState("loading"); // loading | ok | fail
  const [order, setOrder] = useState(null);
  const failed = params.get("failed") === "1";
  const cod = params.get("cod") === "1";

  useEffect(() => {
    if (!token) {
      navigate("/cart");
      return;
    }
    if (failed) {
      setPhase("fail");
      return;
    }
    axios
      .get(url + "/api/order/track/" + id, { headers: { token } })
      .then((res) => {
        if (res.data.success) {
          setOrder(res.data.data.order);
          setCartItems({});
          setTimeout(() => setPhase("ok"), 2200);
        } else setPhase("fail");
      })
      .catch(() => setPhase("fail"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  useEffect(() => {
    if (phase !== "ok") return;
    const t = setTimeout(() => navigate(`/track/${id}`), 3200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <div className="success-wrap">
      {phase === "loading" && (
        <div className="plate-stage">
          <div className="steam"><span></span><span></span><span></span></div>
          <div className="plate">🍛</div>
          <div className="cloche" />
          <h2>Cooking your order…</h2>
          <div className="loadbar"><div /></div>
        </div>
      )}
      {phase === "ok" && (
        <div className="plate-stage">
          <div className="tick-circle">
            <svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="25" /><path d="M14 27l8 8 16-16" /></svg>
          </div>
          <h2>Order placed!</h2>
          <p>
            {order?.paymentMethod === "cod" || cod
              ? `Pay ₹${order?.amount} cash on delivery.`
              : "Payment received. Kitchen started cooking! 👨‍🍳"}
          </p>
          <p className="redirect-note">Taking you to live tracking…</p>
          <div className="loadbar"><div /></div>
          <Link to={`/track/${id}`} className="track-link">Track now →</Link>
        </div>
      )}
      {phase === "fail" && (
        <div className="plate-stage">
          <div className="cross-circle">
            <svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="25" /><path d="M17 17l18 18M35 17L17 35" /></svg>
          </div>
          <h2>Something failed</h2>
          <p>Payment nahi hua ya order nahi mila. Paisa kata ho to 3-5 din me wapas ayega.</p>
          <div className="fail-btns">
            <Link to="/cart" className="track-link">Try again</Link>
            <Link to="/myorders" className="ghost-link">My orders</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSuccess;
