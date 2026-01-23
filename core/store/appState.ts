
import { atom } from 'jotai';

// This will hold the message if a tab fails to acquire the primary lease from Firestore.
// An empty string means there is no notification to display.
export const persistenceWarningAtom = atom<string>('');

// This tracks the live status of the database connection
export const dbStatusAtom = atom<'connecting' | 'online' | 'offline'>('connecting');

// This is used to briefly indicate when a write operation is happening
export const isWritingAtom = atom<boolean>(false);
