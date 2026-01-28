import React, { useState } from 'react';
import { useData } from '../../../core/state/DataContext';
import { useManagementTable } from '../hooks/useManagementTable';
import { ArrowUpDown, UserPlus, Mail, Phone, Trash2, ChevronDown, Shield } from 'lucide-react';
import { CheckboxCell } from '../shared/CheckboxCell';

// Local interface to fix "No exported member 'Staff'"
interface LocalStaff {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    email: string;
    phone: string;
    branch?: string;
    accessLevel?: string;
    active?: boolean;
}

const STAFF_MAP = {
    primary: 'firstName',
    secondary: 'lastName',
    label: 'role',
    contact1: 'email',
    contact2: 'phone'
} as const;

export const ManagementStaffTab: React.FC<{ searchTerm?: string; onShowStatus?: any }> = ({ searchTerm = '', onShowStatus }) => {
    // Cast to any to fix "Property 'staff' does not exist on DataContextType"
    const dataContext = useData() as any;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const {
        sortKey,
        handleSort,
        displayedData,
        totalCount,
        hasMore,
        handleLoadMore,
        selectedIds,
        toggleSelection,
        toggleSelectAll,
        deleteItem,
        bulkDelete
    } = useManagementTable<LocalStaff>({
        data: dataContext?.staff || [],
        collectionName: 'brooks_staff',
        searchFields: ['firstName', 'lastName', 'role', 'email'] as any,
        initialSortKey: 'lastName' as any,
        externalSearchTerm: searchTerm
    });

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-lg font-semibold text-gray-800">Staff Management ({totalCount})</h3>
                <div className="flex gap-2">
                    {selectedIds.size > 0 && (
                        <button onClick={bulkDelete} className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-bold">
                            Delete ({selectedIds.size})
                        </button>
                    )}
                    <button onClick={() => { setSelectedId(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium">
                        <UserPlus size={18} /> Add Member
                    </button>
                </div>
            </div>

            <div className="flex-grow overflow-auto border border-gray-200 rounded-xl bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-left w-10">
                                <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size === displayedData.length && displayedData.length > 0} className="rounded text-indigo-600" />
                            </th>
                            <th className="px-6 py-3 text-left cursor-pointer" onClick={() => handleSort('lastName' as any)}>
                                <div className="flex items-center gap-1 uppercase text-xs font-bold text-gray-500">
                                    Name <ArrowUpDown size={14} className={(sortKey as any) === 'lastName' ? 'text-indigo-600' : 'text-gray-300'}/>
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left uppercase text-xs font-bold text-gray-500">Role</th>
                            <th className="px-6 py-3 text-right uppercase text-xs font-bold text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {displayedData.map((person) => (
                            <tr key={person.id} className="hover:bg-gray-50 group">
                                <td className="px-6 py-4">
                                    <CheckboxCell id={person.id} selectedIds={selectedIds} onToggle={toggleSelection} />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-gray-900">{person.firstName} {person.lastName}</div>
                                    <div className="text-xs text-gray-400">{person.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                        <Shield size={14} className="text-amber-500" />
                                        {person.role}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setSelectedId(person.id); setIsModalOpen(true); }} className="text-indigo-600 text-sm font-bold">Edit</button>
                                        <button onClick={() => deleteItem(person.id)} className="text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};