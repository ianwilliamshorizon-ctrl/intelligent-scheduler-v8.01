import React, { useState } from 'react';
import { 
    Cloud, Database, ShieldCheck, RefreshCw, HardDrive, 
    Lock, Globe, ArrowLeft, Edit3, Settings, 
    ChevronRight, AlertTriangle, CheckCircle2, Server,Info
} from 'lucide-react';

export const SystemModule = ({ data, triggerModal }: any) => {
    const [selectedUtility, setSelectedUtility] = useState<any>(null);

    // Infrastructure categories
    const utilities = [
        { id: 'cloud', name: 'Cloud Synchronization', status: 'Online', icon: <Globe size={24}/>, desc: 'Real-time multi-device data mirroring' },
        { id: 'backup', name: 'Database Backups', status: 'Protected', icon: <Database size={24}/>, desc: 'Automated point-in-time recovery points' },
        { id: 'security', name: 'Security & Encryption', status: 'Active', icon: <Lock size={24}/>, desc: 'AES-256 local and transit encryption' },
        { id: 'sync', name: 'Local Cache', status: 'Optimized', icon: <HardDrive size={24}/>, desc: 'Offline-first storage management' }
    ];

    if (!selectedUtility) {
        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="px-4">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Infrastructure Management</p>
                    <h2 className="text-xl font-black text-slate-900">System Stability & Sync</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {utilities.map((util) => (
                        <button 
                            key={util.id} 
                            onClick={() => setSelectedUtility(util)} 
                            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group hover:border-indigo-500 transition-all shadow-sm"
                        >
                            <div className="flex items-center gap-6 text-left">
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                    {util.icon}
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-900 leading-tight">{util.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{util.status}</p>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-slate-200 group-hover:text-indigo-600 transition-all" />
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 duration-400">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-6">
                    <button onClick={() => setSelectedUtility(null)} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all">
                        <ArrowLeft size={20}/>
                    </button>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900">{selectedUtility.name}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Architecture Control</p>
                    </div>
                </div>

                <button 
                    onClick={() => triggerModal('SYSTEM_CONFIG_FORM', selectedUtility)}
                    className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg"
                >
                    <Settings size={16}/> Configure Logic
                </button>
            </div>

            <div className="grid grid-cols-3 gap-8">
                {/* 1. Health Monitor */}
                <div className="col-span-1 space-y-6">
                    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                        <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Connection Health</h4>
                        <div className="space-y-6">
                            <StatusIndicator label="Uptime" value="99.98%" status="good" />
                            <StatusIndicator label="Latency" value="24ms" status="good" />
                            <StatusIndicator label="Last Verified" value="2 mins ago" status="neutral" />
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-4">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="text-emerald-400" size={20}/>
                            <p className="text-[10px] font-black uppercase tracking-widest">Zero-Loss Protocol</p>
                        </div>
                        <p className="text-xs font-bold text-slate-400 leading-relaxed">
                            Every database transaction is locally journaled before being pushed to the cloud cluster.
                        </p>
                    </div>
                </div>

                {/* 2. Action Logs & Restore Points */}
                <div className="col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <button className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 text-left group hover:bg-indigo-600 transition-all">
                            <RefreshCw className="text-indigo-600 group-hover:text-white mb-4" size={24}/>
                            <h4 className="font-black text-indigo-900 group-hover:text-white text-sm uppercase tracking-widest">Trigger Manual Sync</h4>
                        </button>
                        <button className="p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100 text-left group hover:bg-rose-600 transition-all">
                            <AlertTriangle className="text-rose-600 group-hover:text-white mb-4" size={24}/>
                            <h4 className="font-black text-rose-900 group-hover:text-white text-sm uppercase tracking-widest">Initialize Restore</h4>
                        </button>
                    </div>

                    <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                            <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Recent System Logs</h4>
                            <Server size={16} className="text-slate-200" />
                        </div>
                        <div className="divide-y divide-slate-50">
                            <LogItem msg="Daily Backup (Automatic) Completed" time="04:00 AM" icon={<CheckCircle2 size={14} className="text-emerald-500"/>} />
                            <LogItem msg="Cloud Metadata Handshake Successful" time="09:12 AM" icon={<CheckCircle2 size={14} className="text-emerald-500"/>} />
                            <LogItem msg="Local Cache Cleaned (1.2GB Freed)" time="11:45 AM" icon={<Info size={14} className="text-blue-500"/>} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- HELPERS ---

const StatusIndicator = ({ label, value, status }: any) => (
    <div className="flex justify-between items-end border-b border-slate-50 pb-4">
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-xl font-black text-slate-900">{value}</p>
        </div>
        <div className={`h-2 w-8 rounded-full ${status === 'good' ? 'bg-emerald-400' : 'bg-slate-200'}`} />
    </div>
);

const LogItem = ({ msg, time, icon }: any) => (
    <div className="p-6 flex justify-between items-center bg-white">
        <div className="flex items-center gap-4">
            {icon}
            <span className="text-sm font-bold text-slate-700">{msg}</span>
        </div>
        <span className="text-[10px] font-black text-slate-300 uppercase">{time}</span>
    </div>
);