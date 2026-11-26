import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";
import "./About.css";

const VALUES = [
  { icon: "🌱", title: "100% Pure Veg", text: "No eggs, no meat — only honest vegetarian cooking, every single day." },
  { icon: "🔥", title: "Fresh & Hot", text: "Cooked to order and packed hot, so it tastes like home when it reaches you." },
  { icon: "🍲", title: "Home-style Taste", text: "Recipes inspired by Lucknow kitchens — simple, comforting and full of flavour." },
  { icon: "🤝", title: "Community First", text: "Made for the Eldeco City neighbourhood, with care for every customer." },
];

const STATS = [
  ["81+", "Dishes"],
  ["14", "Categories"],
  ["4.6★", "Customer rating"],
  ["7:30–10", "Open daily"],
];

const About = () => (
  <div className="about-page">
    <section className="about-hero">
      <div className="about-hero-bg" />
      <div className="about-hero-content">
        <span className="about-pill">🍽️ Pure Veg • Eldeco City, Lucknow</span>
        <h1>About <span>Apna Baithak</span></h1>
        <p>
          A small vegetarian kitchen with a big heart — serving fresh, hot and
          home-style food to our neighbours in Eldeco City.
        </p>
        <div className="about-hero-actions">
          <Link to="/menu" className="about-primary">Explore the menu →</Link>
          <Link to="/contact" className="about-secondary">Contact us</Link>
        </div>
      </div>
    </section>

    <section className="about-section-card story-section">
      <div className="story-image">
        <img src={assets.baithakLogo} alt="Apna Baithak logo" />
        <div className="story-image-cap">Taste the Tradition • Feel the Comfort</div>
      </div>
      <div className="story-text">
        <span className="about-kicker">OUR STORY</span>
        <h2>Food that feels like home</h2>
        <p>
          Nestled in the heart of <b>Eldeco City, Lucknow</b>, Apna Baithak began
          with a simple idea — great vegetarian food should be fresh, affordable
          and served with warmth. From our first cup of chai to our thalis,
          momos and pizzas, everything is cooked with care.
        </p>
        <p>
          We believe in honest ingredients, generous portions and the kind of
          taste that brings a family together. Whether it is a quick breakfast
          or a full dinner, we are happy to be part of your day.
        </p>
      </div>
    </section>

    <section className="about-section-card">
      <span className="about-kicker">WHAT WE BELIEVE</span>
      <h2>Our values</h2>
      <div className="values-grid">
        {VALUES.map((v) => (
          <div className="value-card" key={v.title}>
            <span>{v.icon}</span>
            <h3>{v.title}</h3>
            <p>{v.text}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="about-section-card">
      <div className="about-stats-row">
        {STATS.map(([n, label]) => (
          <div className="about-stat" key={label}>
            <b>{n}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>

    <section className="about-section-card creator-section">
      <div className="creator-badge">👨‍💻</div>
      <div>
        <span className="about-kicker">THE CREATOR</span>
        <h2>Built by ASM</h2>
        <p>
          This website was designed and developed with care by <b>ASM</b> —
          bringing good food and good technology together for Apna Baithak.
        </p>
      </div>
    </section>

    <section className="about-cta">
      <h2>Hungry already?</h2>
      <p>Your next favourite dish is just a tap away.</p>
      <Link to="/menu" className="about-primary">Browse the menu →</Link>
    </section>
  </div>
);

export default About;
