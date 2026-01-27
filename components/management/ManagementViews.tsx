import React from 'react';
import { 
    Edit2, Trash2, FileText, Briefcase, Image as ImageIcon, 
    RefreshCw, ShieldCheck, Package, Settings, ExternalLink,
    Users, Car, List, Activity, Database, Download, Clock, Cloud, Truck, Rocket, Wrench
} from 'lucide-react';

// --- 1. CUSTOMERS ---
export const ManagementCustomersTab = ({ customers, onEdit }: any) => (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-in fade-in duration-300">
        <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">ID / Client Name</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Contact Information</th>
                    <th className="px-6 py-4"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {customers.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{c.forename} {c.surname}</div>
                            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{c.id}</div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="text-sm text-slate-600 font-medium">{c.email || 'No Email'}</div>
                            <div className="text-xs text-slate-400">{c.mobile || c.phone || 'No Phone'}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <button onClick={() => onEdit(c)} className="p-2 text-slate-400 hover:text-indigo-600 transition-all"><Edit2 size={16}/></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// --- 2. VEHICLES ---
export const ManagementVehiclesTab = ({ vehicles, customers, onEdit }: any) => (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Registration</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Make / Model</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Owner</th>
                    <th className="px-6 py-4"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {vehicles.map((v: any) => {
                    const owner = customers?.find((c: any) => c.id === v.customerId);
                    return (
                        <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-indigo-600 tracking-tighter">{v.registration}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-slate-700">{v.make} {v.model}</td>
                            <td className="px-6 py-4 text-sm text-slate-500 font-medium">{owner ? `${owner.forename} ${owner.surname}` : 'Unassigned'}</td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => onEdit(v)} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 size={16}/></button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

// --- 3. INVENTORY (PARTS) ---
export const ManagementPartsTab = ({ parts, onEdit }: any) => (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
                <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Part Description</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Stock Level</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 text-right">Unit Price</th>
                    <th className="px-6 py-4"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {parts.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{p.name}</div>
                            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{p.sku || 'NO_SKU'}</div>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${p.stock < 5 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                                {p.stock} Units
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-700">£{p.unitPrice}</td>
                        <td className="px-6 py-4 text-right"><button onClick={() => onEdit(p)} className="p-2 hover:text-indigo-600 transition-all"><Edit2 size={16}/></button></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// --- 4. SERVICE PACKAGES ---
export const ManagementPackagesTab = ({ packages, onEdit }: any) => (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
                <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Service Name / Description</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 text-center">Category</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 text-right">Base Price</th>
                    <th className="px-6 py-4"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {packages.map((pkg: any) => (
                    <tr key={pkg.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{pkg.name}</div>
                            <div className="text-xs text-slate-400 italic line-clamp-1">{pkg.description}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase">{pkg.category || 'Service'}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-indigo-600">£{pkg.price}</td>
                        <td className="px-6 py-4 text-right"><button onClick={() => onEdit(pkg)} className="p-2 hover:text-indigo-600"><Edit2 size={16}/></button></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// --- 5. SUPPLIERS ---
export const ManagementSuppliersTab = ({ suppliers, onEdit }: any) => (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
                <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Supplier Name</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Contact / Email</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">A/C Ref</th>
                    <th className="px-6 py-4"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {suppliers.map((s: any) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold text-slate-900">{s.name}</td>
                        <td className="px-6 py-4 text-xs text-slate-500 font-medium">{s.email || s.phone}</td>
                        <td className="px-6 py-4 font-mono text-[10px] text-indigo-600 font-black uppercase">{s.accountCode || 'NONE'}</td>
                        <td className="px-6 py-4 text-right"><button onClick={() => onEdit(s)} className="p-2 hover:text-indigo-600 transition-all"><Edit2 size={16}/></button></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// --- 6. DIAGRAMS ---
export const ManagementDiagramsTab = ({ diagrams, onEdit, onAutoAssign }: any) => (
    <div className="space-y-4">
        <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div>
                <h4 className="font-bold text-slate-800 text-sm">Asset Template Library</h4>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{diagrams.length} Diagrams Mapped</p>
            </div>
            <button onClick={onAutoAssign} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-600 transition-all">
                <RefreshCw size={14} /> Re-Sync Templates
            </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {diagrams.map((d: any) => (
                <div key={d.id} className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all text-center">
                    <div className="aspect-square bg-slate-50 rounded-lg mb-3 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50">
                        <ImageIcon size={24} className="text-slate-300 group-hover:text-indigo-300 transition-colors" />
                    </div>
                    <div className="font-bold text-[10px] text-slate-800 uppercase truncate tracking-tight">{d.make} {d.model}</div>
                    <button onClick={() => onEdit(d)} className="absolute top-2 right-2 p-1.5 bg-white shadow-sm rounded-lg border opacity-0 group-hover:opacity-100 transition-all"><Edit2 size={12}/></button>
                </div>
            ))}
        </div>
    </div>
);

// --- 7. STAFF (USERS) ---
export const ManagementStaffTab = ({ users, onEdit }: any) => (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
                <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Staff Member</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Access Role</th>
                    <th className="px-6 py-4"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="text-xs text-slate-400">{u.email}</div>
                        </td>
                        <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-[10px] font-black uppercase tracking-widest border border-indigo-100">{u.role}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <button onClick={() => onEdit(u)} className="p-2 text-slate-400 hover:text-indigo-600 transition-all"><Edit2 size={16}/></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// --- 8. ROLES & PERMISSIONS ---
export const ManagementRolesTab = ({ roles, onEdit }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((role: any) => (
            <div key={role.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-slate-900 text-white rounded-xl shadow-lg group-hover:bg-indigo-600 transition-colors">
                        <ShieldCheck size={20}/>
                    </div>
                </div>
                <h4 className="font-black text-slate-900 uppercase text-sm tracking-tight mb-1">{role.name}</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6">
                    {role.permissions?.length || 0} Security Nodes Defined
                </p>
                <button onClick={() => onEdit(role)} className="w-full py-3 bg-slate-50 text-slate-600 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all tracking-widest">Manage Rights</button>
            </div>
        ))}
    </div>
);

// --- 9. BUSINESS ENTITIES ---
export const ManagementEntitiesTab = ({ entities, onEdit, onImportData }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {entities.map((entity: any) => (
            <div key={entity.id} className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
                <div className="p-6 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 flex justify-between items-center text-white">
                    <div>
                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{entity.shortCode}</div>
                        <h3 className="font-bold text-xl tracking-tight">{entity.name}</h3>
                    </div>
                    <button onClick={() => onEdit(entity)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"><Settings size={20}/></button>
                </div>
                <div className="p-8 grid grid-cols-2 gap-4">
                    <label className="group p-6 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:bg-indigo-600/20 cursor-pointer text-center transition-all">
                        <input type="file" className="hidden" accept=".csv" onChange={(e) => onImportData(e, 'invoices', entity.id)} />
                        <FileText className="mx-auto text-slate-500 group-hover:text-indigo-400 mb-2" size={28}/>
                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Invoices CSV</div>
                    </label>
                    <label className="group p-6 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:bg-emerald-600/20 cursor-pointer text-center transition-all">
                        <input type="file" className="hidden" accept=".csv" onChange={(e) => onImportData(e, 'jobs', entity.id)} />
                        <Briefcase className="mx-auto text-slate-500 group-hover:text-emerald-400 mb-2" size={28}/>
                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Jobs CSV</div>
                    </label>
                </div>
            </div>
        ))}
    </div>
);

// --- 10. NOMINAL CODES ---
export const ManagementNominalCodesTab = ({ codes, onEdit }: any) => (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
                <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Ledger Code</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Account Name</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Tax & Rules</th>
                    <th className="px-6 py-4"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {codes.map((code: any) => (
                    <tr key={code.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4"><span className="font-mono text-sm font-black text-indigo-600">{code.code}</span></td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-700">{code.name}</td>
                        <td className="px-6 py-4 flex gap-2">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-widest border border-slate-200">{code.taxCode || 'T0'}</span>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-black uppercase border border-emerald-100">Auto-Post</span>
                        </td>
                        <td className="px-6 py-4 text-right"><button onClick={() => onEdit(code)} className="p-2 hover:text-indigo-600 transition-all"><Settings size={14}/></button></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// --- 11. SYSTEM TERMINAL ---
export const ManagementSystemView = ({ appEnvironment, onManualBackup, onForceSync, onPromote, isUpdating }: any) => (
    <div className="space-y-6 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                    <h3 className="font-black text-[10px] uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2"><RefreshCw size={14}/> Software Hub</h3>
                    <div className="text-xl font-black text-slate-900 mb-1">v8.01.27</div>
                    <p className="text-xs text-slate-500 mb-6 font-medium">Build is current and stable.</p>
                </div>
                <button className="w-full bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
                    <Download size={14}/> Check Updates
                </button>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-black text-[10px] uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2"><Clock size={14}/> Cloud Scheduler</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-600">Frequency</span><span className="text-[10px] font-black text-slate-900 uppercase">Every 6 Hours</span></div>
                    <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-600">Sync Status</span><span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active</span></div>
                </div>
            </div>
            <div className="p-6 bg-indigo-600 rounded-2xl shadow-xl text-white">
                <h3 className="font-black text-[10px] uppercase text-indigo-200 tracking-widest mb-4 flex items-center gap-2"><Cloud size={14}/> Environment</h3>
                <div className="text-2xl font-black mb-6 uppercase tracking-tighter flex items-center gap-2">
                    {appEnvironment}
                    {appEnvironment !== 'PRODUCTION' && <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"/>}
                </div>
                <div className="flex gap-2">
                    <button onClick={onManualBackup} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl text-[10px] font-black uppercase transition-all">JSON Backup</button>
                    {appEnvironment !== 'PRODUCTION' && (
                        <button onClick={onPromote} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg flex items-center justify-center gap-2">
                            <Rocket size={14}/> Promote
                        </button>
                    )}
                </div>
            </div>
        </div>
        <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"/>
                    <h3 className="text-white font-black text-xs uppercase tracking-widest">Global Master Reconcile</h3>
                </div>
                <span className="text-slate-500 font-mono text-[10px]">CORE_v801_ACTIVE</span>
            </div>
            <p className="text-slate-400 text-sm mb-8 max-w-2xl leading-relaxed">Forces a bitwise reconciliation across local indexedDB and the cloud master state. Use this to clear stuck local cache flags.</p>
            <button onClick={onForceSync} disabled={isUpdating} className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/40">
                {isUpdating ? 'Reconciling State...' : 'Initialize Master Sync'}
            </button>
        </div>
    </div>
);