//import React from 'react'
import { assets } from "../../assets/assets";
import "./AppDownload.css";

const AppDownload = () => {
  return (
    <>
      <div className="bulk-strip">
        <div>
          <h3>Bulk Catering & Party Orders 🎉</h3>
          <p>Birthday • Family functions • Kitty parties • Small gatherings</p>
        </div>
        <a href="tel:+919454999442">📞 +91 94549 99442</a>
      </div>
      <div className="app-download" id="app-download">
        <p>
          For Better Experience Download <br />
          Apna Baithak App
        </p>
        <div className="app-download-platforms">
          <img src={assets.play_store} alt="Play Store" />
          <img src={assets.app_store} alt="App Store" />
        </div>
      </div>
    </>
  );
};

export default AppDownload;
