import { useContext, useRef } from "react";
import { StoreContext } from "../../Context/StoreContext";
import "./ExploreMenu.css";
import PropTypes from "prop-types";

const ExploreMenu = ({ category, setCategory }) => {
  const { menu_list } = useContext(StoreContext);
  const rowRef = useRef(null);

  const scroll = (dir) => {
    rowRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <div className="explore-menu" id="explore-menu">
      <h1>Explore our pure veg menu</h1>
      <p className="explore-menu-text">
        81 dishes across 14 categories — thali, maggi, pizza, Chinese, momos
        and more. Everything 100% vegetarian, starting at just ₹10.
      </p>
      <div className="explore-menu-wrap">
        <button className="cat-arrow left" onClick={() => scroll(-1)} aria-label="Scroll categories left">‹</button>
        <div className="explore-menu-list" ref={rowRef}>
        {menu_list.map((item, index) => {
          return (
            <div
              onClick={() =>
                setCategory((prev) =>
                  prev === item.menu_name ? "All" : item.menu_name
                )
              }
              key={index}
              className="explore-menu-list-item"
            >
              <img
                src={item.menu_image}
                className={category === item.menu_name ? "active" : ""}
                alt=""
              />
              <p>{item.menu_name}</p>
            </div>
          );
        })}
        </div>
        <button className="cat-arrow right" onClick={() => scroll(1)} aria-label="Scroll categories right">›</button>
      </div>
      <hr />
    </div>
  );
};

ExploreMenu.propTypes = {
  category: PropTypes.string.isRequired,
  setCategory: PropTypes.func.isRequired,
};

export default ExploreMenu;
