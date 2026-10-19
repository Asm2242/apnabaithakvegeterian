import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../Context/StoreContext";
import "./Navbar.css";
import PropTypes from "prop-types";

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const [open, setOpen] = useState(false);
  const { getTotalCartAmount, token, setToken, theme, toggleTheme } = useContext(StoreContext);
  const navigate = useNavigate();

  const close = () => setOpen(false);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("ab_phone");
    localStorage.removeItem("ab_phone_verified");
    setToken("");
    navigate("/");
  };

  return (
    <div className={`navbar ${open ? "nav-open" : ""}`}>
      {/* <Link to='/'><img className='logo' src={assets.logo} alt="" /></Link> */}
      <Link to="/" className="brand" onClick={close}>
        <img className="brand-logo" src={assets.baithakLogo} alt="Apna Baithak logo" />
        <span className="text-logo">
          Apna Baithak
          <span>Pure Veg • Lucknow</span>
        </span>
      </Link>
      <ul className={`navbar-menu ${open ? "open" : ""}`}>
        <Link
          to="/"
          onClick={() => { setMenu("home"); close(); }}
          className={`${menu === "home" ? "active" : ""}`}
        >
          Home
        </Link>
        <Link
          to="/menu"
          onClick={() => { setMenu("menu"); close(); }}
          className={`${menu === "menu" ? "active" : ""}`}
        >
          Menu
        </Link>
        <a
          href="#app-download"
          onClick={() => { setMenu("mob-app"); close(); }}
          className={`${menu === "mob-app" ? "active" : ""}`}
        >
          Mobile app
        </a>
        <a
          href="#footer"
          onClick={() => { setMenu("contact"); close(); }}
          className={`${menu === "contact" ? "active" : ""}`}
        >
          Contact us
        </a>
      </ul>
      <div className="navbar-right">
        <button className="theme-btn" onClick={toggleTheme} title="Dark / light">
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        <img src={assets.search_icon} alt="" />
        <Link to="/cart" className="navbar-search-icon" onClick={close}>
          <img src={assets.basket_icon} alt="" />
          <div className={getTotalCartAmount() > 0 ? "dot" : ""}></div>
        </Link>
        {!token ? (
          <button onClick={() => setShowLogin(true)}>sign in</button>
        ) : (
          <div className="navbar-profile">
            <img src={assets.profile_icon} alt="" />
            <ul className="navbar-profile-dropdown">
              <li onClick={() => navigate("/profile")}>
                {" "}
                <img src={assets.profile_icon} alt="" /> <p>Profile</p>
              </li>
              <li onClick={() => navigate("/myorders")}>
                {" "}
                <img src={assets.bag_icon} alt="" /> <p>Orders</p>
              </li>
              <hr />
              <li onClick={logout}>
                {" "}
                <img src={assets.logout_icon} alt="" /> <p>Logout</p>
              </li>
            </ul>
          </div>
        )}
        <button
          className={`hamburger ${open ? "open" : ""}`}
          aria-label="Menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  );
};

Navbar.propTypes = {
  setShowLogin: PropTypes.func.isRequired,
};

export default Navbar;
