import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./LiveMap.css";
import PropTypes from "prop-types";

export const SHOP = { lat: 26.9381402, lng: 80.9129123, name: "Apna Baithak, Eldeco City" };

// Google-Maps-style teardrop pins (no image assets needed)
const makePin = (emoji, bg) =>
  L.divIcon({
    className: "gm-pin",
    html: `<div class="gm-pin-body" style="background:${bg}"><span>${emoji}</span></div>`,
    iconSize: [34, 46],
    iconAnchor: [17, 44],
    popupAnchor: [0, -42],
  });

const shopIcon = makePin("🍽️", "linear-gradient(135deg,#FF8F00,#E65100)");
const homeIcon = makePin("🏠", "linear-gradient(135deg,#EF5350,#B71C1C)");

const riderIcon = L.divIcon({
  className: "gm-rider",
  html: `<div class="gm-rider-body"><div class="gm-rider-pulse"></div><span>🛵</span></div>`,
  iconSize: [46, 46],
  iconAnchor: [23, 23],
  popupAnchor: [0, -26],
});

// (removed: replaced by FitBoth)

// rider + customer hamesha ek saath: door ho to zoom OUT,
// paas aaye to khud zoom IN (har location update par)
const FitBoth = ({ riderPos, custPos }) => {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    try {
      if (riderPos && custPos) {
        const b = L.latLngBounds([riderPos, custPos]);
        if (first.current) {
          map.fitBounds(b, { padding: [50, 50] });
          first.current = false;
        } else {
          map.flyToBounds(b, { padding: [50, 50], duration: 1.2 });
        }
      } else if (riderPos || custPos) {
        map.setView(riderPos || custPos, 14);
      }
    } catch { /* ignore */ }
  }, [riderPos, custPos, map]);
  return null;
};

// (removed: replaced by FitBoth)


// Live map: shop pin + moving rider pin + customer home pin + route (free OSM)
const LiveMap = ({ rider, riderLabel, customer }) => {
  const riderPos =
    rider && rider.lat != null ? [rider.lat, rider.lng] : null;
  const shopPos = [SHOP.lat, SHOP.lng];
  const custPos =
    customer && customer.lat != null ? [customer.lat, customer.lng] : null;
  const center = riderPos || custPos || shopPos;

  return (
    <div className="live-map">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={false}
        className="live-map-box"
      >
        <FitBoth riderPos={riderPos} custPos={custPos} />
        {/* Google-Maps-style basemap — CARTO Voyager (free, no API key) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains={["a", "b", "c", "d"]}
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
            {/* Google Navigation-style route: white casing + flowing blue line */}
            <Polyline
              positions={[riderPos, custPos || shopPos]}
              pathOptions={{ color: "#ffffff", weight: 10, opacity: 0.9 }}
            />
            <Polyline
              positions={[riderPos, custPos || shopPos]}
              pathOptions={{ color: "#1A73E8", weight: 5, opacity: 0.95, className: "live-route-anim" }}
            />
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
