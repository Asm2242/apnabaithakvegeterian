import { CapacitorConfig } from '@capacitor/cli';

// Rider app wrapper — builds ../rider (web) and packs it.
// Website + app stay linked: same code, same backend (VITE_API_URL).
const config: CapacitorConfig = {
  appId: 'com.apnabaithak.rider',
  appName: 'Baithak Rider',
  webDir: '../rider/dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
