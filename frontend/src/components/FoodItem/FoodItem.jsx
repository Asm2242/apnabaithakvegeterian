import { useContext, useState } from "react";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../Context/StoreContext";
import "./FoodItem.css";
import PropTypes from "prop-types";

const FoodItem = ({ image, name, price, desc, id, food }) => {
  const {
    cartItems,
    addToCart,
    removeFromCart,
    url,
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
    <div className="food-item">
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
          src={url + "/images/" + image}
          alt={name}
        />
        {qty === 0 ? (
          <img
            className="add"
            onClick={() => addToCart(itemId, size)}
            src={assets.add_icon_white}
            alt="add"
          />
        ) : (
          <div className="food-item-counter">
            <img
              src={assets.remove_icon_red}
              onClick={() => removeFromCart(itemId, size)}
              alt="remove"
            />
            <p>{qty}</p>
            <img
              src={assets.add_icon_green}
              onClick={() => addToCart(itemId, size)}
              alt="add"
            />
          </div>
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
        <p className="food-item-price">₹{priceFor(item, size)}</p>
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
