import { Link } from "react-router-dom";
import "./Contact.css";

const DETAILS = [
  { icon: "📍", label: "Visit us", value: "Shop No. LGF 11, Arcade 1, Eldeco City, IIM Road, Lucknow – 226013" },
  { icon: "🕐", label: "Opening hours", value: "7:30 AM – 10:00 PM, all days" },
  { icon: "📞", label: "Call us", value: "+91 94549 99442  •  +91 82997 51213" },
  { icon: "👤", label: "Owner", value: "Abhay Singh" },
];

const Contact = () => (
  <div className="contact-page">
    <section className="contact-hero">
      <span className="contact-pill">📞 We&apos;d love to hear from you</span>
      <h1>Contact <span>Apna Baithak</span></h1>
      <p>Questions, orders, feedback or just saying hello — we are here for you.</p>
    </section>

    <div className="contact-grid">
      <div className="contact-cards">
        {DETAILS.map((d) => (
          <div className="contact-card" key={d.label}>
            <span className="contact-icon">{d.icon}</span>
            <div>
              <small>{d.label}</small>
              <p>{d.value}</p>
            </div>
          </div>
        ))}
        <div className="contact-actions-row">
          <a className="contact-call" href="tel:+919454999442">📞 Call now</a>
          <a
            className="contact-map"
            href="https://www.google.com/maps/search/?api=1&query=Eldeco+City+Lucknow"
            target="_blank"
            rel="noreferrer"
          >
            🗺️ Get directions
          </a>
        </div>
      </div>

      <div className="contact-side">
        <div className="contact-glow-card">
          <span>🍽️</span>
          <h2>Order instead?</h2>
          <p>Browse the full menu and get fresh, hot food delivered to your door.</p>
          <Link to="/menu" className="contact-menu-btn">Explore Menu →</Link>
        </div>
        <div className="contact-feedback-card">
          <h3>💬 Have feedback?</h3>
          <p>Scroll down to the feedback form and tell us how we did.</p>
        </div>
      </div>
    </div>
  </div>
);

export default Contact;
