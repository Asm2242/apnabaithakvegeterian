import { useState } from "react";
import { Link } from "react-router-dom";
import { useContext } from "react";
import Header from "../../components/Header/Header";
import FoodItem from "../../components/FoodItem/FoodItem";
import AppDownload from "../../components/AppDownload/AppDownload";
import { StoreContext } from "../../Context/StoreContext";
import "./Home.css";

const Home = () => {
  const { food_list, menu_list } = useContext(StoreContext);
  const best = food_list.filter((f) => f.bestSeller).slice(0, 8);
  const combos = food_list.filter((f) => f.category === "Combo").slice(0, 4);

  return (
    <>
      <Header />
      <div className="home-offer-strip">
        <span className="home-offer-code">WELCOME50</span>
        <span>First order? Get <b>₹50 OFF</b> above ₹149 • Free delivery above ₹399 • Open 7:30 AM – 10 PM</span>
      </div>

      <section className="home-section">
        <div className="home-section-head">
          <h2>⭐ Bestsellers</h2>
          <Link to="/menu">Full menu →</Link>
        </div>
        <div className="home-grid">
          {best.map((item) => (
            <FoodItem
              key={item._id}
              image={item.image}
              name={item.name}
              desc={item.description}
              price={item.price}
              id={item._id}
              food={item}
            />
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2>🍱 Value Combos</h2>
          <Link to="/menu?category=Combo">All combos →</Link>
        </div>
        <div className="home-grid">
          {combos.map((item) => (
            <FoodItem
              key={item._id}
              image={item.image}
              name={item.name}
              desc={item.description}
              price={item.price}
              id={item._id}
              food={item}
            />
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2>🍽️ Categories</h2>
          <Link to="/menu">Browse all →</Link>
        </div>
        <div className="home-cats">
          {menu_list.map((c) => (
            <Link key={c.menu_name} to={`/menu?category=${encodeURIComponent(c.menu_name)}`} className="home-cat">
              <img src={c.menu_image} alt={c.menu_name} />
              <span>{c.menu_name}</span>
            </Link>
          ))}
        </div>
      </section>

      <AppDownload />
    </>
  );
};

export default Home;
