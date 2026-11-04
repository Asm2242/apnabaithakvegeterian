// CARTO basemap tile URL (Google-Maps-like look).
// Key comes from your CARTO welcome email; set VITE_CARTO_KEY in env.
const KEY = import.meta.env.VITE_CARTO_KEY || "";

export const voyagerUrl = () =>
  `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${KEY ? `?key=${KEY}` : ""}`;

export const cartoAttribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const CARTO_SUBDOMAINS = ["a", "b", "c", "d"];

// Road-following route via OSRM (free, no key). from/to = [lat, lng]
export async function getRoadRoute(from, to) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("route fetch failed");
  const data = await res.json();
  const r = data?.routes?.[0];
  if (!r || !r.geometry?.coordinates?.length) throw new Error("no route");
  return {
    coords: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distance: r.distance,
    duration: r.duration,
  };
}