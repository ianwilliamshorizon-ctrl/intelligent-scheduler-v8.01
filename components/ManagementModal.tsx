import React, { useState } from 'react';
import { useData } from '../core/state/DataContext';
import { useApp } from '../core/state/AppContext';
import { Settings, Database, X, Save, CheckCircle, AlertTriangle, Info, Server, Download, Package, Users, CarFront, List } from 'lucide-react';

// Using the confirmed path
import { getDb } from '../core/db'; 
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';

// Sub-components
import { ManagementCustomersTab, ManagementVehiclesTab, ManagementPartsTab, ManagementPackagesTab } from './management/ManagementViews';
import ServicePackageFormModal from './ServicePackageFormModal';

const ManagementModal: React.FC<any> = ({ isOpen, onClose, selectedEntityId, onManualBackup }) => {
    const dataContext = useData();
    const { 
        customers, vehicles, parts, servicePackages, 
        setServicePackages, taxRates, businessEntities
    } = dataContext;
    
    const [activeTab, setActiveTab] = useState('customers');
    const [isSyncing, setIsSyncing] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', msg: string } | null>(null);
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<any>(null);

    if (!isOpen) return null;

    const handleCloudSync = async () => {
        setIsSyncing(true);
        setStatus({ type: 'info', msg: 'Cleaning data and preparing cloud batch...' });

        const db = getDb();
        
        // We define them separately to maintain strict ID checking without TS errors
        const registry = [
            { name: 'brooks_parts', data: parts, idKey: 'partNumber' },
            { name: 'brooks_customers', data: customers, idKey: 'id' },
            { name: 'brooks_vehicles', data: vehicles, idKey: 'registration' },
            { name: 'brooks_servicePackages', data: servicePackages, idKey: 'id' }
        ];

        try {
            for (const col of registry) {
                // Filter items that actually have the required ID key
                const validData = col.data.filter((item: any) => item && (item.id || item[col.idKey]));
                
                if (validData.length === 0) continue;

                for (let i = 0; i < validData.length; i += 500) {
                    const batch = writeBatch(db);
                    const chunk = validData.slice(i, i + 500);

                    chunk.forEach((item: any) => {
                        // Priority: item.id -> item[idKey] -> fallback
                        const docId = String(item.id || item[col.idKey] || `gen_${Math.random().toString(36).substr(2, 9)}`);
                        const docRef = doc(db, col.name, docId);
                        
                        // Clean the object of any potential 'undefined' values before saving
                        const cleanItem = JSON.parse(JSON.stringify(item));
                        batch.set(docRef, { ...cleanItem, lastAdminSync: serverTimestamp() }, { merge: true });
                    });

                    await batch.commit();
                }
            }
            setStatus({ type: 'success', msg: 'Push complete. All data committed to Firestore.' });
        } catch (err: any) {
            console.error("Sync Error:", err);
            setStatus({ type: 'error', msg: `Sync failed: ${err.message}` });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 text-slate-900">
            <div className="bg-white w-full max-w-6xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="px-8 py-5 border-b flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                            <Settings size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Admin Console</h2>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Database Control</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleCloudSync}
                            disabled={isSyncing}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-md ${
                                isSyncing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95'
                            }`}
                        >
                            <Save size={18} className={isSyncing ? 'animate-pulse' : ''}/>
                            {isSyncing ? 'Syncing...' : 'Push to Cloud'}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {status && (
                    <div className={`px-8 py-3 flex items-center gap-3 border-b font-bold text-sm ${
                        status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 
                        status.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                        {status.type === 'success' ? <CheckCircle size={16}/> : status.type === 'error' ? <AlertTriangle size={16}/> : <Info size={16}/>}
                        {status.msg}
                    </div>
                )}

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 bg-slate-50 border-r p-6 space-y-2">
                        <NavButton id="customers" label="Customers" icon={Users} active={activeTab} setter={setActiveTab} />
                        <NavButton id="vehicles" label="Vehicles" icon={CarFront} active={activeTab} setter={setActiveTab} />
                        <NavButton id="parts" label="Inventory" icon={Package} active={activeTab} setter={setActiveTab} />
                        <NavButton id="packages" label="Service Packages" icon={List} active={activeTab} setter={setActiveTab} />
                        <div className="my-6 border-t border-slate-200" />
                        <NavButton id="sync" label="Cloud & Backup" icon={Database} active={activeTab} setter={setActiveTab} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8">
                        {activeTab === 'customers' && <ManagementCustomersTab customers={customers} />}
                        {activeTab === 'parts' && <ManagementPartsTab parts={parts} />}
                        {activeTab === 'vehicles' && <ManagementVehiclesTab vehicles={vehicles} />}
                        {activeTab === 'packages' && (
                            <ManagementPackagesTab 
                                packages={servicePackages} 
                                onEdit={(pkg: any) => { setSelectedPackage(pkg); setIsPackageModalOpen(true); }}
                            />
                        )}
                        {activeTab === 'sync' && (
                            <div className="max-w-2xl space-y-8">
                                <section className="p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                                    <Database size={40} className="mx-auto mb-4 text-slate-300" />
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Push Local Imports to Cloud</h3>
                                    <p className="text-slate-500 mb-6">If you've just uploaded CSV data, this writes it into the permanent Firestore database.</p>
                                    <button onClick={handleCloudSync} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 shadow-xl">
                                        Run Sync Now
                                    </button>
                                </section>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Service Package Editor Modal */}
            {isPackageModalOpen && (
                <ServicePackageFormModal 
                    isOpen={isPackageModalOpen}
                    onClose={() => { setIsPackageModalOpen(false); setSelectedPackage(null); }}
                    onSave={(pkg: any) => {
                        setServicePackages((prev: any[]) => {
                            const exists = prev.some(p => p.id === pkg.id);
                            return exists ? prev.map(p => p.id === pkg.id ? pkg : p) : [pkg, ...prev];
                        });
                    }}
                    servicePackage={selectedPackage}
                    taxRates={taxRates}
                    entityId={selectedEntityId}
                    businessEntities={businessEntities}
                    parts={parts}
                />
            )}
        </div>
    );
};

const NavButton = ({ id, label, icon: Icon, active, setter }: any) => (
    <button 
        onClick={() => setter(id)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
            active === id ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:bg-slate-100'
        }`}
    >
        <Icon size={20} />
        {label}
    </button>
);

export default ManagementModal;