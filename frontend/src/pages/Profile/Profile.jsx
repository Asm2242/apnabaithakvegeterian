import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { StoreContext } from "../../Context/StoreContext";
import "./Profile.css";

// Profile: saved address, wishlist, orders, coupons
const Profile = () => {
  const { url, token, food_list, wishlist, toggleWish, addToCart, phone } =
    useContext(StoreContext);
  const navigate = useNavigate();
  const [addr, setAddr] = useState({ street: "", city: "Lucknow", state: "Uttar Pradesh", zipcode: "", country: "India", landmark: "" });
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    if (!token) {
      navigate("/cart");
      return;
    }
    axios
      .get(url + "/api/user/address", { headers: { token } })
      .then((res) => {
        if (res.data.success && res.data.address) {
          setAddr((a) => ({ ...a, ...res.data.address }));
        }
      })
      .catch(() => {});
    axios
      .get(url + "/api/coupon/list")
      .then((res) => {
        if (res.data.success) setCoupons(res.data.data);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const save = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(url + "/api/user/address", addr, { headers: { token } });
      if (res.data.success) toast.success("Address saved!");
      else toast.error(res.data.message);
    } catch {
      toast.error("Save failed");
    }
  };

  const set = (k) => (e) => setAddr((a) => ({ ...a, [k]: e.target.value }));
  const wished = food_list.filter((f) => wishlist.includes(String(f._id)));

  return (
    <div className="profile">
      <h2>My Profile</h2>
      {phone && <p className="profile-phone">+91 {phone} ✓ verified</p>}

      <section className="card">
        <h3>Saved Address</h3>
        <form onSubmit={save}>
          <input value={addr.street} onChange={set("street")} placeholder="House / flat, street" />
          <div className="row2">
            <input value={addr.city} onChange={set("city")} placeholder="City" />
            <input value={addr.zipcode} onChange={set("zipcode")} placeholder="Pincode" />
          </div>
          <input value={addr.landmark} onChange={set("landmark")} placeholder="Landmark" />
          <button type="submit">Save address</button>
        </form>
      </section>

      <section className="card">
        <h3>My Wishlist ({wished.length})</h3>
        {wished.length === 0 && <p>No favourites yet — tap 🤍 on any dish.</p>}
        {wished.map((f) => (
          <div key={f._id} className="wish-row">
            <span>{f.name} — ₹{f.price}</span>
            <div>
              <button onClick={() => addToCart(String(f._id), "Regular")}>Add</button>
              <button onClick={() => toggleWish(String(f._id))} className="ghost">Remove</button>
            </div>
          </div>
        ))}
      </section>

      <section className="card">
        <h3>My Coupons</h3>
        {coupons.length === 0 && <p>No offers right now.</p>}
        {coupons.map((c) => (
          <div key={c._id} className="coupon-row">
            <b>{c.code}</b>
            <span>{c.description || `${c.type === "flat" ? `Rs.${c.value} off` : `${c.value}% off`} on Rs.${c.minOrder}+`}</span>
          </div>
        ))}
        <Link to="/myorders" className="link-btn">My Orders →</Link>
      </section>
    </div>
  );
};

export default Profile;
