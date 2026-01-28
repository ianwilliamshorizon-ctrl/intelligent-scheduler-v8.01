import React, { createContext, useContext, useState, useMemo } from 'react';
import * as T from '../../types';
import { usePersistentState } from './usePersistentState';
import { useData } from './DataContext';
import { getActiveEnvironment } from '../config/firebaseConfig';

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
    currentUser: T.User | null;
    setCurrentUser: React.Dispatch<React.SetStateAction<T.User | null>>;
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
    setAppEnvironment: React.Dispatch<React.SetStateAction<T.AppEnvironment>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Consume users and businessEntities from DataContext
    const { users, setUsers, businessEntities } = useData();

    const [currentView, setCurrentView] = useState<T.ViewType>('dashboard');
    const [selectedEntityId, setSelectedEntityId] = useState<string>('ent_porsche');
    
    // Auth State
    const [currentUser, setCurrentUser] = useState<T.User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // State for CheckIn Modal
    const [isCheckInOpen, setIsCheckInOpen] = useState(false);
    const [checkingInJobId, setCheckingInJobId] = useState<string | null>(null);
    
    // State for debug mode
    const [isDebugMode, setIsDebugMode] = useState(false);

    // State for global confirmation modal
    const [confirmation, setConfirmation] = useState<ConfirmationState>({ isOpen: false, title: '', message: '' });

    // State for backup schedule
    const [backupSchedule, setBackupSchedule] = usePersistentState<T.BackupSchedule>('brooks_backup_schedule', () => ({
        enabled: true,
        times: ['12:00', '18:00'],
    }));

    // Environment State
    const [appEnvironment, setAppEnvironment] = usePersistentState<T.AppEnvironment>('brooks_environment', getActiveEnvironment);

    // Filter business entities to show in the main dropdown.
    const filteredBusinessEntities = useMemo(() => {
        return businessEntities.filter(e => e.type === 'Workshop');
    }, [businessEntities]);

    // Ensure selectedEntityId is valid for the current filtered list
    React.useEffect(() => {
        if (filteredBusinessEntities.length > 0 && selectedEntityId !== 'all' && !filteredBusinessEntities.some(e => e.id === selectedEntityId)) {
            setSelectedEntityId(filteredBusinessEntities[0].id);
        }
    }, [filteredBusinessEntities, selectedEntityId]);

    const login = (userId: string, password: string): boolean => {
        const user = users.find(u => u.id === userId);
        if (user) {
            // Default to '1234' for legacy users
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
        setCurrentUser(null);
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
        appEnvironment,
        setAppEnvironment,
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