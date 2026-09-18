//import React from 'react'
import { assets } from "../../assets/assets";
import "./Footer.css";

const Footer = () => {
  return (
    <div className="footer" id="footer">
      <div className="footer-content">
        <div className="footer-content-left">
          <div className="brand brand-footer">
            <img className="brand-logo" src={assets.baithakLogo} alt="Apna Baithak logo" />
            <span className="text-logo">
              Apna Baithak
              <span>Pure Veg • Lucknow</span>
            </span>
          </div>
          <p>
            Apna Baithak Vegetarian Restaurant — 100% pure veg kitchen in
            Eldeco City, Lucknow. Fresh thalis, maggi, pizza, momos, Chinese
            and combos, served hot every day. Taste the Tradition • Feel
            the Comfort.
          </p>
          <div className="footer-social-icons">
            <a href="">
              <img src={assets.facebook_icon} alt="" />
            </a>
            <a href="">
              <img src={assets.twitter_icon} alt="" />
            </a>
            <a href="">
              <img src={assets.linkedin_icon} alt="" />
            </a>
          </div>
        </div>
        <div className="footer-content-center">
          <h2>COMPANY</h2>
          <ul>
            <li>Home</li>
            <li>About us</li>
            <li>Delivery</li>
            <li>Privacy policy</li>
          </ul>
        </div>
        <div className="footer-content-right">
          <h2>VISIT US</h2>
          <ul>
            <li>Shop No. LGF 11, Arcade 1, Eldeco City, IIM Road, Lucknow – 226013</li>
            <li>7:30 AM – 10:00 PM, All Days</li>
            <li>+91 94549 99442</li>
            <li>+91 82997 51213</li>
            <li>Owner: Abhay Singh</li>
          </ul>
        </div>
      </div>
      <hr />
      <p className="footer-copyright">
        Copyright {new Date().getFullYear()} © Apna Baithak Vegetarian Restaurant, Eldeco City, Lucknow - All Rights Reserved.
      </p>
    </div>
  );
};

export default Footer;
