
import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, onSnapshot, Firestore, connectFirestoreEmulator, writeBatch, addDoc, updateDoc, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { firebaseConfig, COLLECTION_NAME, isDev } from '../config/firebaseConfig';
import { useSetAtom } from 'jotai';
import { persistenceWarningAtom, dbStatusAtom, isWritingAtom } from '../store/appState';
import { useEffect } from 'react';

const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let db: Firestore | null = null;
let auth: any | null = null;

let setDbStatus: (status: 'connecting' | 'online' | 'offline') => void;
let setIsWriting: (isWriting: boolean) => void;
let setPersistenceWarning: (warning: string) => void;

// This function will be called from your main application component
export const useInitializeFirebase = () => {
    setDbStatus = useSetAtom(dbStatusAtom);
    setIsWriting = useSetAtom(isWritingAtom);
    setPersistenceWarning = useSetAtom(persistenceWarningAtom);

    useEffect(() => {
        if (isFirebaseConfigured && !db) {
            setDbStatus('connecting');
            try {
                const app = initializeApp(firebaseConfig);
                db = initializeFirestore(app, {
                    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
                });
                auth = getAuth(app);

                if (isDev()) {
                    connectFirestoreEmulator(db, 'localhost', 8080);
                    connectAuthEmulator(auth, 'http://localhost:9099');
                }
                setDbStatus('online');
            } catch (e: any) {
                if (e.code === 'failed-precondition') {
                    setPersistenceWarning('Offline data is managed by another tab. This tab will have limited offline capabilities.');
                    setDbStatus('offline');
                } else {
                    console.error("Failed to initialize Firebase:", e);
                    setDbStatus('offline');
                }
            }
        } else if (!isFirebaseConfigured) {
            console.warn("Firebase not configured. Using local IndexedDB.");
            setDbStatus('offline');
        }
    }, []);
};


export const getStorageType = (): 'firestore' | 'emulator' | 'indexeddb' => {
    if (isFirebaseConfigured && db) {
        return isDev() ? 'emulator' : 'firestore';
    }
    return 'indexeddb';
};

const chunkArray = (array: any[], maxSizeBytes: number = 800000): any[][] => {
    const chunks: any[][] = [];
    let currentChunk: any[] = [];
    let currentSize = 0;
    for (const item of array) {
        const itemJson = JSON.stringify(item);
        const itemSize = itemJson.length;
        if (currentSize + itemSize > maxSizeBytes && currentChunk.length > 0) {
            chunks.push(currentChunk);
            currentChunk = [];
            currentSize = 0;
        }
        currentChunk.push(item);
        currentSize += itemSize;
    }
    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }
    return chunks;
};

export const getItem = async <T>(key: string): Promise<T | null> => {
    if (!db) return null;
    try {
        const docRef = doc(db, COLLECTION_NAME, key);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.type === 'chunked') {
                const count = data.shardCount;
                const shardsRef = collection(docRef, 'shards');
                const promises = Array.from({ length: count }, (_, i) => getDoc(doc(shardsRef, i.toString())));
                const snapshots = await Promise.all(promises);
                return snapshots.reduce((acc, snap) => acc.concat(snap.exists() ? snap.data().items || [] : []), [] as any[]) as T;
            }
            return data.value as T;
        }
        return null;
    } catch (e) {
        console.error(`Firestore get error for ${key}:`, e);
        return null;
    }
};

export const setItem = async <T>(key: string, value: T): Promise<void> => {
    if (!db) return;
    if (setIsWriting) setIsWriting(true);
    try {
        const docRef = doc(db, COLLECTION_NAME, key);
        const jsonValue = JSON.stringify(value);
        const SAFE_DOC_LIMIT = 500000;

        if (jsonValue.length < SAFE_DOC_LIMIT) {
            await setDoc(docRef, { value, type: 'single', timestamp: new Date().toISOString() }, { merge: false });
        } else if (Array.isArray(value)) {
            const chunks = chunkArray(value);
            const batch = writeBatch(db);
            batch.set(docRef, { type: 'chunked', shardCount: chunks.length, timestamp: new Date().toISOString() });
            const shardsRef = collection(docRef, 'shards');
            chunks.forEach((chunk, index) => {
                batch.set(doc(shardsRef, index.toString()), { items: chunk });
            });
            await batch.commit();
        } else {
            await setDoc(docRef, { value }, { merge: true });
        }
    } catch (e) {
        console.error(`Firestore set error for ${key}:`, e);
        if (setDbStatus) setDbStatus('offline');
        throw e;
    } finally {
        if (setIsWriting) setTimeout(() => setIsWriting(false), 250); // Keep indicator on for a short time
    }
};

