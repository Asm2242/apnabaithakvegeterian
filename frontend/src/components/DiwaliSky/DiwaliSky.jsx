import "./DiwaliSky.css";

// Firework burst positions/colors — reused by the hero too.
export const FIREWORKS = [
  { top: "10%", left: "10%", c: "#FFD54F", d: "0s", s: 1 },
  { top: "6%", left: "38%", c: "#FF4FA0", d: "0.8s", s: 1.35 },
  { top: "13%", left: "66%", c: "#FF8A3D", d: "1.6s", s: 0.9 },
  { top: "24%", left: "24%", c: "#B388FF", d: "2.2s", s: 1.1 },
  { top: "20%", left: "54%", c: "#FFD54F", d: "2.8s", s: 0.85 },
  { top: "28%", left: "82%", c: "#FF6F00", d: "1.2s", s: 1.2 },
  { top: "40%", left: "6%", c: "#FF4FA0", d: "3.1s", s: 0.8 },
  { top: "36%", left: "90%", c: "#FFD54F", d: "2.4s", s: 1.05 },
];

export const FireworkBursts = ({ field = "fw-field" }) => (
  <div className={field} aria-hidden="true">
    {FIREWORKS.map((b, i) => (
      <div
        key={i}
        className="fw-wrap"
        style={{ top: b.top, left: b.left, transform: `scale(${b.s})` }}
      >
        <div className="fw" style={{ "--c": b.c, "--d": b.d }} />
      </div>
    ))}
  </div>
);

// Global Diwali night sky: twinkling stars + fireworks behind all content.
const DiwaliSky = () => (
  <div className="diwali-sky" aria-hidden="true">
    <div className="dw-stars" />
    <FireworkBursts field="fw-global" />
  </div>
);

export default DiwaliSky;