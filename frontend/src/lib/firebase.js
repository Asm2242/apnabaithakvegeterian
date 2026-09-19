import { initializeApp, getApps } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// Free 10k SMS/month Firebase Phone Auth.
// Web config is public by design; override via Vercel env if needed.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBHKiCCYg6sLdGH2_tkmhYi6YAClP1BzGY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "apnabaithak-a89e8.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "apnabaithak-a89e8",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

let verifier = null;
let confirmation = null;

const ensureVerifier = () => {
  if (!verifier) {
    verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });
  }
  return verifier;
};

// send Firebase OTP to +91 number. Throws if Phone provider off.
export const fbSend = async (phone) => {
  const v = ensureVerifier();
  confirmation = await signInWithPhoneNumber(auth, "+91" + phone, v);
};

// verify code -> Firebase ID token (sent to our backend firelogin)
export const fbVerify = async (code) => {
  if (!confirmation) throw new Error("no-otp-session");
  const cred = await confirmation.confirm(code);
  return cred.user.getIdToken();
};

export const fbReset = () => {
  confirmation = null;
  try {
    verifier?.clear();
  } catch { /* ignore */ }
  verifier = null;
};
