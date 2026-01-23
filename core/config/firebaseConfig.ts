
// Using Vite's boolean flags is safer.
// See: https://vitejs.dev/guide/env-and-mode.html#env-variables
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
export const COLLECTION_NAME = isProduction && !isUAT ? 'brookspeed_data' : `brookspeed_data_${currentEnvironment.toLowerCase()}`;

export const getInitialAppEnvironment = (): 'Production' | 'UAT' | 'Development' => {
    return currentEnvironment;
};
