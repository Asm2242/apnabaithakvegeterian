import { useState } from "react";
import Header from "../../components/Header/Header";
import ExploreMenu from "../../components/ExploreMenu/ExploreMenu";
import FoodDisplay from "../../components/FoodDisplay/FoodDisplay";
import AppDownload from "../../components/AppDownload/AppDownload";
import "./Home.css";

const Home = () => {
  const [category, setCategory] = useState("All");

  return (
    <>
      <Header />
      <div className="home-offer-strip">
        <span className="home-offer-code">WELCOME50</span>
        <span>First order? Get <b>₹50 OFF</b> above ₹149 • Free delivery above ₹399 • Open 7:30 AM – 10 PM</span>
      </div>
      <ExploreMenu setCategory={setCategory} category={category} />
      <FoodDisplay category={category} />
      <AppDownload />
    </>
  );
};

export default Home;
