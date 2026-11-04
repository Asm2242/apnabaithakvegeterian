import { useContext } from "react";
import { Link } from "react-router-dom";
import { StoreContext } from "../../Context/StoreContext";
import FoodItem from "../../components/FoodItem/FoodItem";
import "./Wishlist.css";

// Saved favourites — hearts tapped on any dish land here.
const Wishlist = () => {
  const { food_list, wishlist } = useContext(StoreContext);
  const items = food_list.filter((f) => wishlist.includes(f._id));

  return (
    <div className="wishlist-page">
      <div className="menu-hero wishlist-hero">
        <h1>❤️ My Wishlist</h1>
        <p>
          {items.length} saved {items.length === 1 ? "dish" : "dishes"} • 100% pure veg 🟢
        </p>
      </div>

      {items.length === 0 ? (
        <div className="menu-empty">
          <span className="empty-emoji">🤍</span>
          <p>No favourites yet — tap the 🤍 on any dish to save it here.</p>
          <Link to="/menu" className="wl-cta">Browse Menu →</Link>
        </div>
      ) : (
        <div className="menu-grid">
          {items.map((item, i) => (
            <FoodItem
              key={item._id}
              image={item.image}
              name={item.name}
              desc={item.description}
              price={item.price}
              id={item._id}
              food={item}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;