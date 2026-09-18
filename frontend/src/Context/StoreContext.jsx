import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { menu_list } from "../assets/assets";
export const StoreContext = createContext(null);
import PropTypes from "prop-types";

const StoreContextProvider = (props) => {
  const url = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const [food_list, setFoodList] = useState([]);
  // cart key: "<foodId>__<Size>" so Half/Full/Small/Regular stay separate
  const [cartItems, setCartItems] = useState({});
  const [token, setToken] = useState("");
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
      await axios.post(
        url + "/api/cart/add",
        { itemId: key },
        { headers: { token } }
      );
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
      await axios.post(
        url + "/api/cart/remove",
        { itemId: key },
        { headers: { token } }
      );
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

  // flattened lines for checkout: [{ foodId, size, qty }]
  const cartLines = () => {
    return Object.entries(cartItems).map(([key, qty]) => {
      const { id, size } = parseKey(key);
      return { foodId: id, size, qty };
    });
  };

  const fetchFoodList = async () => {
    const response = await axios.get(url + "/api/food/list");
    setFoodList(response.data.data);
  };

  const loadCartData = async (tok) => {
    const response = await axios.post(
      url + "/api/cart/get",
      {},
      { headers: { token: tok } }
    );
    setCartItems(response.data.cartData || {});
  };

  // ---- OTP (Indian mobiles, +91) ----
  const requestOtp = async (mobile) => {
    const response = await axios.post(
      url + "/api/otp/request",
      { phone: mobile },
      { headers: { token } }
    );
    return response.data;
  };

  const verifyOtp = async (mobile, otp) => {
    const response = await axios.post(
      url + "/api/otp/verify",
      { phone: mobile, otp },
      { headers: { token } }
    );
    if (response.data.success) {
      setPhone(mobile);
      setPhoneVerified(true);
      localStorage.setItem("ab_phone", mobile);
      localStorage.setItem("ab_phone_verified", "1");
    }
    return response.data;
  };

  const clearPhone = () => {
    setPhone("");
    setPhoneVerified(false);
    localStorage.removeItem("ab_phone");
    localStorage.removeItem("ab_phone_verified");
  };

  useEffect(() => {
    async function loadData() {
      await fetchFoodList();
      if (localStorage.getItem("token")) {
        const tok = localStorage.getItem("token");
        setToken(tok);
        await loadCartData(tok);
      }
    }
    loadData();
  }, []);

  const contextValue = {
    url,
    food_list,
    menu_list,
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
    setToken,
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
