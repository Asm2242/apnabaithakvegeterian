import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

const pinIcon = L.divIcon({
  className: "lp-pin",
  html: "<div>📍</div>",
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

  const useGps = () => {
    if (!navigator.geolocation) {
      toast.error("GPS nahi mila — map par tap karo");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        pick([p.coords.latitude, p.coords.longitude]);
        setLocating(false);
        toast.success("Location mil gayi!");
      },
      () => {
        setLocating(false);
        toast.error("Location nahi mili — map par tap karo");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const done = (pin) => {
    localStorage.setItem("ab_loc_asked", "1");
    if (pin) localStorage.setItem("ab_pin", JSON.stringify(pin));
    onDone(pin || null);
  };

  return (
    <div className="otp-gate">
      <div className="otp-gate-card loc-gate-card">
        <p className="otp-gate-logo">📍 Delivery location</p>
        <p className="otp-gate-sub">Apna kahan khana bhejein?</p>
        <div className="loc-gate-btns">
          <button onClick={useGps} disabled={locating} className="otp-gate-btn">
            {locating ? "Dhoond raha hai…" : "📡 Current location use karo"}
          </button>
        </div>
        <p className="loc-or">— ya map par tap karke pin lagao —</p>
        <MapContainer center={pos || fallback} zoom={14} scrollWheelZoom={false} className="loc-gate-map">
          <Recenter pos={pos} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
            {pos ? "✅ Confirm pin" : "Confirm (bina pin)"}
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
