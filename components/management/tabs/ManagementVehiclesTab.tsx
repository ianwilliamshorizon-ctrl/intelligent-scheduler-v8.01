import React, { useState } from 'react';
import { useData } from '../../../core/state/DataContext';
import { useManagementTable } from '../hooks/useManagementTable';
import { ArrowUpDown, Car, Trash2, Plus, Settings2 } from 'lucide-react';
import { CheckboxCell } from '../shared/CheckboxCell';

// Local interface for Vehicle
interface LocalVehicle {
    id: string;
    registration: string;
    make: string;
    model: string;
    year?: number;
    vin?: string;
    active?: boolean;
}

interface Props {
    searchTerm?: string;
    onShowStatus?: (text: string, type: 'info' | 'success' | 'error') => void;
}

export const ManagementVehiclesTab: React.FC<Props> = ({ searchTerm = '', onShowStatus }) => {
    const dataContext = useData() as any;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

    // Consolidated into single object argument to fix TS2554
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
    } = useManagementTable<LocalVehicle>({
        data: dataContext?.vehicles || [],
        collectionName: 'brooks_vehicles',
        searchFields: ['registration', 'make', 'model'] as any,
        initialSortKey: 'registration' as any,
        externalSearchTerm: searchTerm
    });

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-lg font-semibold text-gray-800">Fleet Management ({totalCount})</h3>
                <div className="flex gap-2">
                    {selectedIds.size > 0 && (
                        <button onClick={bulkDelete} className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-bold shadow-sm hover:bg-red-700">
                            Delete ({selectedIds.size})
                        </button>
                    )}
                    <button 
                        onClick={() => { setSelectedVehicleId(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                    >
                        <Plus size={18} /> Add Vehicle
                    </button>
                </div>
            </div>

            <div className="flex-grow overflow-auto border border-gray-200 rounded-xl bg-white shadow-sm flex flex-col">
                <div className="flex-grow overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200 border-separate border-spacing-0">
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
                                <th className="px-6 py-3 text-left cursor-pointer border-b" onClick={() => handleSort('registration' as any)}>
                                    <div className="flex items-center gap-1 uppercase text-xs font-bold text-gray-500">
                                        Registration <ArrowUpDown size={14} className={(sortKey as any) === 'registration' ? 'text-indigo-600' : 'text-gray-300'}/>
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left uppercase text-xs font-bold text-gray-500 border-b">Vehicle Details</th>
                                <th className="px-6 py-3 text-right uppercase text-xs font-bold text-gray-500 border-b">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {displayedData.map((v) => (
                                <tr key={v.id} className="hover:bg-gray-50 group transition-colors">
                                    <td className="px-6 py-4">
                                        <CheckboxCell id={v.id} selectedIds={selectedIds} onToggle={toggleSelection} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="px-3 py-1 bg-yellow-100 border border-yellow-300 font-mono font-bold rounded text-gray-900 inline-block">
                                            {v.registration}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <Car size={16} className="text-gray-400" />
                                            <span className="font-medium">{v.make} {v.model}</span>
                                            {v.year && <span className="text-gray-400">({v.year})</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setSelectedVehicleId(v.id); setIsModalOpen(true); }} className="text-indigo-600 text-sm font-bold">Edit</button>
                                            <button onClick={() => deleteItem(v.id)} className="text-red-500 hover:text-red-700">
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