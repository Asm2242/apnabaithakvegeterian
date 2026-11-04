//import React from 'react'
import "./Header.css";
import { FireworkBursts } from "../DiwaliSky/DiwaliSky";

const Header = () => {
  const scrollToMenu = () => {
    document.getElementById("explore-menu")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="header">
      <div className="toran">
        <div className="thread"></div>
        <div className="flowers">
          {Array.from({ length: 14 }).map((_, i) => (
            <div className="flower-wrap" key={i}>
              <div className="flower"></div>
              <div className="leaf"></div>
            </div>
          ))}
        </div>
      </div>
      <div className="header-overlay" />
      <FireworkBursts field="fw-field fw-hero" />
      <div className="header-contents">
        <span className="hero-badge">🪔 दिवाली स्पेशल 2026 • 100% Pure Veg</span>
        <h2>
          इस दिवाली, अपने परिवार के साथ
          <span className="hero-line">मनाएं रोशनी का उत्सव!</span>
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
          <button className="btn-gold" onClick={scrollToMenu}>Explore Festive Feast</button>
          <a className="btn-ghost" href="tel:+919454999442">📞 Call to Order</a>
        </div>
      </div>
      <div className="diya-row" aria-hidden="true">
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={i} className="diya" style={{ animationDelay: `${i * 0.3}s` }}>🪔</span>
        ))}
      </div>
      <div className="rangoli-strip" aria-hidden="true" />
    </div>
  );
};

export default Header;
