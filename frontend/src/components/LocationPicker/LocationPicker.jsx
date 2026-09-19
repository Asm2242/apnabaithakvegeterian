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

// tap map to move pin
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
    if (pos && !first) map.flyTo(pos, 16, { duration: 1 });
    if (first) setFirst(false);
  }, [pos, map]);
  return null;
};

// Checkout location picker: tap map / drag pin / GPS button
const LocationPicker = ({ value, onChange }) => {
  const [pos, setPos] = useState(value || null);
  const [locating, setLocating] = useState(false);
  const fallback = [26.9381402, 80.9129123]; // Eldeco City

  const pick = (p) => {
    setPos(p);
    onChange({ lat: Math.round(p[0] * 100000) / 100000, lng: Math.round(p[1] * 100000) / 100000 });
  };

  const useGps = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (p.coords.accuracy && p.coords.accuracy > 500) {
          toast.info("GPS weak hai — bahar khule me try karo");
        }
        pick([p.coords.latitude, p.coords.longitude]);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  return (
    <div className="loc-picker">
      <div className="loc-head">
        <span>📍 Delivery location pin</span>
        <button type="button" onClick={useGps} disabled={locating}>
          {locating ? "Locating…" : "📡 Use my location"}
        </button>
      </div>
      <MapContainer center={pos || fallback} zoom={15} scrollWheelZoom={false} className="loc-map">
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
      <p className="loc-hint">
        {pos
          ? `Pin: ${pos[0].toFixed(5)}, ${pos[1].toFixed(5)} — rider seedha yahin ayega`
          : "Map par tap karo ya GPS dabao — rider seedha pin par ayega"}
      </p>
    </div>
  );
};

LocationPicker.propTypes = {
  value: PropTypes.array,
  onChange: PropTypes.func.isRequired,
};

export default LocationPicker;
