import React, { useState } from 'react';
import { useData } from '../../../core/state/DataContext';
import { useManagementTable } from '../hooks/useManagementTable';
import { ArrowUpDown, Box, Trash2, Plus, ChevronDown, Layers } from 'lucide-react';
import { CheckboxCell } from '../shared/CheckboxCell';

// Local interface to fix missing global types
interface LocalPackage {
    id: string;
    name: string;
    description?: string;
    price: number;
    items?: string[];
}

export const ManagementPackagesTab: React.FC<{ searchTerm?: string; onShowStatus?: any }> = ({ searchTerm = '', onShowStatus }) => {
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
    } = useManagementTable<LocalPackage>({
        data: dataContext?.packages || [],
        collectionName: 'brooks_packages',
        searchFields: ['name', 'description'] as any,
        initialSortKey: 'name' as any,
        externalSearchTerm: searchTerm
    });

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-800">Service Packages ({totalCount})</h3>
                    {selectedIds.size > 0 && (
                        <button onClick={bulkDelete} className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-bold shadow-sm">
                            Bulk Delete ({selectedIds.size})
                        </button>
                    )}
                </div>
                <button 
                    onClick={() => { setSelectedId(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-shadow"
                >
                    <Plus size={18} /> New Package
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
                                <th className="px-6 py-3 text-left cursor-pointer border-b" onClick={() => handleSort('name' as any)}>
                                    <div className="flex items-center gap-1 uppercase text-xs font-bold text-gray-500">
                                        Package Name <ArrowUpDown size={14} className={(sortKey as any) === 'name' ? 'text-indigo-600' : 'text-gray-300'}/>
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left uppercase text-xs font-bold text-gray-500 border-b">Includes</th>
                                <th className="px-6 py-3 text-right uppercase text-xs font-bold text-gray-500 border-b">Base Price</th>
                                <th className="px-6 py-3 text-right uppercase text-xs font-bold text-gray-500 border-b">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {displayedData.map((pkg) => (
                                <tr key={pkg.id} className="hover:bg-gray-50 group transition-colors">
                                    <td className="px-6 py-4">
                                        <CheckboxCell id={pkg.id} selectedIds={selectedIds} onToggle={toggleSelection} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                                                <Layers size={18} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">{pkg.name}</div>
                                                <div className="text-[10px] text-gray-400 font-mono">PKG-{pkg.id.substring(0, 6)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs text-gray-500 line-clamp-1 max-w-[250px]">
                                            {pkg.description || 'No contents specified.'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                        £{(pkg.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setSelectedId(pkg.id); setIsModalOpen(true); }} className="text-indigo-600 text-sm font-bold">Edit</button>
                                            <button onClick={() => deleteItem(pkg.id)} className="text-red-500 hover:text-red-700 transition-colors">
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