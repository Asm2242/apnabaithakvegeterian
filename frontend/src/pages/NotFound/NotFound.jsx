import { Link } from "react-router-dom";
import "./NotFound.css";

const NotFound = () => (
  <div className="not-found">
    <div className="nf-card">
      <div className="nf-number">404</div>
      <h1>Yeh dish menu me nahi hai!</h1>
      <p>Page nahi mila — shayad URL galat ho ya item sold out ho gaya.</p>
      <Link to="/" className="nf-btn">Back to Home</Link>
      <Link to="/menu" className="nf-link">Browse the menu →</Link>
    </div>
  </div>
);

export default NotFound;
