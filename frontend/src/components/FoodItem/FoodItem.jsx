import { useContext, useState } from "react";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../Context/StoreContext";
import "./FoodItem.css";
import PropTypes from "prop-types";

const FoodItem = ({ image, name, price, desc, id, food, index }) => {
  const {
    cartItems,
    addToCart,
    removeFromCart,
    imgUrl,
    priceFor,
    isPizza,
    hasHalfFull,
    defaultSize,
    wishlist,
    toggleWish,
  } = useContext(StoreContext);

  const item = food || { _id: id, price };
  const itemId = item._id || id;
  const wished = wishlist.includes(itemId);
  const dual = isPizza(item) || hasHalfFull(item);
  const options = isPizza(item) ? ["Small", "Regular"] : ["Half", "Full"];
  const [size, setSize] = useState(defaultSize(item));
  const key = `${itemId}__${size}`;
  const qty = cartItems[key] || 0;

  return (
    <div className="food-item" style={{ animationDelay: `${(index || 0) * 60}ms` }}>
      <button
        type="button"
        aria-label="wishlist"
        className={wished ? "wish-btn active" : "wish-btn"}
        onClick={() => toggleWish(itemId)}
      >
        {wished ? "❤️" : "🤍"}
      </button>
      <div className="food-item-img-container">
        <img
          className="food-item-image"
          src={imgUrl(image)}
          alt={name}
        />
        {qty > 0 && (
          <div className="food-item-qty-badge">{qty} in cart</div>
        )}
      </div>
      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p>
            <span className="veg-dot" title="Pure vegetarian" /> {name}
          </p>
          <img src={assets.rating_starts} alt="" />
        </div>
        <p className="food-item-desc">{desc}</p>
        {dual && (
          <div className="food-item-sizes">
            {options.map((s) => (
              <button
                key={s}
                type="button"
                className={size === s ? "size-btn active" : "size-btn"}
                onClick={() => setSize(s)}
              >
                {s} ₹{priceFor(item, s)}
              </button>
            ))}
          </div>
        )}
        <div className="food-item-buy">
          <p className="food-item-price">₹{priceFor(item, size)}</p>
          {qty === 0 ? (
            <button
              type="button"
              className="add-cart-btn"
              onClick={() => addToCart(itemId, size)}
            >
              <span className="add-cart-plus">+</span> ADD
            </button>
          ) : (
            <div className="add-cart-stepper">
              <button
                type="button"
                className="step-minus"
                aria-label="remove"
                onClick={() => removeFromCart(itemId, size)}
              >
                −
              </button>
              <span className="step-qty">{qty}</span>
              <button
                type="button"
                className="step-plus"
                aria-label="add"
                onClick={() => addToCart(itemId, size)}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

FoodItem.propTypes = {
  image: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  desc: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  food: PropTypes.object,
};

export default FoodItem;
