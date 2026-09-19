import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "react-toastify";
import { StoreContext } from "../../Context/StoreContext";
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
  useEffect(() => {
    if (pos) map.flyTo(pos, 16, { duration: 1 });
  }, [pos, map]);
  return null;
};

// Checkout address popup: last pin confirm / edit / add new / switch / GPS
const AddressPopup = ({ onConfirm, onClose }) => {
  const { url, token } = useContext(StoreContext);
  const [list, setList] = useState([]);
  const [sel, setSel] = useState(null); // address object or "new"
  const [pin, setPin] = useState(null);
  const [label, setLabel] = useState("");
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const fallback = [26.9381402, 80.9129123];

  useEffect(() => {
    axios
      .get(url + "/api/user/addresses", { headers: { token } })
      .then((res) => {
        if (res.data.success) {
          const arr = res.data.data || [];
          setList(arr);
          if (arr.length > 0) {
            setSel(arr[0]);
            if (arr[0].lat != null) setPin([arr[0].lat, arr[0].lng]);
          } else {
            // first checkout ever: try gate pin, else GPS hint
            try {
              const saved = JSON.parse(localStorage.getItem("ab_pin") || "null");
              if (saved) setPin([saved.lat, saved.lng]);
            } catch { /* ignore */ }
            setSel("new");
          }
        }
      })
      .catch(() => setSel("new"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = (p) => {
    setPin([Math.round(p[0] * 100000) / 100000, Math.round(p[1] * 100000) / 100000]);
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
        toast.success("Current location pin ho gaya!");
      },
      () => {
        setLocating(false);
        toast.error("Location nahi mili — map par tap karo");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const choose = (a) => {
    setSel(a);
    if (a && a !== "new" && a.lat != null) setPin([a.lat, a.lng]);
    if (a === "new") setLabel("");
  };

  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (sel === "new") {
        // save as new address (details filled in checkout form after)
        const res = await axios.post(
          url + "/api/user/addresses",
          {
            label: label || `Address ${list.length + 1}`,
            street: "", city: "Lucknow", state: "Uttar Pradesh",
            zipcode: "226013", country: "India", landmark: "",
            lat: pin?.[0] ?? null, lng: pin?.[1] ?? null,
          },
          { headers: { token } }
        );
        if (!res.data.success) {
          toast.error(res.data.message);
          setBusy(false);
          return;
        }
        const created = (res.data.data || []).slice(-1)[0];
        onConfirm({ addr: created || null, pin, isNew: true });
      } else if (sel) {
        await axios.post(url + `/api/user/addresses/use/${sel._id}`, {}, { headers: { token } });
        // pin edited? update it
        if (pin && (pin[0] !== sel.lat || pin[1] !== sel.lng)) {
          await axios.put(
            url + `/api/user/addresses/${sel._id}`,
            { ...sel, lat: pin[0], lng: pin[1] },
            { headers: { token } }
          );
        }
        onConfirm({ addr: sel, pin, isNew: false });
      } else {
        // no saved address at all — pin only
        onConfirm({ addr: null, pin, isNew: true });
      }
    } catch {
      toast.error("Save fail. Phir try karo.");
    }
    setBusy(false);
  };

  return (
    <div className="addr-pop">
      <div className="addr-pop-card">
        <h3>📍 Delivery address chuno</h3>

        {list.length > 0 && (
          <div className="addr-list">
            {list.map((a) => (
              <label key={a._id} className={sel?._id === a._id ? "active" : ""}>
                <input
                  type="radio"
                  checked={sel?._id === a._id}
                  onChange={() => choose(a)}
                />
                <span>
                  <b>{a.label || "Address"}</b> — {a.street || "pin only"}
                  {a.lat != null ? " 📍" : ""}
                </span>
              </label>
            ))}
            <label className={sel === "new" ? "active" : ""}>
              <input
                type="radio"
                checked={sel === "new"}
                onChange={() => choose("new")}
              />
              <span><b>➕ Add new address</b></span>
            </label>
          </div>
        )}

        {sel === "new" && (
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Naam do — Home / Office (optional)"
            className="addr-label"
          />
        )}

        <div className="addr-map-row">
          <button type="button" onClick={useGps} disabled={locating} className="gps-btn">
            {locating ? "Dhoond raha hai…" : "📡 Current location par pin"}
          </button>
        </div>
        <MapContainer center={pin || fallback} zoom={15} scrollWheelZoom={false} className="addr-map">
          <Recenter pos={pin} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <TapToSet onPick={pick} />
          {(pin || fallback) && (
            <Marker
              position={pin || fallback}
              icon={pinIcon}
              draggable
              eventHandlers={{ dragend: (e) => {
                const m = e.target.getLatLng();
                pick([m.lat, m.lng]);
              }}}
            />
          )}
        </MapContainer>
        <p className="addr-hint">
          {pin
            ? `Pin: ${pin[0].toFixed(5)}, ${pin[1].toFixed(5)} — tap karke badlo`
            : "Map par tap karo ya GPS dabao"}
        </p>

        <div className="addr-actions">
          <button onClick={confirm} disabled={busy} className="confirm-btn">
            {busy ? "Saving…" : "✅ Confirm address"}
          </button>
          <button onClick={onClose} className="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
};

AddressPopup.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AddressPopup;
