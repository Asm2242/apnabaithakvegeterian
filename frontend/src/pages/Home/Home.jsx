import { useState } from "react";
import { Link } from "react-router-dom";
import { useContext } from "react";
import Header from "../../components/Header/Header";
import FoodItem from "../../components/FoodItem/FoodItem";
import AppDownload from "../../components/AppDownload/AppDownload";
import { StoreContext } from "../../Context/StoreContext";
import "./Home.css";

const TESTIMONIALS = [
  { name: "Rahul Verma", area: "Eldeco City", text: "Dussehra thali was amazing — pure home-style taste. The whole family loved it!", stars: 5 },
  { name: "Priya Singh", area: "IIM Road", text: "Best pure veg food in Lucknow. Hot delivery, great packaging.", stars: 5 },
  { name: "Amit Kumar", area: "Gomti Nagar", text: "Ordered the Utsav combo for 6 people. Value for money and tasty.", stars: 4 },
  { name: "Sneha Gupta", area: "Hazratganj", text: "Momos and maggi taste like street style but hygienic. Highly recommended!", stars: 5 },
];

const Home = () => {
  const { food_list, menu_list } = useContext(StoreContext);
  const best = food_list.filter((f) => f.bestSeller).slice(0, 8);
  const combos = food_list.filter((f) => f.category === "Combo").slice(0, 4);
  const festive = food_list.slice(0, 6);

  return (
    <>
      <Header />
      <div className="home-offer-strip">
        <span className="home-offer-code">WELCOME50</span>
        <span>First order? Get <b>₹50 OFF</b> above ₹149 • Free delivery above ₹399 • Open 7:30 AM – 10 PM</span>
      </div>

      <section className="home-section" id="utsav">
        <div className="home-section-head">
          <h2>🪔 Dussehra Special</h2>
          <Link to="/menu">Full menu →</Link>
        </div>
        <div className="festive-tag-row">
          <span className="festive-pill">🔥 Utsav Special</span>
          <span className="festive-pill">🪔 Festive Season</span>
          <span className="festive-pill">🍽️ Pure Veg</span>
        </div>
        <div className="home-grid">
          {festive.map((item) => (
            <div key={item._id} className="festive-card">
              <span className="festive-badge">Utsav Special</span>
              <FoodItem
                image={item.image}
                name={item.name}
                desc={item.description}
                price={item.price}
                id={item._id}
                food={item}
              />
            </div>
          ))}
        </div>
      </section>

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

      <section className="home-section about-section">
        <div className="about-grid">
          <div className="about-text">
            <h2>About Apna Baithak</h2>
            <p>
              Nestled in the heart of <b>Eldeco City, Lucknow</b>, Apna Baithak
              is a pure-vegetarian kitchen serving traditional Indian flavours
              with love. From hearty thalis to street-style momos and pizzas,
              every dish is cooked fresh, hot and hygienic.
            </p>
            <p>
              We believe festivals are best celebrated with family and food.
              That's why our festive specials bring the warmth of home cooking
              to your doorstep — 100% pure veg, always.
            </p>
            <div className="about-stats">
              <div><b>81+</b><span>Dishes</span></div>
              <div><b>14</b><span>Categories</span></div>
              <div><b>4.6★</b><span>Rating</span></div>
            </div>
          </div>
          <div className="about-image">
            <div className="about-image-card">
              <span className="about-emoji">🍽️</span>
              <p>Taste the Tradition<br />Feel the Comfort</p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section testimonials-section">
        <div className="home-section-head">
          <h2>💬 What Customers Say</h2>
        </div>
        <div className="testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="testimonial-card">
              <div className="testimonial-stars">{"⭐".repeat(t.stars)}</div>
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-author">
                <b>{t.name}</b>
                <span>{t.area}</span>
              </div>
            </div>
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