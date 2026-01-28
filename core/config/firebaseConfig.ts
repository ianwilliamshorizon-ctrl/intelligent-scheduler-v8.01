import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// --- ENVIRONMENT HELPERS ---

const getEnv = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || '';
  }
  return '';
};

export const isDev = (): boolean => {
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' || 
    hostname === '127.0.0.1' || 
    hostname.includes("cloudworkstations.dev") ||
    hostname.includes("idx.google.com")
  );
};

export const getActiveEnvironment = (): 'Production' | 'UAT' | 'Development' => {
  const hostname = window.location.hostname;
  
  // Force Development mode if running in a Cloud IDE
  if (hostname.includes("cloudworkstations.dev") || hostname.includes("idx.google.com")) {
    return 'Development';
  }

  // Check local storage for manual overrides
  try {
    const stored = window.localStorage.getItem('brooks_environment');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (['Production', 'UAT', 'Development'].includes(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Error reading environment from localStorage", e);
  }
  
  const envVar = getEnv('VITE_APP_ENV');
  if (envVar === 'UAT') return 'UAT';
  if (envVar === 'Production') return 'Production';
  
  return isDev() ? 'Development' : 'Production';
};

export const currentEnvironment = getActiveEnvironment();

/**
 * Dynamic Collection Naming
 */
export const COLLECTION_NAME = currentEnvironment === 'Production' 
  ? 'brookspeed_data' 
  : `brookspeed_data_${currentEnvironment.toLowerCase()}`;

// Selects the correct API key based on the environment
const getEnvKey = (baseKey: string): string => {
  const suffix = currentEnvironment === 'Production' ? 'PROD' : currentEnvironment.toUpperCase();
  return getEnv(`${baseKey}_${suffix}`) || getEnv(baseKey);
};

// --- FIREBASE INITIALIZATION ---

export const firebaseConfig = {
  apiKey: getEnvKey('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvKey('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvKey('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvKey('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvKey('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvKey('VITE_FIREBASE_APP_ID')
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * FIRESTORE CONFIGURATION
 * 1. experimentalForceLongPolling: true -> Fixes the "Cloud IDE Proxy" dropouts.
 * 2. localCache: The modern way to handle persistence (v10+ SDK compatible).
 */
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

const storage = getStorage(app);
const auth = getAuth(app);

// NOTE: Emulator logic has been removed to allow direct connection 
// to the "Live Development" Firebase project.

export { app, db, storage, auth };