export const removeItem = async (key: string): Promise<void> => {
    if (!db) return;
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, key));
    } catch (e) {
        console.error(`Firestore delete error for ${key}:`, e);
        throw e;
    }
};

export const clearStore = async (): Promise<void> => {
    if (!db) return;
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        const batch = writeBatch(db);
        querySnapshot.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
    } catch (e) {
        console.error("Firestore clear error:", e);
        throw e;
    }
};

export const subscribeToCollection = <T>(
    callback: (data: Record<string, T>) => void
): (() => void) => {
    if (!db) return () => {};
    try {
        const collRef = collection(db, COLLECTION_NAME);
        return onSnapshot(collRef, (querySnapshot) => {
            const promises = querySnapshot.docs.map(docSnap => {
                const key = docSnap.id;
                const data = docSnap.data();

                if (data.type === 'chunked') {
                    const shardsRef = collection(docSnap.ref, 'shards');
                    const shardPromises = Array.from({ length: data.shardCount }, (_, i) => getDoc(doc(shardsRef, i.toString())));

                    return Promise.all(shardPromises).then(shardSnaps => {
                        const value = shardSnaps.reduce((acc, snap) => acc.concat(snap.exists() ? snap.data().items || [] : []), [] as any[]);
                        return { key, value };
                    }).catch(() => ({ key, value: null }));
                } else {
                    return Promise.resolve({ key, value: data.value as T });
                }
            });

            Promise.all(promises).then(results => {
                const allData = results.reduce((acc, result) => {
                    if (result.value !== null) acc[result.key] = result.value;
                    return acc;
                }, {} as Record<string, T>);
                callback(allData);
            }).catch(() => {});
        }, (error) => {
            console.error("Collection subscription error:", error);
            if (setDbStatus) setDbStatus('offline');
        });
    } catch (e) {
        if (setDbStatus) setDbStatus('offline');
        return () => {};
    }
};

export const subscribeToItem = <T>(key: string, callback: (value: T | null) => void): (() => void) => {
    if (!db) return () => {};
    try {
        const docRef = doc(db, COLLECTION_NAME, key);
        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                 const data = docSnap.data();
                 if (data.type === 'chunked') {
                     const shardsRef = collection(docRef, 'shards');
                     const promises = Array.from({ length: data.shardCount }, (_, i) => getDoc(doc(shardsRef, i.toString())));

                     Promise.all(promises).then(snapshots => {
                         const fullArray = snapshots.reduce((acc, snap) => acc.concat(snap.exists() ? snap.data().items || [] : []), [] as any[]);
                         callback(fullArray as T);
                     }).catch(() => callback(null));
                 } else {
                     callback(data.value as T);
                 }
            } else {
                 callback(null);
            }
        }, (error) => {
            console.error(`Item subscription error for ${key}:`, error);
            if (setDbStatus) setDbStatus('offline');
        });
    } catch (e) {
        if (setDbStatus) setDbStatus('offline');
        return () => {};
    }
};

export const addDocumentInCollection = async (document: any): Promise<string> => {
    if (db) {
        try {
            const collRef = collection(db, COLLECTION_NAME);
            const docRef = await addDoc(collRef, document);
            return docRef.id;
        } catch (e) {
            console.error("Firestore add document error:", e);
            throw e;
        }
    }
    return Promise.reject("Add document not supported in IndexedDB");
};

export const updateDocumentInCollection = async (documentId: string, document: any): Promise<void> => {
    if (db) {
        try {
            const docRef = doc(db, COLLECTION_NAME, documentId);
            await updateDoc(docRef, document);
        } catch (e) {
            console.error(`Firestore update error for document ${documentId}:`, e);
            throw e;
        }
    } else {
        return Promise.reject("Update document not supported in IndexedDB");
    }
};
