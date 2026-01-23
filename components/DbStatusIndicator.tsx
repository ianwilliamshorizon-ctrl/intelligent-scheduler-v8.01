
import React from 'react';
import { useAtomValue } from 'jotai';
import { dbStatusAtom, isWritingAtom, persistenceWarningAtom } from '../core/store/appState';
import { Wifi, WifiOff, Save, AlertTriangle } from 'lucide-react';

const DbStatusIndicator = () => {
    const dbStatus = useAtomValue(dbStatusAtom);
    const isWriting = useAtomValue(isWritingAtom);
    const persistenceWarning = useAtomValue(persistenceWarningAtom);

    let statusIcon;
    let statusText;
    let statusColor;

    if (isWriting) {
        statusIcon = <Save size={16} className="animate-pulse" />;
        statusText = 'Writing...';
        statusColor = 'text-blue-500';
    } else if (persistenceWarning) {
        statusIcon = <AlertTriangle size={16} />;
        statusText = 'Multi-tab warning';
        statusColor = 'text-yellow-500';
    } else {
        switch (dbStatus) {
            case 'online':
                statusIcon = <Wifi size={16} />;
                statusText = 'Online';
                statusColor = 'text-green-500';
                break;
            case 'offline':
                statusIcon = <WifiOff size={16} />;
                statusText = 'Offline';
                statusColor = 'text-red-500';
                break;
            case 'connecting':
            default:
                statusIcon = <Wifi size={16} className="animate-pulse" />;
                statusText = 'Connecting...';
                statusColor = 'text-gray-400';
                break;
        }
    }

    return (
        <div className={`flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full ${statusColor}`}>
            {statusIcon}
            <span>{statusText}</span>
        </div>
    );
};

export default DbStatusIndicator;
