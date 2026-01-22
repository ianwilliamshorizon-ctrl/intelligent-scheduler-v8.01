
// Helper to read VITE env vars (standard for Vite apps)
const getEnv = (key: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
     // @ts-ignore
     return import.meta.env[key];
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[key];
  }
  return '';
}

export const isDev = () => {
    // Check if we are in development mode (localhost or specific env flag)
    // @ts-ignore
    return (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) || 
           window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
};

// Determine the active environment
// Priority: 1. LocalStorage (User Selection) 2. Env Var (Build) 3. Automatic Detection
const getActiveEnvironment = (): 'Production' | 'UAT' | 'Development' => {
    try {
        const stored = window.localStorage.getItem('brooks_environment');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.warn("Error reading environment from storage", e);
    }
    
    const envVar = getEnv('VITE_APP_ENV');
    if (envVar === 'UAT') return 'UAT';
    if (envVar === 'Production') return 'Production';
    if (envVar === 'Development') return 'Development';

    return isDev() ? 'Development' : 'Production';
};

export const currentEnvironment = getActiveEnvironment();

// Helper to select the correct key based on environment
// Looks for specific suffix (_UAT, _DEV) first, then falls back to standard keys for Production/Default
const getEnvKey = (baseKey: string) => {
    if (currentEnvironment === 'UAT') {
        return getEnv(`${baseKey}_UAT`) || getEnv(baseKey);
    }
    if (currentEnvironment === 'Development') {
        return getEnv(`${baseKey}_DEV`) || getEnv(baseKey);
    }
    // Production
    return getEnv(`${baseKey}_PROD`) || getEnv(baseKey);
};

export const firebaseConfig = {
  apiKey: "AIzaSyAcrfO2yAMd7fxZlWs024PIvPXgUUF5u2E",
  authDomain: "intelligent-scheduling-v801.firebaseapp.com",
  projectId: "intelligent-scheduling-v801",
  storageBucket: "intelligent-scheduling-v801.firebasestorage.app",
  messagingSenderId: "194785321173",
  appId: "1:194785321173:web:22c5910cc74b6cad91c25c",
  measurementId: "G-3EWDFXB3M7"
};

// Collection name in Firestore to store the application data
// We can also segregate collections if sharing a single project, though separate projects is better security.
export const COLLECTION_NAME = currentEnvironment === 'Production' ? 'brookspeed_data' : `brookspeed_data_${currentEnvironment.toLowerCase()}`;

export const getInitialAppEnvironment = (): 'Production' | 'UAT' | 'Development' => {
    return currentEnvironment;
};
