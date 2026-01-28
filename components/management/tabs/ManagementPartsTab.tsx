import React from 'react';
import { Part } from '../../../types';
import { PlusCircle, Package, Trash2 } from 'lucide-react';
import { CheckboxCell } from '../shared/CheckboxCell';

interface ManagementPartsTabProps {
    parts: Part[];
    searchTerm: string;
    onAdd: () => void;
    onEdit: (part: Part) => void;
    onDelete: (id: string) => void;
    selectedIds?: Set<string>;
    onToggleSelection?: (id: string) => void;
    onSelectAll?: (items: Part[]) => void;
}

export const ManagementPartsTab: React.FC<ManagementPartsTabProps> = ({ 
    parts, 
    searchTerm, 
    onAdd, 
    onEdit, 
    onDelete,
    selectedIds = new Set(),
    onToggleSelection = () => {},
    onSelectAll = () => {}
}) => {
    // Fix: Using part.description as standard fallback for part.name
    const filtered = parts.filter(p => 
        ((p as any).name || (p as any).description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.partNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                        <button className="bg-rose-100 text-rose-700 px-4 py-2 rounded-xl hover:bg-rose-200 flex items-center gap-2 text-sm font-bold transition-colors">
                            <Trash2 size={16}/> Delete ({selectedIds.size})
                        </button>
                    )}
                </div>
                <button 
                    onClick={onAdd} 
                    className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center gap-2 font-black transition-all"
                >
                    <PlusCircle size={18}/> New Inventory Item
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                        <tr>
                            <th className="p-4 w-12 text-center">
                                <input 
                                    type="checkbox" 
                                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                                    onChange={() => onSelectAll(filtered)}
                                    className="rounded border-slate-300 text-indigo-600" 
                                />
                            </th>
                            <th className="p-4 font-black text-slate-500 uppercase tracking-wider text-[11px]">Part Details</th>
                            <th className="p-4 font-black text-slate-500 uppercase tracking-wider text-[11px]">Stock Level</th>
                            <th className="p-4 font-black text-slate-500 uppercase tracking-wider text-[11px]">Price</th>
                            <th className="p-4 font-black text-slate-500 uppercase tracking-wider text-[11px] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map(part => (
                            <tr key={part.id} className="hover:bg-slate-50/80 transition-colors">
                                <CheckboxCell id={part.id} selectedIds={selectedIds} onToggle={onToggleSelection} />
                                <td className="p-4">
                                    <div className="flex flex-col">
                                        <span className="font-black text-slate-900">{(part as any).name || (part as any).description}</span>
                                        <span className="text-[10px] font-mono text-slate-400 uppercase">{part.partNumber || 'No Part Number'}</span>
                                    </div>
                                </td>
                                <td className="p-4 font-bold text-slate-700">{part.stockQuantity || 0} in stock</td>
                                <td className="p-4 font-mono font-bold text-slate-600">£{((part as any).unitPrice || (part as any).price || 0).toFixed(2)}</td>
                                <td className="p-4 text-right">
                                    <button onClick={() => onEdit(part)} className="text-indigo-600 font-bold hover:underline mr-4">Edit</button>
                                    <button onClick={() => onDelete(part.id)} className="text-rose-600 font-bold hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};