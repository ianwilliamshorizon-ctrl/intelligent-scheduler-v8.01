
import { initializeApp } from 'firebase/app';
import { 
    getFirestore, doc, getDoc, setDoc, deleteDoc, collection, 
    onSnapshot, Firestore, connectFirestoreEmulator, runTransaction,
    query, orderBy, DocumentData, WithFieldValue
} from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { firebaseConfig, isDev } from './config/firebaseConfig';

// --- Configuration ---
const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let db: Firestore;
let auth: any;

if (isFirebaseConfigured) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    if (isDev()) {
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectAuthEmulator(auth, 'http://localhost:9099');
        console.log("🔥 Connected to Firebase Emulators");
    } else {
        console.log("☁️ Connected to Cloud Firestore");
    }
}

export { db };

export const getStorageType = () => {
    if (!isFirebaseConfigured) return 'memory';
    return isDev() ? 'emulator' : 'firestore';
};

// --- Collections ---
// We treat every 'key' from the old system as a Collection Name
const getCollectionRef = (collectionName: string) => collection(db, collectionName);

// --- Real-Time Listeners ---
export const subscribeToCollection = <T>(
    collectionName: string, 
    callback: (data: T[]) => void
): (() => void) => {
    if (!db) return () => {};

    // Basic query: Order by createdAt if available, or just get all docs
    // In a real app, you might want to index specific fields
    const q = query(collection(db, collectionName));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id // Ensure ID is part of the object
        })) as unknown as T[];
        
        callback(items);
    }, (error) => {
        console.error(`Error listening to ${collectionName}:`, error);
    });

    return unsubscribe;
};

// --- CRUD Operations ---

/**
 * Saves a document. Using setDoc with merge:true acts as an Upsert (Update or Insert)
 * This supports Optimistic UI updates automatically via the SDK.
 */
export const saveDocument = async <T extends { id: string }>(
    collectionName: string, 
    data: WithFieldValue<T>
): Promise<void> => {
    if (!db) return;
    // @ts-ignore - ID is required
    const docRef = doc(db, collectionName, data.id);
    // Remove undefined values to prevent Firestore errors
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(docRef, cleanData, { merge: true });
};

export const deleteDocument = async (collectionName: string, docId: string): Promise<void> => {
    if (!db) return;
    await deleteDoc(doc(db, collectionName, docId));
};

// --- Concurrency Safe ID Generation ---

/**
 * Generates a unique, sequential ID using Firestore Transactions.
 * Prevents race conditions when multiple users create items simultaneously.
 */
export const generateSequenceId = async (prefix: string, entityShortCode: string): Promise<string> => {
    if (!db) return `${entityShortCode}${prefix}${Date.now()}`; // Fallback

    const counterRef = doc(db, 'brooks_counters', `${entityShortCode}_${prefix}`);

    try {
        const newId = await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            
            let currentCount = 0;
            if (counterDoc.exists()) {
                currentCount = counterDoc.data().count || 0;
            }

            const nextCount = currentCount + 1;
            
            // Set the new count
            transaction.set(counterRef, { count: nextCount }, { merge: true });
            
            return nextCount;
        });

        // Format: BPP99200001
        return `${entityShortCode}${prefix}${String(newId).padStart(5, '0')}`;
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
};

// --- Legacy Compatibility (To prevent breaking existing simple string storage) ---
export const setItem = async (key: string, value: any) => {
    // For simple key-value pairs (like settings), we store them in a 'brooks_settings' collection
    if (!db) return;
    if (typeof value !== 'object' || Array.isArray(value)) {
        // If it's a raw array or primitive, wrap it
        await setDoc(doc(db, 'brooks_settings', key), { value });
    } else {
         await setDoc(doc(db, 'brooks_settings', key), value);
    }
};

export const getItem = async <T>(key: string): Promise<T | null> => {
    if (!db) return null;
    const snap = await getDoc(doc(db, 'brooks_settings', key));
    if (snap.exists()) {
        const data = snap.data();
        return (data.value !== undefined ? data.value : data) as T;
    }
    return null;
};

export const clearStore = async () => {
    console.warn("clearStore is not fully implemented for Firestore adapter. Local data will be cleared by the caller.");
};