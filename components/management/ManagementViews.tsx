
import React, { useState } from 'react';
import { useData } from '../../core/state/DataContext';
import { useApp } from '../../core/state/AppContext';
import { User, Role, Customer, Vehicle, Part, Supplier, ServicePackage, InspectionDiagram, NominalCode, NominalCodeRule, BusinessEntity } from '../../types';
import { PlusCircle, Trash2, Edit, Upload, RefreshCw, Zap, FolderInput, CarFront } from 'lucide-react';
import { formatCurrency } from '../../utils/formatUtils';
import AsyncImage from '../AsyncImage';

// Helper for row selection checkboxes
const CheckboxCell = ({ id, selectedIds, onToggle }: { id: string, selectedIds: Set<string>, onToggle: (id: string) => void }) => (
    <td className="p-2 text-center">
        <input 
            type="checkbox" 
            checked={selectedIds.has(id)} 
            onChange={() => onToggle(id)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
    </td>
);

// --- 1. Customers Tab ---
export const ManagementCustomersTab = ({ 
    searchTerm, 
    onAdd, 
    onEdit, 
    onDelete, 
    onImport,
    selectedIds,
    onToggleSelection,
    onSelectAll,
    onBulkDelete
}: any) => {
    const { customers } = useData();
    const filtered = customers.filter(c => 
        `${c.forename} ${c.surname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.companyName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                        <button onClick={onBulkDelete} className="bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200 flex items-center gap-2 text-sm font-semibold">
                            <Trash2 size={16}/> Delete ({selectedIds.size})
                        </button>
                    )}
                </div>
                <div className="flex gap-2">
                    <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer shadow">
                        <Upload size={16}/> Import CSV
                        <input type="file" accept=".csv" className="hidden" onChange={onImport} />
                    </label>
                    <button onClick={onAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2">
                        <PlusCircle size={16}/> Add Customer
                    </button>
                </div>
            </div>
            <div className="overflow-y-auto max-h-[70vh]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 sticky top-0">
                        <tr>
                            <th className="p-2 w-10 text-center">
                                <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={() => onSelectAll(filtered)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                            </th>
                            <th className="p-2">Name</th><th className="p-2">Account No</th><th className="p-2">Contact</th><th className="p-2">Postcode</th><th className="p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(c => (
                            <tr key={c.id} className="border-b hover:bg-gray-50">
                                <CheckboxCell id={c.id} selectedIds={selectedIds} onToggle={onToggleSelection} />
                                <td className="p-2 font-medium">{c.forename} {c.surname} {c.companyName ? `(${c.companyName})` : ''}</td>
                                <td className="p-2 font-mono text-xs">{c.id}</td>
                                <td className="p-2">{c.phone || c.mobile || c.email}</td>
                                <td className="p-2">{c.postcode}</td>
                                <td className="p-2">
                                    <button onClick={() => onEdit(c)} className="text-indigo-600 hover:underline mr-3">Edit</button>
                                    <button onClick={() => onDelete(c.id)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- 2. Vehicles Tab ---
export const ManagementVehiclesTab = ({ 
    searchTerm, 
    onAdd, 
    onEdit, 
    onDelete, 
    onImport,
    selectedIds,
    onToggleSelection,
    onSelectAll,
    onBulkDelete,
    onAutoAssign,
    isUpdating
}: any) => {
    const { vehicles, customers } = useData();
    const filtered = vehicles.filter(v => 
        v.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
             <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-2">
                     {selectedIds.size > 0 && (
                        <button onClick={onBulkDelete} className="bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200 flex items-center gap-2 text-sm font-semibold">
                            <Trash2 size={16}/> Delete ({selectedIds.size})
                        </button>
                    )}
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={onAutoAssign} disabled={isUpdating} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 shadow flex items-center gap-2 disabled:opacity-50">
                        {isUpdating ? <RefreshCw size={16} className="animate-spin"/> : <Zap size={16}/>} Auto-Assign Diagrams
                    </button>
                    <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer shadow">
                        <Upload size={16}/> Import CSV
                        <input type="file" accept=".csv" className="hidden" onChange={onImport} />
                    </label>
                    <button onClick={onAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2">
                        <PlusCircle size={16}/> Add Vehicle
                    </button>
                </div>
            </div>
            <div className="overflow-y-auto max-h-[70vh]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 sticky top-0">
                        <tr>
                            <th className="p-2 w-10 text-center">
                                <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={() => onSelectAll(filtered)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                            </th>
                            <th className="p-2">Registration</th><th className="p-2">Make/Model</th><th className="p-2">Owner</th><th className="p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(v => {
                            const owner = customers.find(c => c.id === v.customerId);
                            return (
                                <tr key={v.id} className="border-b hover:bg-gray-50">
                                    <CheckboxCell id={v.id} selectedIds={selectedIds} onToggle={onToggleSelection} />
                                    <td className="p-2 font-mono font-bold">{v.registration}</td>
                                    <td className="p-2">{v.make} {v.model}</td>
                                    <td className="p-2">{owner ? `${owner.forename} ${owner.surname}` : 'Unknown'}</td>
                                    <td className="p-2">
                                        <button onClick={() => onEdit(v)} className="text-indigo-600 hover:underline mr-3">Edit</button>
                                        <button onClick={() => onDelete(v.id)} className="text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- 3. Diagrams Tab ---
export const ManagementDiagramsTab = ({ 
    searchTerm, 
    onAdd, 
    onEdit, 
    onDelete, 
    onBulkUpload
}: any) => {
    const { inspectionDiagrams } = useData();
    const filtered = inspectionDiagrams.filter(d => 
        d.make.toLowerCase().includes(searchTerm.toLowerCase()) || 
        d.model.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
             <div className="flex justify-end items-center mb-4 gap-2">
                <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer shadow">
                    <FolderInput size={16}/> Bulk Upload
                    <input type="file" multiple accept="image/*" className="hidden" onChange={onBulkUpload} />
                </label>
                <button onClick={onAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2">
                    <PlusCircle size={16}/> Add Diagram
                </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto max-h-[70vh]">
                {filtered.map(d => (
                    <div key={d.id} className="border rounded-lg bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group">
                        <div className="h-32 bg-gray-100 flex items-center justify-center p-2">
                            <AsyncImage imageId={d.imageId} alt={`${d.make} ${d.model}`} className="max-w-full max-h-full object-contain"/>
                        </div>
                        <div className="p-3">
                            <h4 className="font-bold text-sm text-gray-800">{d.make}</h4>
                            <p className="text-xs text-gray-600">{d.model}</p>
                        </div>
                         <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onEdit(d)} className="p-1 bg-white rounded-full text-indigo-600 hover:text-indigo-800 shadow"><Edit size={14}/></button>
                            <button onClick={() => onDelete(d.id)} className="p-1 bg-white rounded-full text-red-600 hover:text-red-800 shadow"><Trash2 size={14}/></button>
                        </div>
                    </div>
                ))}
                 {filtered.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500">
                        <CarFront size={48} className="mx-auto mb-2 text-gray-300" />
                        <p>No diagrams found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- 4. Staff Tab ---
export const ManagementStaffTab = ({ onAdd, onEdit, onDelete }: any) => {
    const { users } = useApp();
    return (
        <div>
            <div className="flex justify-end mb-4">
                 <button onClick={onAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2">
                    <PlusCircle size={16}/> Add Staff Member
                </button>
            </div>
             <div className="overflow-y-auto max-h-[70vh]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 sticky top-0"><tr><th className="p-2">Name</th><th className="p-2">Role</th><th className="p-2">Actions</th></tr></thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 font-medium">{u.name}</td>
                                <td className="p-2">{u.role}</td>
                                <td className="p-2">
                                    <button onClick={() => onEdit(u)} className="text-indigo-600 hover:underline mr-2">Edit</button>
                                    <button onClick={() => onDelete(u.id)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- 5. Roles Tab ---
export const ManagementRolesTab = ({ onAdd, onEdit }: any) => {
    const { roles } = useData();
    return (
         <div>
            <div className="flex justify-end mb-4">
                 <button onClick={onAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2">
                    <PlusCircle size={16}/> Add Role
                </button>
            </div>
             <div className="overflow-y-auto max-h-[70vh]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 sticky top-0"><tr><th className="p-2">Role Name</th><th className="p-2">Base Permissions</th><th className="p-2">Actions</th></tr></thead>
                    <tbody>
                        {roles.map(r => (
                            <tr key={r.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 font-medium">{r.name}</td>
                                <td className="p-2">{r.baseRole}</td>
                                <td className="p-2">
                                    <button onClick={() => onEdit(r)} className="text-indigo-600 hover:underline mr-2">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- 6. Entities Tab ---
export const ManagementEntitiesTab = ({ onAdd, onEdit, onImportJobs, onImportInvoices, setImportTargetEntityId }: any) => {
    const { businessEntities } = useData();
    return (
        <div>
            <div className="flex justify-end mb-4">
                 <button onClick={onAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2">
                    <PlusCircle size={16}/> Add Business Entity
                </button>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[70vh]">
                {businessEntities.map(e => (
                    <div key={e.id} className={`p-4 border-2 rounded-lg transition-all border-${e.color}-200 bg-white relative group`}>
                        <div className={`w-full h-2 bg-${e.color}-500 rounded-t mb-2`}></div>
                        <div className="flex justify-between items-start cursor-pointer" onClick={() => onEdit(e)}>
                            <div>
                                <h3 className="font-bold text-lg">{e.name}</h3>
                                <p className="text-sm text-gray-500">{e.type}</p>
                                <p className="text-xs text-gray-400 mt-2">{e.city}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t flex gap-2 justify-end">
                            <label className="text-xs flex items-center gap-1 cursor-pointer bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200" title="Import Jobs CSV">
                                <Upload size={12} /> Import Jobs
                                <input type="file" accept=".csv" className="hidden" onClick={() => setImportTargetEntityId(e.id)} onChange={onImportJobs} />
                            </label>
                            <label className="text-xs flex items-center gap-1 cursor-pointer bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200" title="Import Invoices CSV">
                                <Upload size={12} /> Import Invoices
                                <input type="file" accept=".csv" className="hidden" onClick={() => setImportTargetEntityId(e.id)} onChange={onImportInvoices} />
                            </label>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- 7. Suppliers Tab ---
export const ManagementSuppliersTab = ({ onAdd, onEdit, onDelete }: any) => {
    const { suppliers } = useData();
    return (
        <div>
            <div className="flex justify-end mb-4">
                 <button onClick={onAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2">
                    <PlusCircle size={16}/> Add Supplier
                </button>
            </div>
             <div className="overflow-y-auto max-h-[70vh]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 sticky top-0"><tr><th className="p-2">Company Name</th><th className="p-2">Contact Person</th><th className="p-2">Details</th><th className="p-2">Actions</th></tr></thead>
                    <tbody>
                        {suppliers.map(s => (
                            <tr key={s.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 font-medium">{s.name}</td>
                                <td className="p-2">{s.contactName}</td>
                                <td className="p-2 text-xs">{s.phone} / {s.email}</td>
                                <td className="p-2">
                                    <button onClick={() => onEdit(s)} className="text-indigo-600 hover:underline mr-2">Edit</button>
                                    <button onClick={() => onDelete(s.id)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- 8. Parts Tab ---
export const ManagementPartsTab = ({ searchTerm, onAdd, onEdit, onDelete, onImport }: any) => {
    const { parts } = useData();
    const filtered = parts.filter(p => p.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div>
            <div className="flex justify-end items-center mb-4 gap-2">
                <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer shadow">
                    <Upload size={16}/> Import CSV
                    <input type="file" accept=".csv" className="hidden" onChange={onImport} />
                </label>
                <button onClick={onAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2">
                    <PlusCircle size={16}/> Add Part
                </button>
            </div>
             <div className="overflow-y-auto max-h-[70vh]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 sticky top-0"><tr><th className="p-2">Part No.</th><th className="p-2">Description</th><th className="p-2 text-right">Stock</th><th className="p-2 text-right">Price</th><th className="p-2">Actions</th></tr></thead>
                    <tbody>
                        {filtered.map(p => (
                            <tr key={p.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 font-mono">{p.partNumber}</td>
                                <td className="p-2">{p.description}</td>
                                <td className="p-2 text-right">{p.stockQuantity}</td>
                                <td className="p-2 text-right">{formatCurrency(p.salePrice)}</td>
                                <td className="p-2">
                                    <button onClick={() => onEdit(p)} className="text-indigo-600 hover:underline mr-2">Edit</button>
                                    <button onClick={() => onDelete(p.id)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- 9. Packages Tab ---
export const ManagementPackagesTab = ({ onAdd, onEdit, onDelete }: any) => {
    const { servicePackages } = useData();
    return (
        <div>
            <div className="flex justify-end mb-4">
                 <button onClick={onAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2">
                    <PlusCircle size={16}/> Add Service Package
                </button>
            </div>
             <div className="overflow-y-auto max-h-[70vh]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 sticky top-0"><tr><th className="p-2">Package Name</th><th className="p-2 text-right">Total Price</th><th className="p-2">Actions</th></tr></thead>
                    <tbody>
                        {servicePackages.map(p => (
                            <tr key={p.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 font-medium">{p.name}</td>
                                <td className="p-2 text-right">{formatCurrency(p.totalPrice)}</td>
                                <td className="p-2">
                                    <button onClick={() => onEdit(p)} className="text-indigo-600 hover:underline mr-2">Edit</button>
                                    <button onClick={() => onDelete(p.id)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- 10. Nominal Codes Tab ---
export const ManagementNominalCodesTab = ({ 
    onAddCode, onEditCode, onDeleteCode,
    onAddRule, onEditRule, onDeleteRule
}: any) => {
    const { nominalCodes, nominalCodeRules, businessEntities } = useData();
    return (
        <div className="space-y-6">
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-700">Financial Nominal Codes</h3>
                    <button onClick={onAddCode} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2 text-sm">
                        <PlusCircle size={16}/> Add Code
                    </button>
                </div>
                <div className="overflow-y-auto max-h-[30vh] border rounded-lg">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 sticky top-0"><tr><th className="p-2">Code</th><th className="p-2">Name</th><th className="p-2">Secondary Code</th><th className="p-2">Actions</th></tr></thead>
                        <tbody>
                            {nominalCodes.map(nc => (
                                <tr key={nc.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2 font-mono font-bold">{nc.code}</td>
                                    <td className="p-2">{nc.name}</td>
                                    <td className="p-2 font-mono text-xs">{nc.secondaryCode || '-'}</td>
                                    <td className="p-2">
                                        <button onClick={() => onEditCode(nc)} className="text-indigo-600 hover:underline mr-2">Edit</button>
                                        <button onClick={() => onDeleteCode(nc.id)} className="text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-700">Assignment Rules</h3>
                    <button onClick={onAddRule} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow flex items-center gap-2 text-sm">
                        <PlusCircle size={16}/> Add Rule
                    </button>
                </div>
                <div className="overflow-y-auto max-h-[35vh] border rounded-lg">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="p-2 w-16 text-center">Priority</th>
                                <th className="p-2">Type</th>
                                <th className="p-2">Entity</th>
                                <th className="p-2">Keywords (Include)</th>
                                <th className="p-2">Keywords (Exclude)</th>
                                <th className="p-2">Assigned Code</th>
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...nominalCodeRules].sort((a, b) => b.priority - a.priority).map(rule => {
                                const code = nominalCodes.find(c => c.id === rule.nominalCodeId);
                                const entity = businessEntities.find(e => e.id === rule.entityId);
                                return (
                                    <tr key={rule.id} className="border-b hover:bg-gray-50">
                                        <td className="p-2 text-center font-mono">{rule.priority}</td>
                                        <td className="p-2"><span className="px-2 py-0.5 bg-gray-200 rounded text-xs">{rule.itemType}</span></td>
                                        <td className="p-2 text-xs">{entity ? entity.name : (rule.entityId === 'all' ? 'All Entities' : 'Unknown')}</td>
                                        <td className="p-2 text-xs font-mono">{rule.keywords || '*'}</td>
                                        <td className="p-2 text-xs font-mono text-red-600">{rule.excludeKeywords || '-'}</td>
                                        <td className="p-2 text-xs font-semibold">{code ? `${code.code} - ${code.name}` : 'Unknown Code'}</td>
                                        <td className="p-2">
                                            <button onClick={() => onEditRule(rule)} className="text-indigo-600 hover:underline mr-2">Edit</button>
                                            <button onClick={() => onDeleteRule(rule.id)} className="text-red-600 hover:underline">Delete</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
