import { useContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../Context/StoreContext";
import "./Feedback.css";

// Customer feedback form — sits right above the footer on every page.
const Feedback = () => {
  const { url } = useContext(StoreContext);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please write your feedback first");
      return;
    }
    setBusy(true);
    try {
      const res = await axios.post(url + "/api/feedback", { name, rating, message });
      if (res.data.success) {
        toast.success(res.data.message);
        setDone(true);
      } else toast.error(res.data.message);
    } catch {
      toast.error("Could not send feedback. Please try again.");
    }
    setBusy(false);
  };

  return (
    <section className="feedback-section" id="feedback">
      <div className="feedback-card">
        <span className="fb-diya">🪔</span>
        <h2>We'd love your feedback!</h2>
        <p className="fb-sub">
          How was your Apna Baithak experience? Your words help our kitchen get better.
        </p>

        {done ? (
          <div className="fb-thanks">
            <span className="fb-thanks-emoji">🎉</span>
            <p><b>Thank you!</b> Your feedback reached the kitchen.</p>
            <button type="button" className="fb-again" onClick={() => setDone(false)}>
              Send more feedback
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="fb-form">
            <div className="fb-stars">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={n <= rating ? "fb-star on" : "fb-star"}
                  onClick={() => setRating(n)}
                  aria-label={`${n} star`}
                >
                  ★
                </button>
              ))}
              <span className="fb-rating-text">{rating}/5</span>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Your name (optional)"
              maxLength={40}
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about the food, delivery, service…"
              rows={3}
              maxLength={600}
              required
            />
            <button type="submit" className="fb-send" disabled={busy}>
              {busy ? "Sending…" : "Send Feedback 💌"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default Feedback;