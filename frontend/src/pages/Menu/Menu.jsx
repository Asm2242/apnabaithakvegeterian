import { useContext, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { StoreContext } from "../../Context/StoreContext";
import FoodItem from "../../components/FoodItem/FoodItem";
import "./Menu.css";

const SORTS = [
  { key: "popular", label: "⭐ Popular" },
  { key: "price-asc", label: "💸 Price: Low → High" },
  { key: "price-desc", label: "💰 Price: High → Low" },
  { key: "name", label: "🔤 Name: A → Z" },
];

// Separate full menu page: search + category pills + sort + all dishes
const Menu = () => {
  const { food_list, menu_list } = useContext(StoreContext);
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("popular");

  const active = params.get("category") || "All";
  const setCategory = (c) => {
    if (c === "All") params.delete("category");
    else params.set("category", c);
    setParams(params);
  };

  const countOf = (c) =>
    c === "All" ? food_list.length : food_list.filter((f) => f.category === c).length;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = food_list.filter((f) => {
      if (active !== "All" && f.category !== active) return false;
      if (q && !`${f.name} ${f.description || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => (a.halfPrice ?? a.price) - (b.halfPrice ?? b.price));
        break;
      case "price-desc":
        list = [...list].sort((a, b) => (b.halfPrice ?? b.price) - (a.halfPrice ?? a.price));
        break;
      case "name":
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        list = [...list].sort((a, b) => (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0));
    }
    return list;
  }, [food_list, active, query, sort]);

  return (
    <div className="menu-page">
      <div className="menu-hero">
        <h1>Full Menu</h1>
        <p>
          {shown.length} dishes {active !== "All" ? `in ${active}` : "across 14 categories"} • 100% pure veg 🟢
        </p>
      </div>

      <div className="menu-toolbar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search… e.g. paneer, momos, thali"
          className="menu-search"
        />
        <div className="sort-box">
          <span className="sort-label">Sort by</span>
          <div className="sort-chips">
            {SORTS.map((s) => (
              <button
                key={s.key}
                className={`sort-chip ${sort === s.key ? "active" : ""}`}
                onClick={() => setSort(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="menu-pills">
        <button className={active === "All" ? "active" : ""} onClick={() => setCategory("All")}>
          All <span className="pill-count">{countOf("All")}</span>
        </button>
        {menu_list.map((c) => (
          <button
            key={c.menu_name}
            className={active === c.menu_name ? "active" : ""}
            onClick={() => setCategory(c.menu_name)}
          >
            {c.menu_name} <span className="pill-count">{countOf(c.menu_name)}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="menu-empty">
          <span className="empty-emoji">🍽️</span>
          <p>No dishes found. Try another search.</p>
        </div>
      ) : (
        <div className="menu-grid">
          {shown.map((item, i) => (
            <FoodItem
              key={item._id}
              image={item.image}
              name={item.name}
              desc={item.description}
              price={item.price}
              id={item._id}
              food={item}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Menu;