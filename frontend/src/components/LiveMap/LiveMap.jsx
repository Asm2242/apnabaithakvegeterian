import { useEffect } from "react";
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

// follow the rider as he moves
const FollowRider = ({ pos }) => {
  const map = useMap();
  useEffect(() => {
    if (pos) map.panTo(pos, { animate: true });
  }, [pos, map]);
  return null;
};

FollowRider.propTypes = {
  pos: PropTypes.array,
};

// Live map: shop pin + moving rider pin + route line (free OpenStreetMap)
const LiveMap = ({ rider, riderLabel }) => {
  const riderPos =
    rider && rider.lat != null ? [rider.lat, rider.lng] : null;
  const shopPos = [SHOP.lat, SHOP.lng];
  const center = riderPos || shopPos;

  return (
    <div className="live-map">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={false}
        className="live-map-box"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={shopPos} icon={shopIcon}>
          <Popup>{SHOP.name}<br />7:30 AM – 10 PM</Popup>
        </Marker>
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
            <Polyline positions={[shopPos, riderPos]} color="#9a3412" weight={4} dashArray="8 8" />
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
};

export default LiveMap;
