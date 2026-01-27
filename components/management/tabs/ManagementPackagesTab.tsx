
import React from 'react';
import { useData } from '../../../core/state/DataContext';
import { PlusCircle } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatUtils';

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
