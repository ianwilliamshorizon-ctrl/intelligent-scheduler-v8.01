import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import * as T from '../../types';
import { usePersistentState } from './usePersistentState';
import { getInitialUsers } from '../data/initialData';
import { useData } from './DataContext';

// Helper to get a capitalized, user-friendly environment name
const getFriendlyEnvironmentName = (): T.AppEnvironment => {
    const mode = import.meta.env.MODE;
    if (mode === 'development') return 'Development';
    if (mode === 'production') return 'Production';
    // Capitalize other modes like 'uat' -> 'UAT'
    return mode.toUpperCase() as T.AppEnvironment;
};

export interface ConfirmationState {
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'success' | 'warning';
}

interface AppContextType {
    currentView: T.ViewType;
    setCurrentView: React.Dispatch<React.SetStateAction<T.ViewType>>;
    selectedEntityId: string;
    setSelectedEntityId: React.Dispatch<React.SetStateAction<string>>;
    currentUser: T.User;
    setCurrentUser: React.Dispatch<React.SetStateAction<T.User>>;
    isAuthenticated: boolean;
    login: (userId: string, password: string) => boolean;
    logout: () => void;
    users: T.User[];
    setUsers: React.Dispatch<React.SetStateAction<T.User[]>>;
    filteredBusinessEntities: T.BusinessEntity[];
    isCheckInOpen: boolean;
    setIsCheckInOpen: React.Dispatch<React.SetStateAction<boolean>>;
    checkingInJobId: string | null;
    setCheckingInJobId: React.Dispatch<React.SetStateAction<string | null>>;
    isDebugMode: boolean;
    setIsDebugMode: React.Dispatch<React.SetStateAction<boolean>>;
    confirmation: ConfirmationState;
    setConfirmation: React.Dispatch<React.SetStateAction<ConfirmationState>>;
    backupSchedule: T.BackupSchedule;
    setBackupSchedule: React.Dispatch<React.SetStateAction<T.BackupSchedule>>;
    appEnvironment: T.AppEnvironment;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentView, setCurrentView] = useState<T.ViewType>('dashboard');
    const [selectedEntityId, setSelectedEntityId] = useState<string>('ent_porsche');
    const [users, setUsers] = usePersistentState<T.User[]>('brooks_users', getInitialUsers);
    const [currentUser, setCurrentUser] = useState<T.User>(users[0] || getInitialUsers()[0]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { businessEntities } = useData();
    const [isCheckInOpen, setIsCheckInOpen] = useState(false);
    const [checkingInJobId, setCheckingInJobId] = useState<string | null>(null);
    const [isDebugMode, setIsDebugMode] = useState(false);
    const [confirmation, setConfirmation] = useState<ConfirmationState>({ isOpen: false, title: '', message: '' });
    const [backupSchedule, setBackupSchedule] = usePersistentState<T.BackupSchedule>('brooks_backup_schedule', () => ({
        enabled: true,
        times: ['12:00', '18:00'],
    }));

    // Environment is determined at build/run time, not a persistent state.
    const [appEnvironment] = useState<T.AppEnvironment>(getFriendlyEnvironmentName());

    useEffect(() => {
        if (users.length === 0) {
            setUsers(getInitialUsers());
        }
    }, [users, setUsers]);

    const filteredBusinessEntities = useMemo(() => {
        return businessEntities.filter(e => e.type === 'Workshop');
    }, [businessEntities]);

    React.useEffect(() => {
        if (filteredBusinessEntities.length > 0 && selectedEntityId !== 'all' && !filteredBusinessEntities.some(e => e.id === selectedEntityId)) {
            setSelectedEntityId(filteredBusinessEntities[0].id);
        }
    }, [filteredBusinessEntities, selectedEntityId]);

    const login = (userId: string, password: string): boolean => {
        const user = users.find(u => u.id === userId);
        if (user) {
            const userPassword = user.password || '1234';
            if (userPassword === password) {
                setCurrentUser(user);
                setIsAuthenticated(true);
                setCurrentView('dashboard');
                return true;
            }
        }
        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
    };

    const value = {
        currentView,
        setCurrentView,
        selectedEntityId,
        setSelectedEntityId,
        currentUser,
        setCurrentUser,
        isAuthenticated,
        login,
        logout,
        users,
        setUsers,
        filteredBusinessEntities,
        isCheckInOpen,
        setIsCheckInOpen,
        checkingInJobId,
        setCheckingInJobId,
        isDebugMode,
        setIsDebugMode,
        confirmation,
        setConfirmation,
        backupSchedule,
        setBackupSchedule,
        appEnvironment, // Re-added for the login screen
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppContextProvider');
    }
    return context;
};