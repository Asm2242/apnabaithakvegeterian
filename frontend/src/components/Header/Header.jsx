//import React from 'react'
import "./Header.css";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const goToMenu = () => navigate("/menu");

  return (
    <div className="header">
      <div className="header-overlay" />
      <div className="header-contents">
        <span className="hero-badge">100% Pure Veg • Fresh &amp; Hot</span>
        <h2>
          गरमागरम खाना,
          <span className="hero-line">घर जैसा स्वाद!</span>
        </h2>
        <p>
          81 dishes across 14 categories — thali, maggi, pizza, momos, Chinese
          and combos. Fresh, hot and pure veg, starting at just ₹10.
        </p>
        <div className="hero-stats">
          <div><b>81+</b><span>Dishes</span></div>
          <div><b>4.6★</b><span>Loved</span></div>
          <div><b>7:30–10</b><span>Open daily</span></div>
        </div>
        <div className="hero-btns">
          <button className="btn-gold" onClick={goToMenu}>Explore Menu</button>
          <a className="btn-ghost" href="tel:+919454999442">📞 Call to Order</a>
        </div>
      </div>
    </div>
  );
};

export default Header;
