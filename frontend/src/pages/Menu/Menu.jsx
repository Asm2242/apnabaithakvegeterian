import { useContext, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { StoreContext } from "../../Context/StoreContext";
import FoodItem from "../../components/FoodItem/FoodItem";
import "./Menu.css";

// Separate full menu page: search + category pills + all dishes
const Menu = () => {
  const { food_list, menu_list } = useContext(StoreContext);
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");

  const active = params.get("category") || "All";
  const setCategory = (c) => {
    if (c === "All") params.delete("category");
    else params.set("category", c);
    setParams(params);
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return food_list.filter((f) => {
      if (active !== "All" && f.category !== active) return false;
      if (q && !`${f.name} ${f.description || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [food_list, active, query]);

  return (
    <div className="menu-page">
      <div className="menu-hero">
        <h1>Full Menu</h1>
        <p>
          {shown.length} dishes {active !== "All" ? `in ${active}` : "across 14 categories"} • 100% pure veg 🟢
        </p>
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search… e.g. paneer, momos, thali"
        className="menu-search"
      />
      <div className="menu-pills">
        <button className={active === "All" ? "active" : ""} onClick={() => setCategory("All")}>
          All
        </button>
        {menu_list.map((c) => (
          <button
            key={c.menu_name}
            className={active === c.menu_name ? "active" : ""}
            onClick={() => setCategory(c.menu_name)}
          >
            {c.menu_name}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p>No dishes found. Try another search.</p>
      ) : (
        <div className="menu-grid">
          {shown.map((item) => (
            <FoodItem
              key={item._id}
              image={item.image}
              name={item.name}
              desc={item.description}
              price={item.price}
              id={item._id}
              food={item}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Menu;
