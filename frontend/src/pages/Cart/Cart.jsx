import { useContext, useEffect, useState } from "react";
import "./Cart.css";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../Context/StoreContext";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const { cartItems, food_list, removeFromCart, getTotalCartAmount, imgUrl, parseKey, priceFor, token, coupon, applyCoupon } =
    useContext(StoreContext);
  const navigate = useNavigate();
  const [code, setCode] = useState(coupon?.code || "");
  const [isFirst, setIsFirst] = useState(false);

  useEffect(() => {
    if (!token) return;
    axios
      .post(url + "/api/order/userorders", {}, { headers: { token } })
      .then((res) => {
        if (res.data.success && (res.data.data || []).length === 0) setIsFirst(true);
      })
      .catch(() => {});
  }, [token, url]);

  const apply = async () => {
    if (!token) {
      toast.info("Login to use coupons");
      return;
    }
    try {
      const res = await axios.post(
        url + "/api/coupon/validate",
        { code, subtotal: getTotalCartAmount() },
        { headers: { token } }
      );
      if (res.data.success) {
        applyCoupon({ code: code.toUpperCase().trim(), discount: res.data.discount });
        toast.success(`Coupon applied! Rs.${res.data.discount} off`);
      } else {
        applyCoupon(null);
        toast.error(res.data.message);
      }
    } catch {
      toast.error("Coupon failed");
    }
  };

  const lines = Object.entries(cartItems);

  const subtotal = getTotalCartAmount();
  const discount = coupon?.discount || 0;
  const delivery = subtotal === 0 || subtotal - discount >= 399 ? 0 : 39;

  return (
    <div className="cart">
      {isFirst && subtotal >= 149 && !coupon && (
        <div className="offer-banner">
          🎉 First order? Use code <b>WELCOME50</b> — Rs.50 OFF above Rs.149!
        </div>
      )}
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p> <p>Title</p> <p>Price</p> <p>Quantity</p> <p>Total</p>{" "}
          <p>Remove</p>
        </div>
        <br />
        <hr />
        {lines.map(([key, qty], index) => {
          const { id, size } = parseKey(key);
          const item = food_list.find((f) => String(f._id) === id);
          if (!item || qty <= 0) return null;
          const price = priceFor(item, size);
          return (
            <div key={index}>
              <div className="cart-items-title cart-items-item">
                <img src={imgUrl(item.image)} alt="" />
                <p>
                  {item.name} <span>({size})</span>
                </p>
                <p>₹{price}</p>
                <div>{qty}</div>
                <p>₹{price * qty}</p>
                <p
                  className="cart-items-remove-icon"
                  onClick={() => removeFromCart(id, size)}
                >
                  x
                </p>
              </div>
              <hr />
            </div>
          );
        })}
      </div>
      <div className="cart-bottom">
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
                  <p>Coupon ({coupon.code}) <span className="rm-coupon" onClick={() => { applyCoupon(null); setCode(""); }}>✕</span></p>
                  <p>− ₹{discount}</p>
                </div>
                <hr />
              </>
            )}
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>₹{subtotal === 0 ? 0 : delivery}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>
                ₹{subtotal === 0 ? 0 : Math.max(0, subtotal - discount) + delivery}
              </b>
            </div>
          </div>
          <button onClick={() => navigate("/order")}>
            PROCEED TO CHECKOUT
          </button>
        </div>
        <div className="cart-promocode">
          <div>
            <p>Have a coupon? WELCOME50 for first order</p>
            <div className="cart-promocode-input">
              <input
                type="text"
                placeholder="Coupon code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
              <button onClick={apply}>Apply</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
