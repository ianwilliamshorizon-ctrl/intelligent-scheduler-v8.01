import React, { useState } from 'react';
import { useData } from '../../../core/state/DataContext';
import { useManagementTable } from '../hooks/useManagementTable';
import { ArrowUpDown, Building2, Trash2, Plus, Phone, Mail } from 'lucide-react';
import { CheckboxCell } from '../shared/CheckboxCell';

interface LocalSupplier {
    id: string;
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
}

export const ManagementSuppliersTab: React.FC<{ searchTerm?: string; onShowStatus?: any }> = ({ searchTerm = '', onShowStatus }) => {
    const dataContext = useData() as any;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const {
        sortKey,
        handleSort,
        displayedData,
        totalCount,
        selectedIds,
        toggleSelection,
        toggleSelectAll,
        deleteItem,
        bulkDelete
    } = useManagementTable<LocalSupplier>({
        data: dataContext?.suppliers || [],
        collectionName: 'brooks_suppliers',
        searchFields: ['name', 'contactName', 'email'] as any,
        initialSortKey: 'name' as any,
        externalSearchTerm: searchTerm
    });

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-lg font-semibold text-gray-800">Suppliers ({totalCount})</h3>
                <button 
                    onClick={() => { setSelectedId(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium"
                >
                    <Plus size={18} /> New Supplier
                </button>
            </div>

            <div className="flex-grow overflow-auto border border-gray-200 rounded-xl bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-left w-10 border-b">
                                <input type="checkbox" onChange={toggleSelectAll} className="rounded" />
                            </th>
                            <th className="px-6 py-3 text-left cursor-pointer border-b" onClick={() => handleSort('name' as any)}>
                                <div className="flex items-center gap-1 uppercase text-xs font-bold text-gray-500">
                                    Supplier Name <ArrowUpDown size={14} />
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left uppercase text-xs font-bold text-gray-500 border-b">Contact Info</th>
                            <th className="px-6 py-3 text-right uppercase text-xs font-bold text-gray-500 border-b">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {displayedData.map((supplier) => (
                            <tr key={supplier.id} className="hover:bg-gray-50 group transition-colors">
                                <td className="px-6 py-4">
                                    <CheckboxCell id={supplier.id} selectedIds={selectedIds} onToggle={toggleSelection} />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <Building2 size={18} className="text-gray-400" />
                                        <span className="text-sm font-bold text-gray-900">{supplier.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-2"><Mail size={12}/> {supplier.email || 'No email'}</div>
                                    <div className="flex items-center gap-2 mt-1"><Phone size={12}/> {supplier.phone || 'No phone'}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => deleteItem(supplier.id)} className="text-red-500"><Trash2 size={16}/></button>
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