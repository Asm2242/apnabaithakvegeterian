# Apna Baithak — Customer Android App (wrapper)

Separate Capacitor wrapper. Website + app stay linked:
- **Same code:** builds `../frontend` (customer website)
- **Same backend:** `VITE_API_URL` at build time
- Change website once → rebuild app → both updated.

## Local (needs Android Studio)
```
npm install
npm run build:web
npx cap add android   # first time only
npm run build
npx cap open android  # build APK/AAB in Studio
```

## Cloud APK (no Studio needed)
Push to GitHub → Actions tab → **Build Customer APK** → download APK from Artifacts.
Set repo Secrets first: `VITE_API_URL`, `VITE_RAZORPAY_KEY_ID`, `VITE_FIREBASE_*` (optional).

## App details
- App ID: `com.apnabaithak.customer`
- Name: Apna Baithak
- Icon: `resources/icon.svg` (generate via `@capacitor/assets`)
