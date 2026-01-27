
import React from 'react';
import { useData } from '../../../core/state/DataContext';
import { PlusCircle, Trash2, Upload, Zap, RefreshCw } from 'lucide-react';
import { CheckboxCell } from '../shared/CheckboxCell';

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
