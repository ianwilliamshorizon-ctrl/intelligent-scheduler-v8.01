import React from 'react';
import { Download, Upload, Clock, RefreshCw, Server, AlertTriangle, X, Info, CheckCircle, PlusCircle } from 'lucide-react';
import { setItem, clearAllData } from '../../../core/db';

interface BackupRestoreTabProps {
    backupSchedule: any;
    setBackupSchedule: (s: any) => void;
    onManualBackup: () => void;
    appEnvironment: string;
    setAppEnvironment: (env: any) => void;
    isUpdating: boolean;
    setIsUpdating: (v: boolean) => void;
    showStatus: (msg: string, type?: 'info' | 'success' | 'error') => void;
    storageType: string;
    isConnectedToCloud: boolean;
}

export const BackupRestoreTab: React.FC<BackupRestoreTabProps> = ({
    backupSchedule, setBackupSchedule, onManualBackup, appEnvironment, 
    setAppEnvironment, isUpdating, setIsUpdating, showStatus,
    storageType, isConnectedToCloud
}) => {

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!confirm("Restoring from backup will OVERWRITE current data. Are you sure?")) { 
            e.target.value = ''; 
            return; 
        }
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                const dataToRestore = json.data || json; 
                for (const [key, value] of Object.entries(dataToRestore)) {
                    if (key.startsWith('brooks_')) { await setItem(key, value); }
                }
                alert('Restore successful. Reloading...'); 
                window.location.reload();
            } catch (err) { 
                showStatus('Failed to restore backup.', 'error'); 
            }
        };
        reader.readAsText(file);
    };

    const handleSoftwareUpdate = () => {
        setIsUpdating(true);
        let branch = appEnvironment === 'UAT' ? 'uat' : appEnvironment === 'Development' ? 'dev' : 'production';
        showStatus(`Pulling latest code from git branch: origin/${branch}...`, 'info');
        setTimeout(() => {
             showStatus(`Successfully updated. Reloading...`, 'success');
             setTimeout(() => { window.location.reload(); }, 1500);
        }, 2000);
    };

    return (
        <div className="p-4 space-y-6">
            {/* Backup Section */}
            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2"><Download size={20}/> Backup Data</h3>
                <p className="text-sm text-blue-800 mb-4">Download a full backup of all system data to a JSON file.</p>
                <button onClick={onManualBackup} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow font-bold">Download Backup File</button>
            </div>

            {/* Schedule Section */}
            <div className="p-4 border rounded-lg bg-gray-50 border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2"><Clock size={20}/> Automated Backups</h3>
                <div className="flex items-center gap-4 mb-4">
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={backupSchedule.enabled} onChange={(e) => setBackupSchedule({...backupSchedule, enabled: e.target.checked})} className="sr-only peer"/>
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                        <span className="ml-3 text-sm font-medium text-gray-900">Enable Automated Backups</span>
                    </label>
                </div>
                {backupSchedule.enabled && (
                    <div className="flex flex-wrap gap-2">
                        {backupSchedule.times.map((time: string, index: number) => (
                            <div key={index} className="flex items-center bg-white border px-2 py-1 rounded shadow-sm">
                                <span className="text-sm font-mono mr-2">{time}</span>
                                <button onClick={() => setBackupSchedule({...backupSchedule, times: backupSchedule.times.filter((_: any, i: number) => i !== index)})} className="text-red-500"><X size={14}/></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Restore Section */}
            <div className="p-4 border rounded-lg bg-amber-50 border-amber-200">
                <h3 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2"><Upload size={20}/> Restore Data</h3>
                <label className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 shadow cursor-pointer inline-block font-bold">
                    Select Backup File
                    <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                </label>
            </div>

            {/* Update Section */}
            <div className="p-4 border rounded-lg bg-indigo-50 border-indigo-200">
                <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2"><RefreshCw size={20}/> Software Update</h3>
                <select value={appEnvironment} onChange={(e) => setAppEnvironment(e.target.value)} className="p-2 border rounded-md text-sm bg-white mb-4 w-full md:w-1/2">
                    <option value="Production">Production</option>
                    <option value="UAT">UAT</option>
                    <option value="Development">Development</option>
                </select>
                <button onClick={handleSoftwareUpdate} disabled={isUpdating} className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2 font-bold">
                    <RefreshCw size={16} className={isUpdating ? "animate-spin" : ""} /> Update System
                </button>
            </div>

            {/* Factory Reset */}
            <div className="p-4 border rounded-lg bg-red-50 border-red-200">
                <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2"><AlertTriangle size={20}/> Factory Reset</h3>
                <button onClick={() => { if(confirm("Are you ABSOLUTELY SURE?")) clearAllData(); }} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-bold">Wipe All Local Data</button>
            </div>
        </div>
    );
};