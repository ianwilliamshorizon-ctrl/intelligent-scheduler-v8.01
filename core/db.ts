
import './env'; 
import { initializeApp } from 'firebase/app';
import { 
    getFirestore, doc, getDoc, setDoc, collection, 
    onSnapshot, Firestore, connectFirestoreEmulator, runTransaction,
    query, deleteDoc as firestoreDeleteDoc, addDoc, updateDoc, serverTimestamp
} from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { ServicePackage } from '../types';

// --- 1. Environment & Config ---
const getEnv = () => (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : process.env;

export const isDev = () => {
    if (typeof process !== 'undefined' && process.argv) {
        return process.argv.includes('--dev');
    }
    const env = getEnv();
    return env.DEV === true || env.VITE_USER_NODE_ENV === 'development';
};

export const getAppEnvironment = (): 'Production' | 'Development' => {
    return isDev() ? 'Development' : 'Production';
};

// --- 2. Data Sanitization ---
const sanitizeData = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => sanitizeData(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined) 
        .map(([k, v]) => [k, sanitizeData(v)])
    );
  }
  return obj;
};

// --- 3. Lazy Initialization ---
let db: Firestore;
let auth: any;
let isInitialized = false;

const initialize = () => {
    if (isInitialized) return;
    const firebaseConfig = {
        apiKey: getEnv().VITE_FIREBASE_API_KEY,
        authDomain: getEnv().VITE_FIREBASE_AUTH_DOMAIN,
        projectId: getEnv().VITE_FIREBASE_PROJECT_ID,
        storageBucket: getEnv().VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: getEnv().VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: getEnv().VITE_FIREBASE_APP_ID,
    };
    if (!firebaseConfig.projectId) {
        throw new Error("Firebase Project ID is missing. Check your .env file.");
    }
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    isInitialized = true;
    if (isDev()) {
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectAuthEmulator(auth, 'http://localhost:9099');
        console.log("🔥 Connected to Firebase Emulators");
    } else {
        console.log("☁️ Connected to Cloud Firestore");
    }
};

export const getDb = (): Firestore => {
    if (!isInitialized) initialize();
    return db;
};

export const getStorageType = () => {
    if (!isInitialized) initialize();
    return isDev() ? 'emulator' : 'firestore';
};

const getAuthInstance = (): any => {
    if (!isInitialized) initialize();
    return auth;
}
export { getAuthInstance as auth };

// --- 4. Main Operations ---

export const subscribeToCollection = <T>(
    collectionName: string, 
    callback: (data: T[]) => void
): (() => void) => {
    const firestore = getDb();
    const q = query(collection(firestore, collectionName));
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as unknown as T[];
        callback(items);
    }, (error) => {
        console.error(`Error listening to ${collectionName}:`, error);
    });
};

export const saveDocument = async <T extends { id: string }>(
    collectionName: string, 
    data: T
): Promise<void> => {
    const firestore = getDb();
    if (!data.id) {
        console.error("Attempted to save a document without an ID.", { collectionName, data });
        return;
    }
    const docRef = doc(firestore, collectionName, data.id);
    const cleanData = sanitizeData(data);
    await setDoc(docRef, cleanData, { merge: true });
};

export const deleteDocument = async (collectionName: string, docId: string): Promise<void> => {
    const firestore = getDb();
    const docRef = doc(firestore, collectionName, docId);
    await firestoreDeleteDoc(docRef);
};

export const generateSequenceId = async (prefix: string, entityShortCode: string): Promise<string> => {
    const firestore = getDb();
    const counterRef = doc(firestore, 'brooks_counters', `${entityShortCode}_${prefix}`);
    try {
        const newId = await runTransaction(firestore, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            const nextCount = (counterDoc.exists() ? (counterDoc.data().count || 0) : 0) + 1;
            transaction.set(counterRef, { count: nextCount }, { merge: true });
            return nextCount;
        });
        return `${entityShortCode}${prefix}${String(newId).padStart(5, '0')}`;
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
};

export const setItem = async (key: string, value: any) => {
    const firestore = getDb();
    const cleanValue = sanitizeData(value);
    if (Array.isArray(cleanValue)) {
        const batchPromises = cleanValue.map(item => {
            if (!item.id) return Promise.resolve();
            const docRef = doc(firestore, key, item.id);
            return setDoc(docRef, item, { merge: true });
        });
        await Promise.all(batchPromises);
    } else {
        const docRef = doc(firestore, 'brooks_settings', key);
        await setDoc(docRef, cleanValue !== null && typeof cleanValue === 'object' ? cleanValue : { value: cleanValue }, { merge: true });
    }
};

export const getItem = async <T>(key: string): Promise<T | null> => {
    const firestore = getDb();
    const snap = await getDoc(doc(firestore, 'brooks_settings', key));
    if (snap.exists()) {
        const data = snap.data();
        return (data.value !== undefined ? data.value : data) as T;
    }
    return null;
};

export const clearStore = async () => {
    console.warn("clearStore is not fully implemented for Firestore adapter.");
};

export const saveServicePackage = async (pkg: ServicePackage): Promise<ServicePackage> => {
    const firestore = getDb();
    const cleanPkg = sanitizeData(pkg);

    if (cleanPkg.id) {
        const docRef = doc(firestore, 'brooks_servicePackages', cleanPkg.id);
        await updateDoc(docRef, { ...cleanPkg, lastUpdated: serverTimestamp() });
        return cleanPkg;
    } else {
        const collectionRef = collection(firestore, 'brooks_servicePackages');
        const newDocRef = await addDoc(collectionRef, { ...cleanPkg, created: serverTimestamp(), source: 'Manual-Entry' });
        return { ...cleanPkg, id: newDocRef.id };
    }
};