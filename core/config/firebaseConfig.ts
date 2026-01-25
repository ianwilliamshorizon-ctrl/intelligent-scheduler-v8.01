
import dotenv from 'dotenv';

// A single, reliable source for the current environment
// In the browser, Vite provides `import.meta.env.MODE`.
// In Node.js (for seeding), we use `process.env.NODE_ENV`.
const currentEnv = typeof import.meta.env !== 'undefined' 
    ? import.meta.env.MODE 
    : process.env.NODE_ENV;

// When running in a Node.js script (like seeding), import.meta.env is undefined. 
// In that case, we use dotenv to load the .env file.
if (typeof import.meta.env === 'undefined') {
    const envFile = currentEnv === 'production' ? '.env.production' : '.env.development';
    dotenv.config({ path: envFile });
}

// Helper to get variables safely from either Vite's env or Node's process.env
const getEnv = (key: string) => {
    if (typeof import.meta.env !== 'undefined') {
        return import.meta.env[key];
    }
    return process.env[key];
};

// Determine if we are in production
const isProduction = currentEnv === 'production';
const isDevelopment = !isProduction;

// Export a function to get the current environment string
// Type definition AppEnvironment expects 'Production' or 'Development'
export const getAppEnvironment = (): 'Production' | 'Development' => isProduction ? 'Production' : 'Development';

// Function to check if running in dev environment
export const isDev = () => isDevelopment;

// Firebase configuration - now environment-agnostic
export const firebaseConfig = {
    apiKey: isProduction ? getEnv('VITE_FIREBASE_API_KEY_PROD') : getEnv('VITE_FIREBASE_API_KEY_DEV'),
    authDomain: isProduction ? getEnv('VITE_FIREBASE_AUTH_DOMAIN_PROD') : getEnv('VITE_FIREBASE_AUTH_DOMAIN_DEV'),
    projectId: isProduction ? getEnv('VITE_FIREBASE_PROJECT_ID_PROD') : getEnv('VITE_FIREBASE_PROJECT_ID_DEV'),
    storageBucket: isProduction ? getEnv('VITE_FIREBASE_STORAGE_BUCKET_PROD') : getEnv('VITE_FIREBASE_STORAGE_BUCKET_DEV'),
    messagingSenderId: isProduction ? getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID_PROD') : getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID_DEV'),
    appId: isProduction ? getEnv('VITE_FIREBASE_APP_ID_PROD') : getEnv('VITE_FIREBASE_APP_ID_DEV'),
};

// Basic validation
if (!firebaseConfig.projectId) {
    // This error will now correctly trigger if the PROD keys are missing in a production build
    console.error(`Firebase projectId is missing. Check your environment variables. Loaded env: ${currentEnv}`);
}
