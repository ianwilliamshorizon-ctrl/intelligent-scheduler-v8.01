
import React from 'react';
import { useApp } from '../../../core/state/AppContext';
import { PlusCircle } from 'lucide-react';

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
