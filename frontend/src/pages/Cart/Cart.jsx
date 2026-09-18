import { useContext } from "react";
import "./Cart.css";
import { StoreContext } from "../../Context/StoreContext";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const { cartItems, food_list, removeFromCart, getTotalCartAmount, url, parseKey, priceFor } =
    useContext(StoreContext);
  const navigate = useNavigate();

  const lines = Object.entries(cartItems);

  return (
    <div className="cart">
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
                <img src={url + "/images/" + item.image} alt="" />
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
              <p>₹{getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>₹{getTotalCartAmount() === 0 || getTotalCartAmount() >= 399 ? 0 : 39}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>
                ₹{getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + (getTotalCartAmount() >= 399 ? 0 : 39)}
              </b>
            </div>
          </div>
          <button onClick={() => navigate("/order")}>
            PROCEED TO CHECKOUT
          </button>
        </div>
        <div className="cart-promocode">
          <div>
            <p>Free delivery above ₹399</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
