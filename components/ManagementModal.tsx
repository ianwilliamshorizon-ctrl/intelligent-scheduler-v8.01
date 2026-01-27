import React, { useState } from 'react';
import { 
    X, Settings, Users, Car, Wrench, Briefcase, Database, 
    Search, Plus, Activity, List, Package, ShieldCheck, Truck, Rocket 
} from 'lucide-react';

// Core State & Context
import { useData } from '../core/state/DataContext';
import { useApp } from '../core/state/AppContext';
import { setItem } from '../core/db';

// Import All Views from your library
import {
    ManagementCustomersTab,
    ManagementVehiclesTab,
    ManagementPartsTab,
    ManagementPackagesTab,
    ManagementSuppliersTab,
    ManagementDiagramsTab,
    ManagementStaffTab,
    ManagementRolesTab,
    ManagementEntitiesTab,
    ManagementNominalCodesTab,
    ManagementSystemView
} from './management/ManagementViews';

const ManagementModal: React.FC<any> = ({ isOpen, onClose, onManualBackup }) => {
    const data = useData();
    const { users, appEnvironment } = useApp();
    
    // UI State
    const [activeTab, setActiveTab] = useState('customers');
    const [searchQuery, setSearchQuery] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    if (!isOpen) return null;

    // --- SYSTEM LOGIC HANDLERS ---

    const handleGlobalSync = async () => {
        setIsUpdating(true);
        try {
            // Force save current data state to local indexedDB
            await Promise.all([
                setItem('brooks_customers', data.customers),
                setItem('brooks_vehicles', data.vehicles),
                setItem('brooks_parts', data.parts),
                setItem('brooks_nominal', data.nominalCodes),
                setItem('brooks_suppliers', data.suppliers),
                setItem('brooks_packages', data.servicePackages)
            ]);
            console.log("Master State Reconciled Successfully");
        } catch (error) {
            console.error("Master Sync Failure:", error);
        } finally {
            setTimeout(() => setIsUpdating(false), 1500);
        }
    };

    const handlePromoteToProduction = async () => {
        const confirmPromote = window.confirm(
            "CRITICAL: You are promoting this build to PRODUCTION. This will lock environment settings and point to live data. Continue?"
        );
        
        if (confirmPromote) {
            setIsUpdating(true);
            try {
                await setItem('app_environment', 'PRODUCTION');
                // Force a reload to pick up the new environment state across the app
                window.location.reload();
            } catch (e) {
                console.error("Promotion Error:", e);
                alert("Promotion failed. Check console for details.");
            } finally {
                setIsUpdating(false);
            }
        }
    };

    const handleEntityImport = (e: React.ChangeEvent<HTMLInputElement>, type: string, id: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        alert(`Initializing ${type} import for Entity: ${id}. Check console for progress.`);
        // CSV Parsing logic would trigger here
    };

    // Global Search Filter logic
    const q = searchQuery.toLowerCase();

    return (
        <div className="fixed inset-0 z-[999] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#f8fafc] w-full max-w-[1650px] h-[94vh] rounded-[3rem] shadow-2xl flex overflow-hidden border border-slate-300">
                
                {/* --- SIDEBAR NAVIGATION --- */}
                <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="bg-slate-900 p-2.5 rounded-2xl text-white shadow-xl shadow-slate-200">
                                <Settings size={22} className={isUpdating ? "animate-spin" : ""} />
                            </div>
                            <div>
                                <span className="font-black text-slate-900 text-xs uppercase tracking-tighter block">Management</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Core</span>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 overflow-y-auto py-6 custom-scrollbar">
                        <div className="px-8 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registries</div>
                        {[
                            { id: 'customers', label: 'Customers', icon: <Users size={18}/> },
                            { id: 'vehicles', label: 'Vehicles', icon: <Car size={18}/> },
                            { id: 'suppliers', label: 'Suppliers', icon: <Truck size={18}/> },
                            { id: 'parts', label: 'Inventory', icon: <Package size={18}/> },
                        ].map(item => (
                            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-8 py-3.5 text-sm font-bold transition-all ${activeTab === item.id ? 'bg-indigo-50 border-r-4 border-indigo-600 text-indigo-700' : 'text-slate-400 hover:bg-slate-50'}`}>
                                {item.icon} {item.label}
                            </button>
                        ))}

                        <div className="px-8 mt-8 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operations</div>
                        {[
                            { id: 'packages', label: 'Service Menu', icon: <Wrench size={18}/> },
                            { id: 'diagrams', label: 'Diagrams', icon: <Activity size={18}/> },
                            { id: 'staff', label: 'Staff & Roles', icon: <ShieldCheck size={18}/> },
                        ].map(item => (
                            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-8 py-3.5 text-sm font-bold transition-all ${activeTab === item.id ? 'bg-indigo-50 border-r-4 border-indigo-600 text-indigo-700' : 'text-slate-400 hover:bg-slate-50'}`}>
                                {item.icon} {item.label}
                            </button>
                        ))}

                        <div className="px-8 mt-8 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Financials & Cloud</div>
                        {[
                            { id: 'entities', label: 'Entities', icon: <Briefcase size={18}/> },
                            { id: 'nominal', label: 'Nominal Codes', icon: <List size={18}/> },
                            { id: 'system', label: 'System Terminal', icon: <Database size={18}/> }
                        ].map(item => (
                            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-8 py-3.5 text-sm font-bold transition-all ${activeTab === item.id ? 'bg-indigo-50 border-r-4 border-indigo-600 text-indigo-700' : 'text-slate-400 hover:bg-slate-50'}`}>
                                {item.icon} {item.label}
                            </button>
                        ))}
                    </nav>

                    <div className="p-8 border-t border-slate-100 bg-slate-50/30">
                        <button onClick={onClose} className="w-full py-4 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase text-slate-500 hover:border-rose-200 hover:text-rose-600 transition-all tracking-widest shadow-sm">
                            Exit Terminal
                        </button>
                    </div>
                </aside>

                {/* --- MAIN CONTENT AREA --- */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    <header className="h-28 border-b border-slate-100 px-12 flex items-center justify-between shrink-0">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{activeTab.replace(/([A-Z])/g, ' $1')}</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registry Management System v8.01</p>
                        </div>
                        
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder={`Filter ${activeTab}...`} 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-slate-100 border-none rounded-2xl py-3.5 pl-12 pr-6 text-sm font-bold focus:ring-2 focus:ring-indigo-500 w-96 outline-none transition-all" 
                                />
                            </div>
                            <button className="bg-slate-900 text-white px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
                                <Plus size={20} className="inline mr-1 -mt-0.5"/> Add New
                            </button>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto p-12 bg-[#f8fafc]">
                        {/* 1. Customers */}
                        {activeTab === 'customers' && (
                            <ManagementCustomersTab 
                                customers={data.customers.filter((c:any) => `${c.forename} ${c.surname}`.toLowerCase().includes(q))} 
                                onEdit={() => {}} 
                            />
                        )}

                        {/* 2. Vehicles */}
                        {activeTab === 'vehicles' && (
                            <ManagementVehiclesTab 
                                vehicles={data.vehicles.filter((v:any) => v.registration.toLowerCase().includes(q))} 
                                customers={data.customers}
                                onEdit={() => {}} 
                            />
                        )}

                        {/* 3. Suppliers */}
                        {activeTab === 'suppliers' && (
                            <ManagementSuppliersTab 
                                suppliers={(data.suppliers || []).filter((s:any) => s.name.toLowerCase().includes(q))} 
                                onEdit={() => {}} 
                            />
                        )}

                        {/* 4. Inventory */}
                        {activeTab === 'parts' && (
                            <ManagementPartsTab 
                                parts={data.parts.filter((p:any) => p.name.toLowerCase().includes(q))} 
                                onEdit={() => {}} 
                            />
                        )}

                        {/* 5. Service Packages */}
                        {activeTab === 'packages' && (
                            <ManagementPackagesTab 
                                packages={data.servicePackages.filter((p:any) => p.name.toLowerCase().includes(q))} 
                                onEdit={() => {}} 
                            />
                        )}

                        {/* 6. Diagrams */}
                        {activeTab === 'diagrams' && (
                            <ManagementDiagramsTab 
                                diagrams={data.inspectionDiagrams} 
                                onEdit={() => {}} 
                                onAutoAssign={() => {}} 
                            />
                        )}

                        {/* 7. Staff & Roles (Unified View) */}
                        {activeTab === 'staff' && (
                            <div className="space-y-12">
                                <section>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Personnel List</h3>
                                    <ManagementStaffTab users={users} onEdit={() => {}} />
                                </section>
                                <section>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Access Control Policies</h3>
                                    <ManagementRolesTab 
                                        roles={data.roles && data.roles.length > 0 ? data.roles : [
                                            { id: 'r1', name: 'Master Administrator', permissions: [1,2,3,4,5] },
                                            { id: 'r2', name: 'Service Technician', permissions: [1,2] }
                                        ]} 
                                        onEdit={() => {}} 
                                    />
                                </section>
                            </div>
                        )}

                        {/* 8. Business Entities */}
                        {activeTab === 'entities' && (
                            <ManagementEntitiesTab 
                                entities={data.businessEntities} 
                                onEdit={() => {}} 
                                onImportData={handleEntityImport}
                            />
                        )}

                        {/* 9. Nominal Codes */}
                        {activeTab === 'nominal' && (
                            <ManagementNominalCodesTab 
                                codes={data.nominalCodes.filter((n:any) => n.name.toLowerCase().includes(q) || n.code.includes(q))} 
                                onEdit={() => {}} 
                            />
                        )}

                        {/* 10. System Terminal */}
                        {activeTab === 'system' && (
                            <ManagementSystemView 
                                appEnvironment={appEnvironment}
                                onManualBackup={onManualBackup}
                                onForceSync={handleGlobalSync}
                                onPromote={handlePromoteToProduction}
                                isUpdating={isUpdating}
                            />
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ManagementModal;