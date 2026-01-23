
const isProduction = import.meta.env.PROD;
const isUAT = import.meta.env.MODE === 'uat';

const getActiveEnvironment = (): 'Production' | 'UAT' | 'Development' => {
    if (isProduction) {
        return isUAT ? 'UAT' : 'Production';
    }
    return 'Development';
};

export const currentEnvironment = getActiveEnvironment();

export const isDev = (): boolean => !isProduction;

// Use environment variables for Firebase config
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};


// Collection name in Firestore to store the application data
export const COLLECTION_NAME = isProduction && !isUAT ? 'brookspeed_data' : `brookspeed_data_${currentEnvironment.toLowerCase()}`;

export const getInitialAppEnvironment = (): 'Production' | 'UAT' | 'Development' => {
    return currentEnvironment;
};
