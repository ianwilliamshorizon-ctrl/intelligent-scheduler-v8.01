import React, { useState } from 'react';
import { useData } from '../../../core/state/DataContext';
import { useManagementTable } from '../hooks/useManagementTable';
import { ArrowUpDown, Image as ImageIcon, Trash2, Plus, ChevronDown, ExternalLink } from 'lucide-react';
import { CheckboxCell } from '../shared/CheckboxCell';

// We define the local interface to solve the "No exported member" error
interface LocalDiagram {
    id: string;
    name: string;
    category?: string;
    imageUrl?: string;
    referenceNumber?: string;
}

const DIAGRAM_MAP = {
    title: 'name',
    category: 'category',
    url: 'imageUrl',
    ref: 'referenceNumber'
} as const;

export const ManagementDiagramsTab: React.FC<{ searchTerm?: string; onShowStatus?: any }> = ({ searchTerm = '', onShowStatus }) => {
    const dataContext = useData() as any; // Cast to any to bypass strict DataContextType missing props
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
    } = useManagementTable<LocalDiagram>({
        data: dataContext?.diagrams || [],
        collectionName: 'brooks_diagrams',
        searchFields: ['name', 'category', 'referenceNumber'] as any,
        initialSortKey: 'name' as any,
        externalSearchTerm: searchTerm
    });

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-800">Diagram Library ({totalCount})</h3>
                    {selectedIds.size > 0 && (
                        <button onClick={bulkDelete} className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md text-xs font-bold">
                            Delete Selected ({selectedIds.size})
                        </button>
                    )}
                </div>
                <button onClick={() => { setSelectedId(null); setIsModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium">
                    <Plus size={18} className="inline mr-1" /> Upload
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
                                    Name <ArrowUpDown size={14} className={(sortKey as any) === 'name' ? 'text-indigo-600' : 'text-gray-300'}/>
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left uppercase text-xs font-bold text-gray-500">Category</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {displayedData.map((item: any) => (
                            <tr key={item.id} className="hover:bg-gray-50 group">
                                <td className="px-6 py-4">
                                    <CheckboxCell id={item.id} selectedIds={selectedIds} onToggle={toggleSelection} />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3 text-sm font-semibold text-gray-900">{item.name}</div>
                                </td>
                                <td className="px-6 py-4 text-xs text-blue-600 font-bold uppercase">{item.category || 'General'}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => deleteItem(item.id)} className="text-red-600"><Trash2 size={16}/></button>
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