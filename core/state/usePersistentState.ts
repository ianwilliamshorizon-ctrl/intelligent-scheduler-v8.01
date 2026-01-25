import React, { useState, useEffect, useCallback, useRef } from 'react';
import { subscribeToCollection, getItem, setItem } from '../db'; // Ensure setItem/saveDocument is imported

export const usePersistentState = <T,>(
  storageKey: string, 
  getInitialValue: () => T
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(getInitialValue());
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Ref to prevent the listener from triggering a write-back loop
  const isInternalUpdate = useRef(false);

  // 1. LISTENING LOGIC (The "Pull")
  useEffect(() => {
    let unsubscribe = () => {};
    const initialVal = getInitialValue();
    const isCollection = Array.isArray(initialVal);

    if (isCollection) {
      unsubscribe = subscribeToCollection(storageKey, (data) => {
        isInternalUpdate.current = true; // Mark this as a DB-driven update
        setState(data as unknown as T);
        setIsHydrated(true);
        setTimeout(() => { isInternalUpdate.current = false; }, 100);
      });
    } else {
      getItem<T>(storageKey).then((data) => {
        if (data) {
          isInternalUpdate.current = true;
          setState(data);
        }
        setIsHydrated(true);
        setTimeout(() => { isInternalUpdate.current = false; }, 100);
      });
    }

    return () => unsubscribe();
  }, [storageKey]);

  // 2. WRITING LOGIC (The "Push")
  // We wrap setState to intercept the data and send it to Firestore
  const setPersistentState: React.Dispatch<React.SetStateAction<T>> = useCallback((value) => {
    setState((prevState) => {
      const newState = value instanceof Function ? value(prevState) : value;
      
      // If the update came from the UI (not the DB listener), push to Cloud
      if (!isInternalUpdate.current) {
        // We use setItem (which calls your saveDocument logic)
        setItem(storageKey, newState).catch(err => 
          console.error(`Failed to sync ${storageKey} to cloud:`, err)
        );
      }
      
      return newState;
    });
  }, [storageKey]);

  return [state, setPersistentState];
};