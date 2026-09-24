import { Geolocation } from "@capacitor/geolocation";

// Unified GPS: native permission dialog inside the app,
// browser prompt on the website. Same API both places.
export async function ensurePermission() {
  try {
    const s = await Geolocation.checkPermissions();
    if (s.location !== "granted" && s.coarseLocation !== "granted") {
      const r = await Geolocation.requestPermissions();
      return r.location === "granted" || r.coarseLocation === "granted";
    }
    return true;
  } catch {
    return true; // browser will prompt on its own
  }
}

export async function getPos(timeout = 12000) {
  try {
    await ensurePermission();
  } catch { /* ignore */ }
  const p = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    timeout,
  });
  return {
    lat: p.coords.latitude,
    lng: p.coords.longitude,
    accuracy: p.coords.accuracy || 0,
  };
}

export async function watchPos(onFix, onErr) {
  try {
    await ensurePermission();
  } catch { /* ignore */ }
  const id = await Geolocation.watchPosition(
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    (pos, err) => {
      if (err) {
        if (onErr) onErr(err);
        return;
      }
      if (pos) {
        onFix({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy || 0,
        });
      }
    }
  );
  return () => Geolocation.clearWatch({ id });
}
