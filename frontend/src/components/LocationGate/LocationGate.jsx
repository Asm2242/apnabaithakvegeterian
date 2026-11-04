import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import { getPos } from "../../lib/location";

const pinIcon = L.divIcon({
  className: "lp-pin",
  html: "<div>ðŸ“</div>",
  iconSize: [36, 36],
  iconAnchor: [18, 32],
});

const TapToSet = ({ onPick }) => {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

TapToSet.propTypes = {
  onPick: PropTypes.func.isRequired,
};

// GPS/pin badalte hi map khud focus kare
const Recenter = ({ pos }) => {
  const map = useMap();
  const [first, setFirst] = useState(true);
  useEffect(() => {
    if (pos && !first) map.flyTo(pos, 15, { duration: 1 });
    if (first) setFirst(false);
  }, [pos, map]);
  return null;
};

// First-open gate: current location OR manual pin -> Confirm / Skip
const LocationGate = ({ onDone }) => {
  const [pos, setPos] = useState(null);
  const [locating, setLocating] = useState(false);
  const fallback = [26.9381402, 80.9129123];

  const pick = (p) => {
    setPos([Math.round(p[0] * 100000) / 100000, Math.round(p[1] * 100000) / 100000]);
  };

  const useGps = async () => {
    setLocating(true);
    try {
      const p = await getPos();
      pick([p.lat, p.lng]);
      toast.success("Location mil gayi!");
    } catch {
      toast.error("Location not found â€” tap on the map");
    }
    setLocating(false);
  };

  const done = (pin) => {
    localStorage.setItem("ab_loc_asked", "1");
    if (pin) localStorage.setItem("ab_pin", JSON.stringify(pin));
    onDone(pin || null);
  };

  return (
    <div className="otp-gate">
      <div className="otp-gate-card loc-gate-card">
        <p className="otp-gate-logo">ðŸ“ Delivery location</p>
        <p className="otp-gate-sub">Where should we deliver your food?</p>
        <div className="loc-gate-btns">
          <button onClick={useGps} disabled={locating} className="otp-gate-btn">
            {locating ? "Finding your locationâ€¦" : "ðŸ“¡ Use my current location"}
          </button>
        </div>
        <p className="loc-or">â€” or tap on the map to drop a pin â€”</p>
        <MapContainer center={pos || fallback} zoom={14} scrollWheelZoom={false} className="loc-gate-map">
          <Recenter pos={pos} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains={["a", "b", "c", "d"]}
          />
          <TapToSet onPick={pick} />
          {(pos || fallback) && (
            <Marker
              position={pos || fallback}
              icon={pinIcon}
              draggable
              eventHandlers={{ dragend: (e) => {
                const m = e.target.getLatLng();
                pick([m.lat, m.lng]);
              }}}
            />
          )}
        </MapContainer>
        <div className="loc-gate-btns row2">
          <button
            onClick={() => done(pos ? { lat: pos[0], lng: pos[1] } : null)}
            className="otp-gate-btn"
          >
            {pos ? "âœ… Confirm pin" : "Confirm (without pin)"}
          </button>
          <button onClick={() => done(null)} className="otp-gate-link">
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

LocationGate.propTypes = {
  onDone: PropTypes.func.isRequired,
};

export default LocationGate;

