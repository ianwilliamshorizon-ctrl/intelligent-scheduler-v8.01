
import React, { useState, useEffect, useRef } from 'react';
import { getItem, setItem, subscribeToItem } from '../db';

// A simple debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): void => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
}


export const usePersistentState = <T,>(storageKey: string, getInitialValue: () => T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  // Initialize with default value to ensure immediate render capability
  const [state, setState] = useState<T>(getInitialValue());
  const [isHydrated, setIsHydrated] = useState(false);
  const isFirstRun = useRef(true);
  const isRemoteUpdate = useRef(false);

  // Debounced save function
  const debouncedSave = useRef(
    debounce((key: string, value: T) => {
      setItem(key, value).catch(err =>
        console.error(`Error saving key \"${key}\" to DB:`, err)
      );
    }, 500) // 500ms debounce delay
  ).current;


  // Load data on mount (Hydration) and Subscribe to changes
  useEffect(() => {
    let unsubscribe = () => {};

    const hydrateAndSubscribe = async () => {
        // 1. Initial Hydration
        try {
            // Try loading from DB first
            const dbValue = await getItem<T>(storageKey);

            if (dbValue !== undefined && dbValue !== null) {
                setState(dbValue);
                // Mark as remote update to prevent immediate write-back loop during hydration
                isRemoteUpdate.current = true;
            } else {
                // Fallback to LocalStorage (Legacy Migration Path)
                const lsValue = window.localStorage.getItem(storageKey);
                if (lsValue) {
                    try {
                        const parsed = JSON.parse(lsValue);
                        setState(parsed);
                        // Async migration to DB
                        await setItem(storageKey, parsed);
                        console.log(`Migrated ${storageKey} from LocalStorage to IndexedDB.`);
                        isRemoteUpdate.current = true;
                    } catch (e) {
                        console.error(`Error parsing legacy localStorage key \"${storageKey}\"`, e);
                    }
                }
            }
        } catch (error) {
            console.error(`Error hydrating key \"${storageKey}\"`, error);
        } finally {
            setIsHydrated(true);
        }

        // 2. Real-time Subscription (Firestore)
        unsubscribe = subscribeToItem<T>(storageKey, (newValue) => {
            if (newValue !== undefined && newValue !== null) {
                setState(current => {
                    // Only update if data has actually changed to avoid unnecessary re-renders
                    if (JSON.stringify(current) !== JSON.stringify(newValue)) {
                        isRemoteUpdate.current = true;
                        return newValue;
                    }
                    return current;
                });
                // Ensure hydration flag is set if we get a live update
                setIsHydrated(true);
            }
        });
    };

    hydrateAndSubscribe();

    return () => {
        unsubscribe();
    };
  }, [storageKey]);

  // Save data on change
  useEffect(() => {
    // Skip saving on the very first render
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    if (isHydrated) {
        if (isRemoteUpdate.current) {
            // This update came from the DB, so we don't need to save it back.
            // Reset the flag for the next update.
            isRemoteUpdate.current = false;
        } else {
            // This is a local user change, save to DB using debounce
            debouncedSave(storageKey, state);
        }
    }
  }, [state, storageKey, isHydrated, debouncedSave]);

  return [state, setState];
};
