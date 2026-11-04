// CARTO basemap tile URL (Google-Maps-like look).
// Key comes from your CARTO welcome email; set VITE_CARTO_KEY in env.
const KEY = import.meta.env.VITE_CARTO_KEY || "";

export const voyagerUrl = () =>
  `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${KEY ? `?key=${KEY}` : ""}`;

export const cartoAttribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const CARTO_SUBDOMAINS = ["a", "b", "c", "d"];