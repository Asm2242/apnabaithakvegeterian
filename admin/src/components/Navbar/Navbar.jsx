//import React from 'react'
import { assets } from "../../assets/assets";
import "./Navbar.css";

const Navbar = () => {
  return (
    <div className="navbar">
      {/* <img className='logo' src={assets.logo} alt="" /> */}
      <div>
        <img className="logo" src={assets.logo2} alt="" />
        <p>Admin Panel</p>
      </div>
      <img className="profile" src={assets.profile_image2} alt="" />
    </div>
  );
};

export default Navbar;
