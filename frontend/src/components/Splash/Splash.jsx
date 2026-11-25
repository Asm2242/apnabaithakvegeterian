import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { assets } from "../../assets/assets";
import "./Splash.css";

// Branded intro shown once per browser session.
const Splash = ({ onDone }) => {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const fade = setTimeout(() => setLeaving(true), 1450);
    const done = setTimeout(onDone, 1950);
    return () => {
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div className={`splash ${leaving ? "splash-leave" : ""}`}>
      <div className="splash-foods" aria-hidden="true">
        <span>🍛</span><span>🍲</span><span>🫓</span><span>🥘</span>
      </div>
      <div className="splash-mark">
        <div className="splash-glow" />
        <div className="splash-ring splash-ring-a" />
        <div className="splash-ring splash-ring-b" />
        <div className="splash-spark splash-spark-1">✦</div>
        <div className="splash-spark splash-spark-2">✦</div>
        <div className="splash-spark splash-spark-3">✧</div>
        <div className="splash-logo">
          <img src={assets.baithakLogo} alt="Apna Baithak" />
        </div>
      </div>
      <h1>Apna Baithak</h1>
      <p>Pure Veg • Eldeco City, Lucknow</p>
      <div className="splash-bar"><span /></div>
      <small>Fresh. Hot. Home-style.</small>
    </div>
  );
};

Splash.propTypes = {
  onDone: PropTypes.func.isRequired,
};

export default Splash;
