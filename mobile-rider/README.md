# Baithak Rider — Android App (wrapper)

Separate Capacitor wrapper. Website + app stay linked:
- **Same code:** builds `../rider` (rider web app)
- **Same backend:** `VITE_API_URL` at build time
- GPS uses native Geolocation plugin (works in WebView).

## Local (needs Android Studio)
```
npm install
npm run build:web
npx cap add android   # first time only
npm run build
npx cap open android
```

## Cloud APK (no Studio needed)
Push to GitHub → Actions tab → **Build Rider APK** → download APK from Artifacts.
Set repo Secret: `VITE_API_URL`.

## App details
- App ID: `com.apnabaithak.rider`
- Name: Baithak Rider
- Permissions: fine/coarse location (added at build).
