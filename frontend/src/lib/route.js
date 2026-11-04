import axios from "axios";

// Road-following route via OSRM (free public demo server, no API key).
// Returns real road geometry (with turns) + distance/duration.
// from/to = [lat, lng]
export async function getRoadRoute(from, to) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
  const res = await axios.get(url, { timeout: 8000 });
  const r = res.data?.routes?.[0];
  if (!r || !r.geometry?.coordinates?.length) throw new Error("no route");
  const coords = r.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  return { coords, distance: r.distance, duration: r.duration };
}