import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// --- HELPERS ---
const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) return import.meta.env[key];
  if (typeof process !== 'undefined' && process.env) return process.env[key];
  return '';
};

export const isDev = () => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes("cloudworkstations.dev");
};

const getActiveEnvironment = (): 'Production' | 'UAT' | 'Development' => {
  try {
    const stored = window.localStorage.getItem('brooks_environment');
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  
  const envVar = getEnv('VITE_APP_ENV');
  if (envVar === 'UAT') return 'UAT';
  if (envVar === 'Production') return 'Production';
  return isDev() ? 'Development' : 'Production';
};

export const currentEnvironment = getActiveEnvironment();
export const getInitialAppEnvironment = () => currentEnvironment;

// The core collection name that changes based on where you are
export const COLLECTION_NAME = currentEnvironment === 'Production' 
  ? 'brookspeed_data' 
  : `brookspeed_data_${currentEnvironment.toLowerCase()}`;

const getEnvKey = (baseKey: string) => {
  if (currentEnvironment === 'UAT') return getEnv(`${baseKey}_UAT`) || getEnv(baseKey);
  if (currentEnvironment === 'Development') return getEnv(`${baseKey}_DEV`) || getEnv(baseKey);
  return getEnv(`${baseKey}_PROD`) || getEnv(baseKey);
};

// --- FIREBASE INIT ---
export const firebaseConfig = {
  apiKey: getEnvKey('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvKey('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvKey('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvKey('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvKey('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvKey('VITE_FIREBASE_APP_ID')
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Force Long Polling for stability in Studio/Proxy environments
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});

const storage = getStorage(app);
const auth = getAuth(app);

// --- EMULATOR BRIDGE ---
if (currentEnvironment === 'Development') {
  console.log(`🛠️ Connecting to Emulators for Environment: ${currentEnvironment}`);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
} else {
  // Persistence for UAT/Prod
  enableIndexedDbPersistence(db).catch((err) => console.warn("Persistence failed", err));
}

export { app, db, storage, auth };