import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./LiveMap.css";
import PropTypes from "prop-types";

export const SHOP = { lat: 26.9381402, lng: 80.9129123, name: "Apna Baithak, Eldeco City" };

// Blinkit-style pins (no image assets needed)
const shopIcon = L.divIcon({
  className: "lm-shop",
  html: "<div>🍽️</div>",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const riderIcon = L.divIcon({
  className: "lm-rider",
  html: "<div class='pulse'>🛵</div>",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const homeIcon = L.divIcon({
  className: "lm-home",
  html: "<div>🏠</div>",
  iconSize: [36, 36],
  iconAnchor: [18, 32],
});

// follow the rider as he moves
const FollowRider = ({ pos }) => {
  const map = useMap();
  useEffect(() => {
    if (pos) map.panTo(pos, { animate: true });
  }, [pos, map]);
  return null;
};

// first: zoom OUT to show shop+rider+customer together, then auto zoom IN to rider
const FitAll = ({ points, focus }) => {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || points.length === 0) return;
    done.current = true;
    try {
      map.fitBounds(L.latLngBounds(points), { padding: [30, 30] });
    } catch { /* ignore */ }
    if (focus) {
      const t = setTimeout(() => {
        try {
          map.flyTo(focus, 16, { duration: 1.5 });
        } catch { /* ignore */ }
      }, 2800);
      return () => clearTimeout(t);
    }
  }, [map]);
  return null;
};

FollowRider.propTypes = {
  pos: PropTypes.array,
};

// Live map: shop pin + moving rider pin + customer home pin + route (free OSM)
const LiveMap = ({ rider, riderLabel, customer }) => {
  const riderPos =
    rider && rider.lat != null ? [rider.lat, rider.lng] : null;
  const shopPos = [SHOP.lat, SHOP.lng];
  const custPos =
    customer && customer.lat != null ? [customer.lat, customer.lng] : null;
  const center = riderPos || custPos || shopPos;
  const allPoints = [shopPos, ...(riderPos ? [riderPos] : []), ...(custPos ? [custPos] : [])];

  return (
    <div className="live-map">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={false}
        className="live-map-box"
      >
        <FitAll points={allPoints} focus={riderPos} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={shopPos} icon={shopIcon}>
          <Popup>{SHOP.name}<br />7:30 AM – 10 PM</Popup>
        </Marker>
        {custPos && (
          <Marker position={custPos} icon={homeIcon}>
            <Popup>Your home 📍 (your dropped pin)</Popup>
          </Marker>
        )}
        {riderPos && (
          <>
            <Marker position={riderPos} icon={riderIcon}>
              <Popup>
                {rider.name || "Rider"} is here 🛵
                {rider.updatedAt ? <br /> : null}
                {rider.updatedAt
                  ? new Date(rider.updatedAt).toLocaleTimeString("en-IN")
                  : ""}
              </Popup>
            </Marker>
            <Polyline positions={[riderPos, custPos || shopPos]} color="#9a3412" weight={4} dashArray="8 8" />
            <FollowRider pos={riderPos} />
          </>
        )}
      </MapContainer>
      {riderLabel && <p className="live-caption">{riderLabel}</p>}
    </div>
  );
};

LiveMap.propTypes = {
  rider: PropTypes.object,
  riderLabel: PropTypes.string,
  customer: PropTypes.object,
};

export default LiveMap;
