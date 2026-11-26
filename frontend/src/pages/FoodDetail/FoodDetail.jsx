import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../Context/StoreContext";
import FoodItem from "../../components/FoodItem/FoodItem";
import ReviewBox from "../../components/ReviewBox/ReviewBox";
import "./FoodDetail.css";

const pickDefaultSize = (f) =>
  f?.isPizza ? "Small" : (f?.halfPrice != null && f?.fullPrice != null ? "Half" : "Regular");

const FoodDetail = () => {
  const { id } = useParams();
  const {
    url, imgUrl, cartItems, addToCart, removeFromCart, priceFor,
    isPizza, hasHalfFull, wishlist, toggleWish, reviewSummary, refreshReviews,
  } = useContext(StoreContext);
  const [food, setFood] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState("Regular");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${url}/api/food/${id}`),
      axios.get(`${url}/api/food/list`),
      axios.get(`${url}/api/review/${id}`),
    ])
      .then(([one, all, rev]) => {
        if (one.data.success) {
          setFood(one.data.data);
          setSize(pickDefaultSize(one.data.data));
        }
        if (all.data.success) {
          const list = all.data.data || [];
          setRelated(list.filter((f) => f.category === one.data.data?.category && f._id !== id).slice(0, 4));
        }
        if (rev.data.success) setReviews(rev.data.data || []);
      })
      .catch(() => toast.error("Dish load nahi hua"))
      .finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [id, url]);

  if (loading) return <div className="fd-loading"><div className="fd-spinner" /><p>Dish tayaar ho raha hai…</p></div>;
  if (!food) return (
    <div className="fd-missing">
      <span>🍽️</span>
      <h2>Dish nahi mila</h2>
      <Link to="/menu" className="fd-back">← Back to menu</Link>
    </div>
  );

  const wished = wishlist.includes(String(food._id));
  const soldOut = food.available === false;
  const dual = isPizza(food) || hasHalfFull(food);
  const options = isPizza(food) ? ["Small", "Regular"] : ["Half", "Full"];
  const key = `${food._id}__${size}`;
  const qty = cartItems[key] || 0;
  const rating = reviewSummary[String(food._id)];

  return (
    <div className="food-detail">
      <div className="fd-breadcrumb">
        <Link to="/">Home</Link> <span>/</span> <Link to="/menu">Menu</Link> <span>/</span> <b>{food.name}</b>
      </div>

      <div className="fd-hero">
        <div className="fd-image-wrap">
          <img src={imgUrl(food.image)} alt={food.name} />
          {soldOut && <div className="fd-soldout">SOLD OUT</div>}
          <button className={`fd-wish ${wished ? "active" : ""}`} onClick={() => toggleWish(String(food._id))} title="Save to wishlist">
            {wished ? "❤️" : "🤍"}
          </button>
        </div>

        <div className="fd-info">
          <div className="fd-badges">
            <span className="veg-dot" title="Pure vegetarian" />
            <span className="fd-badge pure">100% PURE VEG</span>
            {food.bestSeller && <span className="fd-badge best">⭐ BESTSELLER</span>}
          </div>
          <h1>{food.name}</h1>
          {rating?.count > 0 && <div className="fd-rating">★ {rating.avg} <small>({rating.count} reviews)</small></div>}
          <p className="fd-desc">{food.description}</p>

          <div className="fd-price-row">
            <div>
              <small>{dual ? `Price (${size})` : "Price"}</small>
              <b>₹{priceFor(food, size)}</b>
            </div>
            <span className="fd-tax">inclusive of all taxes</span>
          </div>

          {dual && (
            <div className="fd-sizes">
              <span>Choose size</span>
              <div>
                {options.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={size === s ? "active" : ""}
                    onClick={() => setSize(s)}
                  >
                    {s} <em>₹{priceFor(food, s)}</em>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="fd-actions">
            {qty === 0 ? (
              <button className="fd-add" onClick={() => addToCart(String(food._id), size)} disabled={soldOut}>
                {soldOut ? "SOLD OUT" : <><span>+</span> ADD TO CART</>}
              </button>
            ) : (
              <div className="fd-stepper">
                <button onClick={() => removeFromCart(String(food._id), size)}>−</button>
                <b>{qty} in cart</b>
                <button onClick={() => addToCart(String(food._id), size)}>+</button>
              </div>
            )}
            <Link to="/cart" className="fd-goto">Go to cart →</Link>
          </div>

          <div className="fd-highlights">
            <span>🔥 Cooked fresh</span>
            <span>🛵 Fast delivery</span>
            <span>🌱 Pure veg</span>
          </div>
        </div>
      </div>

      <section className="fd-reviews-section">
        <div className="fd-reviews-head">
          <h2>💬 Reviews</h2>
          <ReviewBox foodId={String(food._id)} onRated={refreshReviews} />
        </div>
        {reviews.length === 0 ? (
          <p className="fd-no-reviews">Abhi koi review nahi hai — pehle customer ban kar rate karein! ⭐</p>
        ) : (
          <div className="fd-review-list">
            {reviews.map((r) => (
              <div className="fd-review" key={r._id}>
                <div className="fd-review-top"><b>{r.userName}</b><span>★ {r.rating}/5</span></div>
                {r.comment && <p>{r.comment}</p>}
                <small>{new Date(r.createdAt).toLocaleDateString("en-IN")}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section className="fd-related">
          <h2>🍽️ More from {food.category}</h2>
          <div className="fd-related-grid">
            {related.map((item, i) => (
              <FoodItem
                key={item._id}
                food={item}
                id={item._id}
                image={item.image}
                name={item.name}
                desc={item.description}
                price={item.price}
                index={i}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default FoodDetail;
