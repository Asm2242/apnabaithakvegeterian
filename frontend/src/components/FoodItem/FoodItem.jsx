import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { StoreContext } from "../../Context/StoreContext";
import ReviewBox from "../ReviewBox/ReviewBox";
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
    reviewSummary,
    refreshReviews,
  } = useContext(StoreContext);

  const item = food || { _id: id, price };
  const itemId = item._id || id;
  const wished = wishlist.includes(itemId);
  const dual = isPizza(item) || hasHalfFull(item);
  const options = isPizza(item) ? ["Small", "Regular"] : ["Half", "Full"];
  const [size, setSize] = useState(defaultSize(item));
  const key = `${itemId}__${size}`;
  const qty = cartItems[key] || 0;
  const soldOut = item.available === false;
  const rating = reviewSummary[String(itemId)];

  return (
    <article
      className={`food-item food-card ${soldOut ? "is-sold-out" : ""}`}
      style={{ animationDelay: `${(index || 0) * 60}ms` }}
    >
      <div className="food-card-media">
        <img
          className="food-card-img"
          src={imgUrl(image)}
          alt={name}
          loading="lazy"
          decoding="async"
        />
        <Link to={`/food/${itemId}`} className="food-card-open" aria-label={`View ${name} details`} />
        <div className="food-card-tags">
          {item.bestSeller && <span className="food-tag best">⭐ Bestseller</span>}
          {item.category && <span className="food-tag cat">{item.category}</span>}
        </div>
        <button
          type="button"
          aria-label="wishlist"
          className={`food-card-wish ${wished ? "active" : ""}`}
          onClick={() => toggleWish(itemId)}
        >
          {wished ? "❤️" : "🤍"}
        </button>
        {rating?.count > 0 && (
          <span className="food-card-rating">★ {rating.avg}</span>
        )}
        {qty > 0 && !soldOut && <span className="food-card-qty">{qty} in cart</span>}
        {soldOut && <div className="sold-out-badge">SOLD OUT</div>}
      </div>

      <div className="food-card-body">
        <h3 className="food-card-name">
          <span className="veg-dot" title="Pure vegetarian" /> {name}
        </h3>
        <p className="food-card-desc">{desc}</p>

        {dual && (
          <div className="food-card-sizes" role="group" aria-label="Choose size">
            {options.map((s) => (
              <button
                key={s}
                type="button"
                className={size === s ? "size-chip active" : "size-chip"}
                onClick={() => setSize(s)}
              >
                {s} <span>₹{priceFor(item, s)}</span>
              </button>
            ))}
          </div>
        )}

        <div className="food-card-bottom">
          <div className="food-card-price">
            <small>Price</small>
            <b>₹{priceFor(item, size)}</b>
          </div>
          {qty === 0 ? (
            <button
              type="button"
              className="food-card-add"
              onClick={() => addToCart(itemId, size)}
              disabled={soldOut}
            >
              {soldOut ? "SOLD OUT" : <><span>+</span> ADD</>}
            </button>
          ) : (
            <div className="food-card-stepper">
              <button type="button" aria-label="remove one" onClick={() => removeFromCart(itemId, size)}>−</button>
              <b>{qty}</b>
              <button type="button" aria-label="add one" onClick={() => addToCart(itemId, size)}>+</button>
            </div>
          )}
        </div>

        <Link to={`/food/${itemId}`} className="food-card-details">View details →</Link>
        <div className="food-item-review">
          <ReviewBox foodId={String(itemId)} onRated={refreshReviews} />
        </div>
      </div>
    </article>
  );
};

FoodItem.propTypes = {
  image: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  desc: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  food: PropTypes.object,
  index: PropTypes.number,
};

export default FoodItem;
