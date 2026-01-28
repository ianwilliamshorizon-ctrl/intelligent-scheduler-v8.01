import React, { useState } from 'react';
import { useData } from '../../../core/state/DataContext';
import { useManagementTable } from '../hooks/useManagementTable';
import { ArrowUpDown, Box, Trash2, Plus } from 'lucide-react';
import { CheckboxCell } from '../shared/CheckboxCell';

interface LocalPart {
    id: string;
    partNumber: string;
    description: string;
    stockLevel: number;
    price: number;
}

// THIS NAME MUST MATCH THE IMPORT IN ManagementViews.tsx
export const ManagementPartsTab: React.FC<{ searchTerm?: string; onShowStatus?: any }> = ({ searchTerm = '', onShowStatus }) => {
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
    } = useManagementTable<LocalPart>({
        data: dataContext?.parts || [],
        collectionName: 'brooks_parts',
        searchFields: ['partNumber', 'description'] as any,
        initialSortKey: 'partNumber' as any,
        externalSearchTerm: searchTerm
    });

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-lg font-semibold text-gray-800">Parts Inventory ({totalCount})</h3>
                <button 
                    onClick={() => { setSelectedId(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                    <Plus size={18} /> Add Part
                </button>
            </div>

            <div className="flex-grow overflow-auto border border-gray-200 rounded-xl bg-white shadow-sm flex flex-col">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-left w-10 border-b">
                                <input 
                                    type="checkbox" 
                                    onChange={toggleSelectAll} 
                                    checked={selectedIds.size === displayedData.length && displayedData.length > 0} 
                                    className="rounded text-indigo-600" 
                                />
                            </th>
                            <th className="px-6 py-3 text-left cursor-pointer border-b" onClick={() => handleSort('partNumber' as any)}>
                                <div className="flex items-center gap-1 uppercase text-xs font-bold text-gray-500">
                                    Part # <ArrowUpDown size={14} />
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left uppercase text-xs font-bold text-gray-500 border-b">Description</th>
                            <th className="px-6 py-3 text-right uppercase text-xs font-bold text-gray-500 border-b">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {displayedData.map((part) => (
                            <tr key={part.id} className="hover:bg-gray-50 group">
                                <td className="px-6 py-4">
                                    <CheckboxCell id={part.id} selectedIds={selectedIds} onToggle={toggleSelection} />
                                </td>
                                <td className="px-6 py-4 text-sm font-mono font-bold text-gray-900">{part.partNumber}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{part.description}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => deleteItem(part.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={16}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
