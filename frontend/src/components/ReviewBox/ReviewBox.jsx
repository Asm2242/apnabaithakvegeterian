import { useContext, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../Context/StoreContext";
import "./ReviewBox.css";

const ReviewBox = ({ foodId, onRated }) => {
  const { url, token, setShowLogin } = useContext(StoreContext);
  const [open, setOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [avg, setAvg] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await axios.get(`${url}/api/review/${foodId}`);
      if (res.data.success) {
        setReviews(res.data.data || []);
        setAvg(res.data.avg || 0);
      }
    } catch {
      toast.error("Reviews load nahi hue");
    }
  };

  const toggle = () => {
    if (!open) load();
    setOpen((o) => !o);
  };

  const submit = async () => {
    if (!token) {
      toast.info("Rate karne ke liye login karein");
      setShowLogin(true);
      return;
    }
    setBusy(true);
    try {
      const res = await axios.post(
        url + "/api/review",
        { foodId, rating, comment },
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        await load();
        onRated?.();
        setComment("");
      } else {
        toast.error(res.data.message);
      }
    } catch {
      toast.error("Review save nahi hua");
    }
    setBusy(false);
  };

  return (
    <div className="review-box">
      <button type="button" className="review-toggle" onClick={toggle}>
        <span>★</span> {open ? "Close" : "Review"}
        {avg > 0 && <em>{avg.toFixed(1)}</em>}
      </button>
      {open && (
        <div className="review-panel">
          <div className="review-stars" role="group" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} star`}
                className={n <= rating ? "on" : ""}
                onClick={() => setRating(n)}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Kya bola? (optional)"
            maxLength={500}
            rows={2}
          />
          <button type="button" className="review-submit" onClick={submit} disabled={busy}>
            {busy ? "Saving…" : "Submit review"}
          </button>
          {avg > 0 && <div className="review-avg">★ {avg.toFixed(1)} / 5 • {reviews.length} review{reviews.length > 1 ? "s" : ""}</div>}
          {reviews.slice(0, 3).map((r) => (
            <div key={r._id} className="review-row">
              <b>{r.userName}</b> <span>★{r.rating}</span>
              {r.comment && <p>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

ReviewBox.propTypes = {
  foodId: PropTypes.string.isRequired,
  onRated: PropTypes.func,
};

export default ReviewBox;
