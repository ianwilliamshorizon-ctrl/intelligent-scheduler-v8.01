
import React from 'react';
import { useData } from '../../../core/state/DataContext';
import { PlusCircle } from 'lucide-react';

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
