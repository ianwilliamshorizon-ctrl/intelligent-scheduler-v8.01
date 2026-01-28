import React, { useState, useEffect, useRef } from 'react';
import { subscribeToCollection, getItem, setItem } from '../db';

export const usePersistentState = <T,>(storageKey: string, getInitialValue: () => T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = useState<T>(getInitialValue());
    const [isHydrated, setIsHydrated] = useState(false);
    
    // Ref to prevent infinite loops (setting state from DB triggers a save to DB)
    const isIncomingUpdate = useRef(false);

    // 1. Listen for changes from the Database (Incoming)
    useEffect(() => {
        let unsubscribe = () => {};
        const initialVal = getInitialValue();
        const isCollection = Array.isArray(initialVal);

        if (isCollection) {
            unsubscribe = subscribeToCollection(storageKey, (data) => {
                isIncomingUpdate.current = true;
                setState(data as unknown as T);
                setIsHydrated(true);
                // Reset flag after render cycle
                setTimeout(() => { isIncomingUpdate.current = false; }, 50);
            });
        } else {
            getItem<T>(storageKey).then((data) => {
                if (data !== null && data !== undefined) {
                    isIncomingUpdate.current = true;
                    setState(data);
                }
                setIsHydrated(true);
                setTimeout(() => { isIncomingUpdate.current = false; }, 50);
            });
        }

        return () => unsubscribe();
    }, [storageKey]);

    // 2. Save changes to the Database (Outgoing)
    useEffect(() => {
        // Don't save if we haven't loaded the data yet, 
        // or if the change was just sent to us by the database.
        if (!isHydrated || isIncomingUpdate.current) return;

        const persist = async () => {
            try {
                await setItem(storageKey, state);
            } catch (error) {
                console.error(`Failed to persist ${storageKey}:`, error);
            }
        };

        persist();
    }, [state, storageKey, isHydrated]);

    return [state, setState];
};