import React, { useState } from 'react';
import { useData } from '../../../core/state/DataContext';
import { useManagementTable } from '../hooks/useManagementTable';
import { ArrowUpDown, Hash, Trash2, Plus, ChevronDown, ListTree } from 'lucide-react';
import { CheckboxCell } from '../shared/CheckboxCell';

// Local interface to fix missing global types
interface LocalNominalCode {
    id: string;
    code: string;
    name: string;
    category?: string;
    description?: string;
}

export const ManagementNominalCodesTab: React.FC<{ searchTerm?: string; onShowStatus?: any }> = ({ searchTerm = '', onShowStatus }) => {
    const dataContext = useData() as any;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Using a single object for the hook to fix the "Expected 1 argument" error
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
    } = useManagementTable<LocalNominalCode>({
        data: dataContext?.nominalCodes || [],
        collectionName: 'brooks_nominal_codes',
        searchFields: ['code', 'name', 'category'] as any,
        initialSortKey: 'code' as any,
        externalSearchTerm: searchTerm
    });

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-800">Nominal Codes ({totalCount})</h3>
                    {selectedIds.size > 0 && (
                        <button onClick={bulkDelete} className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-bold">
                            Delete ({selectedIds.size})
                        </button>
                    )}
                </div>
                <button 
                    onClick={() => { setSelectedId(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                    <Plus size={18} /> Add Code
                </button>
            </div>

            <div className="flex-grow overflow-auto border border-gray-200 rounded-xl bg-white shadow-sm flex flex-col">
                <div className="flex-grow overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200 border-separate border-spacing-0">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left w-10 border-b">
                                    <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size === displayedData.length && displayedData.length > 0} className="rounded text-indigo-600" />
                                </th>
                                <th className="px-6 py-3 text-left cursor-pointer border-b" onClick={() => handleSort('code' as any)}>
                                    <div className="flex items-center gap-1 uppercase text-xs font-bold text-gray-500">
                                        Code <ArrowUpDown size={14} className={(sortKey as any) === 'code' ? 'text-indigo-600' : 'text-gray-300'}/>
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left uppercase text-xs font-bold text-gray-500 border-b">Description</th>
                                <th className="px-6 py-3 text-left uppercase text-xs font-bold text-gray-500 border-b">Category</th>
                                <th className="px-6 py-3 text-right uppercase text-xs font-bold text-gray-500 border-b">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {displayedData.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 group transition-colors">
                                    <td className="px-6 py-4">
                                        <CheckboxCell id={item.id} selectedIds={selectedIds} onToggle={toggleSelection} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded w-fit border border-indigo-100">
                                            <Hash size={14} /> {item.code}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                        {item.name}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight bg-gray-100 px-2 py-0.5 rounded">
                                            {item.category || 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setSelectedId(item.id); setIsModalOpen(true); }} className="text-indigo-600 text-sm font-bold">Edit</button>
                                            <button onClick={() => deleteItem(item.id)} className="text-red-500 hover:text-red-700 transition-colors">
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};