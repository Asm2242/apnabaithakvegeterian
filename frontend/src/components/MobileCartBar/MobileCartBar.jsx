import { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { StoreContext } from "../../Context/StoreContext";
import "./MobileCartBar.css";

const MobileCartBar = () => {
  const { cartItems, getTotalCartAmount } = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();
  const count = Object.values(cartItems || {}).reduce((a, b) => a + (b || 0), 0);
  const total = getTotalCartAmount();
  const hide = ["/cart", "/order", "/success", "/track"].some((p) =>
    location.pathname.startsWith(p)
  );

  if (!count || hide) return null;

  return (
    <div className="mobile-cart-bar">
      <div className="mcb-info">
        <b>{count} item{count > 1 ? "s" : ""}</b>
        <span>₹{total} total</span>
      </div>
      <button onClick={() => navigate("/cart")}>View Cart →</button>
    </div>
  );
};

export default MobileCartBar;
