import axios from "axios";
import { createContext, useCallback, useEffect, useState } from "react";
import { menu_list } from "../assets/assets";
// eslint-disable-next-line react-refresh/only-export-components
export const StoreContext = createContext(null);
import PropTypes from "prop-types";

const StoreContextProvider = (props) => {
  const url = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const [food_list, setFoodList] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({});
  // cart key: "<foodId>__<Size>" so Half/Full/Small/Regular stay separate
  // guests keep their cart in localStorage so a refresh does not wipe it
  const [cartItems, setCartItems] = useState(() => {
    if (localStorage.getItem("token")) return {};
    try {
      return JSON.parse(localStorage.getItem("ab_guest_cart") || "{}");
    } catch {
      return {};
    }
  });
  const [token, setToken] = useState("");
  // global login popup (navbar + auto-open at checkout)
  const [showLogin, setShowLogin] = useState(false);
  // dark/light theme (default light)
  const [theme, setTheme] = useState(localStorage.getItem("ab_theme") || "dark");
  // wishlist (food _ids, local)
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ab_wishlist") || "[]");
    } catch {
      return [];
    }
  });
  // applied coupon { code, discount }
  const [coupon, setCoupon] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ab_coupon") || "null");
    } catch {
      return null;
    }
  });
  const [phone, setPhone] = useState(localStorage.getItem("ab_phone") || "");
  const [phoneVerified, setPhoneVerified] = useState(
    localStorage.getItem("ab_phone_verified") === "1"
  );

  // Server-matching price: Half/Small -> halfPrice, Full -> fullPrice,
  // Regular -> fullPrice for pizza else base price. INR.
  const priceFor = (food, size) => {
    if (!food) return 0;
    if (size === "Half" || size === "Small") {
      return food.halfPrice ?? Math.round(food.price / 2);
    }
    if (size === "Full" || (size === "Regular" && food.isPizza)) {
      return food.fullPrice ?? food.price;
    }
    return food.price;
  };

  const isPizza = (food) => !!food?.isPizza;
  const hasHalfFull = (food) =>
    !isPizza(food) && food?.halfPrice != null && food?.fullPrice != null;
  const defaultSize = (food) =>
    isPizza(food) ? "Small" : hasHalfFull(food) ? "Half" : "Regular";
  const sizesFor = (food) =>
    isPizza(food) ? ["Small", "Regular"] : ["Half", "Full"];

  const cartKey = (id, size) => `${id}__${size}`;

  const addToCart = async (itemId, size = "Regular") => {
    const key = cartKey(itemId, size);
    setCartItems((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
    if (token) {
      try {
        await axios.post(url + "/api/cart/add", { itemId: key }, { headers: { token } });
      } catch (error) {
        // server rejected it — undo the optimistic update
        setCartItems((prev) => {
          const next = { ...prev };
          if (next[key] > 1) next[key] -= 1;
          else delete next[key];
          return next;
        });
        console.error("Could not sync cart:", error.message);
      }
    }
  };

  const removeFromCart = async (itemId, size = "Regular") => {
    const key = cartKey(itemId, size);
    setCartItems((prev) => {
      const next = { ...prev };
      if (next[key] > 1) next[key] -= 1;
      else delete next[key];
      return next;
    });
    if (token) {
      try {
        await axios.post(url + "/api/cart/remove", { itemId: key }, { headers: { token } });
      } catch (error) {
        // server rejected it — undo the optimistic update
        setCartItems((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
        console.error("Could not sync cart:", error.message);
      }
    }
  };

  // split a cart key back into food + size
  const parseKey = (key) => {
    const i = key.lastIndexOf("__");
    if (i === -1) return { id: key, size: "Regular" };
    return { id: key.slice(0, i), size: key.slice(i + 2) };
  };

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const key in cartItems) {
      const { id, size } = parseKey(key);
      const foodItem = food_list.find((item) => String(item._id) === id);
      if (foodItem) {
        totalAmount += cartItems[key] * priceFor(foodItem, size);
      }
    }
    return totalAmount;
  };

  // dish photo: Cloudinary full URL as-is, else backend /images/ file
  const imgUrl = (image) => {
    if (!image) return "";
    if (/^https?:\/\//.test(image)) return image;
    return url + "/images/" + image;
  };
  const cartLines = () => {
    return Object.entries(cartItems).map(([key, qty]) => {
      const { id, size } = parseKey(key);
      return { foodId: id, size, qty };
    });
  };

  // expired / invalid token → drop it so the login gate comes back cleanly
  const handleApiData = useCallback((data) => {
    if (data && !data.success && /expired|not authorized|login again/i.test(data.message || "")) {
      localStorage.removeItem("token");
      setToken("");
      setCartItems({});
    }
    return data;
  }, []);

  const fetchFoodList = useCallback(async () => {
    try {
      const response = await axios.get(url + "/api/food/list");
      setFoodList(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error("Could not load menu:", error.message);
      setFoodList([]);
    }
  }, [url]);

  const fetchReviewSummary = useCallback(async () => {
    try {
      const res = await axios.get(url + "/api/review/summary");
      if (res.data?.success) setReviewSummary(res.data.data || {});
    } catch {
      setReviewSummary({});
    }
  }, [url]);

  const loadCartData = useCallback(async (tok) => {
    try {
      const response = await axios.post(
        url + "/api/cart/get",
        {},
        { headers: { token: tok } }
      );
      handleApiData(response.data);
      setCartItems(response.data?.cartData || {});
    } catch (error) {
      console.error("Could not load cart:", error.message);
    }
  }, [url, handleApiData]);

  // ---- OTP (Indian mobiles, +91) ----
  const requestOtp = async (mobile) => {
    const response = await axios.post(
      url + "/api/otp/request",
      { phone: mobile },
      { headers: { token } }
    );
    return handleApiData(response.data);
  };

  const verifyOtp = async (mobile, otp) => {
    const response = await axios.post(
      url + "/api/otp/verify",
      { phone: mobile, otp },
      { headers: { token } }
    );
    const data = handleApiData(response.data);
    if (data.success) {
      setPhone(mobile);
      setPhoneVerified(true);
      localStorage.setItem("ab_phone", mobile);
      localStorage.setItem("ab_phone_verified", "1");
    }
    return data;
  };

  const clearPhone = () => {
    setPhone("");
    setPhoneVerified(false);
    localStorage.removeItem("ab_phone");
    localStorage.removeItem("ab_phone_verified");
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("ab_theme", theme);
  }, [theme]);

  // guests: persist cart locally; logged-in users keep it on the server
  useEffect(() => {
    if (!token) localStorage.setItem("ab_guest_cart", JSON.stringify(cartItems));
  }, [cartItems, token]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  // keep guest cart from leaking into a logged-in session (and vice versa)
  const updateToken = (tok) => {
    setToken(tok);
    if (tok) localStorage.removeItem("ab_guest_cart");
    else setCartItems({});
  };

  const toggleWish = (id) => {
    setWishlist((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("ab_wishlist", JSON.stringify(next));
      return next;
    });
  };

  const applyCoupon = (c) => {
    setCoupon(c);
    if (c) localStorage.setItem("ab_coupon", JSON.stringify(c));
    else localStorage.removeItem("ab_coupon");
  };

  useEffect(() => {
    async function loadData() {
      await fetchFoodList();
      fetchReviewSummary();
      if (localStorage.getItem("token")) {
        const tok = localStorage.getItem("token");
        setToken(tok);
        await loadCartData(tok);
      }
    }
    loadData();
  }, [fetchFoodList, loadCartData, fetchReviewSummary]);

  const contextValue = {
    url,
    imgUrl,
    food_list,
    menu_list,
    reviewSummary,
    refreshReviews: fetchReviewSummary,
    cartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    cartLines,
    parseKey,
    priceFor,
    isPizza,
    hasHalfFull,
    defaultSize,
    sizesFor,
    token,
    setToken: updateToken,
    showLogin,
    setShowLogin,
    theme,
    toggleTheme,
    wishlist,
    toggleWish,
    coupon,
    applyCoupon,
    loadCartData,
    setCartItems,
    phone,
    phoneVerified,
    requestOtp,
    verifyOtp,
    clearPhone,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

StoreContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default StoreContextProvider;
