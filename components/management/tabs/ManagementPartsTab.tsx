
import React from 'react';
import { useData } from '../../../core/state/DataContext';
import { PlusCircle, Upload } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatUtils';

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
