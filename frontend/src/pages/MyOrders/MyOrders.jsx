import { useContext, useEffect, useState } from "react";
import "./MyOrders.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { StoreContext } from "../../Context/StoreContext";
import { assets } from "../../assets/assets";

const MyOrders = () => {
  const [data, setData] = useState([]);
  const { url, token, food_list, addToCart } = useContext(StoreContext);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    const response = await axios.post(
      url + "/api/order/userorders",
      {},
      { headers: { token } }
    );
    setData(response.data.data);
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  // idea #2: one-tap reorder — same items back to cart
  const reorder = (order) => {
    let added = 0;
    let skipped = 0;
    for (const it of order.items || []) {
      const food = food_list.find((f) => String(f._id) === String(it.foodId || it._id));
      if (!food || food.available === false) {
        skipped++;
        continue;
      }
      const qty = it.qty ?? it.quantity ?? 1;
      for (let i = 0; i < Math.min(qty, 20); i++) {
        addToCart(String(food._id), it.size || "Regular");
      }
      added++;
    }
    if (added > 0) {
      toast.success("Items added back to cart!");
      navigate("/cart");
    }
    if (skipped > 0) toast.info(`${skipped} item(s) unavailable, skipped`);
    if (added === 0 && skipped === 0) toast.error("Nothing to reorder");
  };

  return (
    <div className="my-orders">
      <h2>My Orders</h2>
      <div className="container">
        {data.map((order, index) => {
          return (
            <div key={index} className="my-orders-order">
              <img src={assets.parcel_icon} alt="" />
              <p>
                {order.items.map((item, index) => {
                  const q = item.qty ?? item.quantity ?? 1;
                  const label = `${item.name}${item.size ? ` (${item.size})` : ""} x ${q}`;
                  if (index === order.items.length - 1) {
                    return label;
                  } else {
                    return label + ", ";
                  }
                })}
              </p>
              <p>₹{order.amount}.00</p>
              <p>Items: {order.items.length}</p>
              <p>
                <span>&#x25cf;</span> <b>{order.status}</b>
                {order.paymentMethod === "cod" ? " • Pay cash on delivery" : order.paymentStatus === "PAID" ? " • Paid" : ""}
              </p>
              <div className="order-actions">
                <button onClick={() => navigate(`/track/${order._id}`)}>Track Order</button>
                <button onClick={() => reorder(order)} className="reorder">Order Again</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyOrders;
