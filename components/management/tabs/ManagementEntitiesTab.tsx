import React, { useState } from 'react';
import { useData } from '../../../core/state/DataContext';
import { useManagementTable } from '../hooks/useManagementTable';
import { ArrowUpDown, Landmark, Trash2, Plus, ChevronDown } from 'lucide-react';
import { CheckboxCell } from '../shared/CheckboxCell';

// Local interface to fix "No exported member 'Entity'"
interface LocalEntity {
    id: string;
    name: string;
    registrationNo?: string;
    vatNumber?: string;
    address?: string;
}

export const ManagementEntitiesTab: React.FC<{ searchTerm?: string; onShowStatus?: any }> = ({ searchTerm = '', onShowStatus }) => {
    // Cast to any to fix "Property 'entities' does not exist on DataContextType"
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
    } = useManagementTable<LocalEntity>({
        data: dataContext?.entities || [],
        collectionName: 'brooks_entities',
        searchFields: ['name', 'registrationNo'] as any,
        initialSortKey: 'name' as any,
        externalSearchTerm: searchTerm
    });

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-lg font-semibold text-gray-800">Legal Entities ({totalCount})</h3>
                <button onClick={() => { setSelectedId(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium">
                    <Plus size={18} /> Add Entity
                </button>
            </div>

            <div className="flex-grow overflow-auto border border-gray-200 rounded-xl bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-left w-10">
                                <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size === displayedData.length && displayedData.length > 0} className="rounded" />
                            </th>
                            <th className="px-6 py-3 text-left cursor-pointer" onClick={() => handleSort('name' as any)}>
                                <div className="flex items-center gap-1 uppercase text-xs font-bold text-gray-500">
                                    Entity Name <ArrowUpDown size={14} className={(sortKey as any) === 'name' ? 'text-indigo-600' : 'text-gray-300'}/>
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left uppercase text-xs font-bold text-gray-500">Registration</th>
                            <th className="px-6 py-3 text-right uppercase text-xs font-bold text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {displayedData.map((entity) => (
                            <tr key={entity.id} className="hover:bg-gray-50 group">
                                <td className="px-6 py-4">
                                    <CheckboxCell id={entity.id} selectedIds={selectedIds} onToggle={toggleSelection} />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <Landmark size={18} className="text-indigo-500" />
                                        <span className="text-sm font-bold text-gray-900">{entity.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-xs font-mono text-gray-500">{entity.registrationNo || 'N/A'}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => deleteItem(entity.id)} className="text-red-500"><Trash2 size={16}/></button>
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