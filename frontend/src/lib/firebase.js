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

// Firebase error codes -> message user ko dikhana hai (Hinglish + hint)
export const fbErrorText = (code) => {
  switch (code) {
    case "auth/invalid-otp":
    case "auth/invalid-verification-code":
      return "Incorrect OTP — please type it carefully";
    case "auth/code-expired":
      return "OTP has expired — please resend";
    case "auth/billing-not-enabled":
      return "SMS service is unavailable — please contact the restaurant";
    case "auth/unauthorized-domain":
      return "This site is not allowed — please contact the restaurant";
    case "auth/operation-not-allowed":
      return "Phone login is disabled — please contact the restaurant";
    case "auth/too-many-requests":
      return "Too many attempts — please try again later";
    case "auth/network-request-failed":
      return "Network error — check connection";
    default:
      return "Could not verify the OTP — please resend";
  }
};
