import React, { useState } from 'react';
import { useData } from '../../../core/state/DataContext';
import { useManagementTable } from '../hooks/useManagementTable';
import { ArrowUpDown, UserPlus, Building2, Mail, Phone, Trash2, ChevronDown } from 'lucide-react';
import { Customer } from '../../../types';

interface Props {
    searchTerm?: string;
    onShowStatus?: (text: string, type: 'info' | 'success' | 'error') => void;
}

export const ManagementCustomersTab: React.FC<Props> = ({ searchTerm = '', onShowStatus }) => {
    const dataContext = useData();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
    } = useManagementTable<Customer>({
        data: dataContext?.customers || [],
        collectionName: 'brooks_customers',
        searchFields: ['name', 'email', 'companyName'] as any,
        initialSortKey: 'name' as any,
        externalSearchTerm: searchTerm
    });

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this customer?')) return;
        try {
            await deleteItem(id);
            onShowStatus?.('Customer deleted', 'success');
        } catch (e) {
            onShowStatus?.('Error deleting customer', 'error');
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-700">Customers ({totalCount})</h3>
                    {selectedIds.size > 0 && (
                        <button onClick={bulkDelete} className="text-sm px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100">
                            Delete Selected ({selectedIds.size})
                        </button>
                    )}
                </div>
                <button 
                    onClick={() => { setSelectedId(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                    <UserPlus size={18} /> Add Customer
                </button>
            </div>

            <div className="flex-grow overflow-auto border border-gray-200 rounded-lg bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-left w-10">
                                <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-indigo-600"
                                    checked={displayedData.length > 0 && selectedIds.size === displayedData.length}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th className="px-6 py-3 text-left cursor-pointer" onClick={() => handleSort('name' as any)}>
                                <div className="flex items-center gap-1 uppercase text-xs font-bold text-gray-500">
                                    Name <ArrowUpDown size={14} className={(sortKey as any) === 'name' ? 'text-indigo-600' : 'text-gray-300'}/>
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left uppercase text-xs font-bold text-gray-500">Company</th>
                            <th className="px-6 py-3 text-left uppercase text-xs font-bold text-gray-500">Contact</th>
                            <th className="px-6 py-3 text-right uppercase text-xs font-bold text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {displayedData.map((customer) => (
                            <tr key={customer.id} className="hover:bg-gray-50 group">
                                <td className="px-6 py-4">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-gray-300 text-indigo-600"
                                        checked={selectedIds.has(customer.id)}
                                        onChange={() => toggleSelection(customer.id)}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{(customer as any).name}</div>
                                    <div className="text-xs text-gray-400">ID: {customer.id.substring(0, 8)}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-2"><Building2 size={14} className="text-gray-400"/> {(customer as any).companyName || 'N/A'}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <div className="flex flex-col">
                                        <span className="flex items-center gap-1"><Mail size={12}/> {(customer as any).email}</span>
                                        <span className="flex items-center gap-1"><Phone size={12}/> {(customer as any).phone}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setSelectedId(customer.id); setIsModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                        <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-900"><Trash2 size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {hasMore && (
                    <div className="p-4 flex justify-center border-t border-gray-100">
                        <button onClick={handleLoadMore} className="text-sm text-indigo-600 font-medium flex items-center gap-1">
                            <ChevronDown size={16} /> Load More
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};