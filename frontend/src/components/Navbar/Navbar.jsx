import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../Context/StoreContext";
import "./Navbar.css";
import PropTypes from "prop-types";

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const { cartItems, wishlist, token, setToken, theme, toggleTheme } = useContext(StoreContext);
  const navigate = useNavigate();

  const close = () => setOpen(false);
  const cartCount = Object.values(cartItems || {}).reduce((a, b) => a + (b || 0), 0);
  const wishCount = (wishlist || []).length;

  const doSearch = (e) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    navigate(`/menu?q=${encodeURIComponent(query)}`);
    setQ("");
    setSearchOpen(false);
    close();
  };

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
        <button
          className="nav-icon-btn"
          onClick={() => setSearchOpen((o) => !o)}
          aria-label="Search"
          title="Search dishes"
        >
          <img src={assets.search_icon} alt="" />
        </button>
        <Link to="/wishlist" className="nav-icon-btn wish-link" onClick={close} title="My wishlist">
          <span className="wish-heart">❤</span>
          {wishCount > 0 && <span className="icon-badge wish-badge">{wishCount}</span>}
        </Link>
        <Link to="/cart" className="nav-icon-btn cart-link" onClick={close} title="Cart">
          <img src={assets.basket_icon} alt="Cart" />
          {cartCount > 0 && <span className="icon-badge cart-badge">{cartCount}</span>}
        </Link>
        {!token ? (
          <button className="signin-btn" onClick={() => setShowLogin(true)}>Sign In</button>
        ) : (
          <div className="navbar-profile">
            <img src={assets.profile_icon} alt="" />
            <ul className="navbar-profile-dropdown">
              <li onClick={() => navigate("/profile")}>
                {" "}
                <img src={assets.profile_icon} alt="" /> <p>Profile</p>
              </li>
              <li onClick={() => navigate("/wishlist")}>
                {" "}
                <span className="drop-heart">❤</span> <p>Wishlist</p>
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
      {searchOpen && (
        <form className="navbar-search-bar" onSubmit={doSearch}>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search dishes… e.g. paneer, momos, thali"
          />
          <button type="submit" className="ns-go">Search</button>
          <button type="button" className="ns-close" onClick={() => setSearchOpen(false)}>✕</button>
        </form>
      )}
    </div>
  );
};

Navbar.propTypes = {
  setShowLogin: PropTypes.func.isRequired,
};

export default Navbar;
