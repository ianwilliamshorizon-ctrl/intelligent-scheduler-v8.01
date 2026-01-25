
import React, { useState, useEffect, useRef } from 'react';
import { subscribeToCollection, getItem } from '../db';

export const usePersistentState = <T,>(storageKey: string, getInitialValue: () => T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(getInitialValue());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};

    const initialVal = getInitialValue();
    const isCollection = Array.isArray(initialVal);

    if (isCollection) {
        unsubscribe = subscribeToCollection(storageKey, (data) => {
            const isDataEmpty = !data || (Array.isArray(data) && data.length === 0);
            if (!isHydrated && isDataEmpty) {
                // First load and the DB is empty. Keep the initial data from the file.
            } else {
                setState(data as unknown as T);
            }
            setIsHydrated(true);
        });
    } else {
        getItem<T>(storageKey).then((data) => {
            if (data) setState(data);
            setIsHydrated(true);
        });
    }

    return () => {
        unsubscribe();
    };
  }, [storageKey]);

  return [state, setState];
};
