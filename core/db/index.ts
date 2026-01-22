
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, onSnapshot, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { firebaseConfig, COLLECTION_NAME, isDev } from '../config/firebaseConfig';

// --- Configuration Check ---
const isFirebaseConfigured = !!(
    firebaseConfig.apiKey && 
    firebaseConfig.projectId
);

let db: Firestore | null = null;
let auth: any | null = null;

if (isFirebaseConfigured) {
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        
        if (isDev()) {
             // Emulator settings
             // Note: These ports (8080, 9099) are default for Firebase Emulators
             connectFirestoreEmulator(db, 'localhost', 8080);
             connectAuthEmulator(auth, 'http://localhost:9099');
             console.log("Connected to Firebase Emulators (Dev Mode)");
        } else {
             console.log("Connected to Firebase Cloud Firestore");
        }
    } catch (e) {
        console.error("Failed to initialize Firebase:", e);
    }
} else {
    console.warn("Firebase not configured. Using local IndexedDB.");
}

// --- Helper to check connection type ---
export const getStorageType = (): 'firestore' | 'emulator' | 'indexeddb' => {
    if (isFirebaseConfigured && db) {
        return isDev() ? 'emulator' : 'firestore';
    }
    return 'indexeddb';
};

// --- IndexedDB Fallback Implementation (Legacy) ---
const DB_NAME = 'BrookspeedData';
const DB_VERSION = 1;
const STORE_NAME = 'key_value_store';
let idbPromise: Promise<IDBDatabase> | null = null;

const openIDB = (): Promise<IDBDatabase> => {
    if (idbPromise) return idbPromise;
    idbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
        request.onerror = (event) => {
            console.error("IndexedDB Error:", (event.target as IDBOpenDBRequest).error);
            reject((event.target as IDBOpenDBRequest).error);
        };
    });
    return idbPromise;
};

// --- Unified API ---

export const getItem = async <T>(key: string): Promise<T | null> => {
    // Strategy: Cloud First
    if (db) {
        try {
            const docRef = doc(db, COLLECTION_NAME, key);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                // We wrap values in a 'value' field to store primitives/arrays easily
                return data.value as T;
            }
            return null;
        } catch (e) {
            console.error(`Firestore get error for ${key}:`, e);
            return null;
        }
    }

    // Strategy: Local Fallback
    try {
        const localDb = await openIDB();
        return new Promise((resolve, reject) => {
            const transaction = localDb.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result as T);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error(`IndexedDB get error for ${key}:`, error);
        return null;
    }
};

export const setItem = async <T>(key: string, value: T): Promise<void> => {
    if (db) {
        try {
            const docRef = doc(db, COLLECTION_NAME, key);
            // Merge true allows updating fields if we change schema later, 
            // but for key-value parity we largely overwrite.
            await setDoc(docRef, { value }, { merge: true }); 
            return;
        } catch (e) {
            console.error(`Firestore set error for ${key}:`, e);
            throw e;
        }
    }

    try {
        const localDb = await openIDB();
        return new Promise((resolve, reject) => {
            const transaction = localDb.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(value, key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error(`IndexedDB set error for ${key}:`, error);
        throw error;
    }
};

export const removeItem = async (key: string): Promise<void> => {
    if (db) {
        try {
            const docRef = doc(db, COLLECTION_NAME, key);
            await deleteDoc(docRef);
            return;
        } catch (e) {
             console.error(`Firestore delete error for ${key}:`, e);
             throw e;
        }
    }

     try {
        const localDb = await openIDB();
        return new Promise((resolve, reject) => {
            const transaction = localDb.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error(`IndexedDB delete error for ${key}:`, error);
        throw error;
    }
}

export const clearStore = async (): Promise<void> => {
    if (db) {
        // Clearing a collection in Firestore is not a native operation for client SDKs 
        // (usually done via Admin SDK or recursive delete).
        // For this app scale, we fetch all and delete one by one.
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
            const deletePromises = querySnapshot.docs.map(d => deleteDoc(d.ref));
            await Promise.all(deletePromises);
            return;
        } catch (e) {
            console.error("Firestore clear error:", e);
            throw e;
        }
    }

    try {
        const localDb = await openIDB();
        return new Promise((resolve, reject) => {
            const transaction = localDb.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("IndexedDB clear error:", error);
        throw error;
    }
};

export const subscribeToItem = <T>(key: string, callback: (value: T | null) => void): () => void => {
    if (db) {
        try {
            const docRef = doc(db, COLLECTION_NAME, key);
            return onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                     const data = docSnap.data();
                     callback(data.value as T);
                } else {
                     callback(null);
                }
            }, (error) => {
                console.error(`Firestore subscription error for ${key}:`, error);
            });
        } catch (e) {
            console.error(`Error setting up subscription for ${key}:`, e);
            return () => {};
        }
    }
    // No-op for IndexedDB or if db not initialized
    return () => {};
};
