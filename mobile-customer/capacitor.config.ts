import { CapacitorConfig } from '@capacitor/cli';

// Customer app wrapper — builds ../frontend (website) and packs it.
// Website + app stay linked: same code, same backend (VITE_API_URL).
const config: CapacitorConfig = {
  appId: 'com.apnabaithak.customer',
  appName: 'Apna Baithak',
  webDir: '../frontend/dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
