import React, { useState } from 'react';
import { useData } from '../../../core/state/DataContext';
import { useManagementTable } from '../hooks/useManagementTable';
import { ArrowUpDown, ShieldCheck, Trash2, Plus, Lock, Users } from 'lucide-react';
import { CheckboxCell } from '../shared/CheckboxCell';

// Local interface to fix "No exported member 'Role'"
interface LocalRole {
    id: string;
    name: string;
    accessLevel: number;
    description?: string;
    permissions?: string[];
}

export const ManagementRolesTab: React.FC<{ searchTerm?: string; onShowStatus?: any }> = ({ searchTerm = '', onShowStatus }) => {
    const dataContext = useData() as any;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Using single object argument to fix TS2554
    const {
        sortKey,
        handleSort,
        displayedData,
        totalCount,
        selectedIds,
        toggleSelection,
        toggleSelectAll,
        deleteItem
    } = useManagementTable<LocalRole>({
        data: dataContext?.roles || [],
        collectionName: 'brooks_roles',
        searchFields: ['name', 'description'] as any,
        initialSortKey: 'name' as any,
        externalSearchTerm: searchTerm
    });

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-indigo-600" />
                    System Roles ({totalCount})
                </h3>
                <button 
                    onClick={() => { setSelectedId(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Plus size={18} /> Create Role
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto pb-6">
                {displayedData.map((role) => (
                    <div key={role.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-indigo-300 transition-all group relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
                                <Lock size={20} />
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setSelectedId(role.id); setIsModalOpen(true); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded text-sm font-bold">Edit</button>
                                <button onClick={() => deleteItem(role.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                            </div>
                        </div>
                        
                        <h4 className="text-base font-bold text-gray-900 mb-1">{role.name}</h4>
                        <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                            {role.description || 'Access control definitions for system users.'}
                        </p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
                                <Users size={14} />
                                Level {role.accessLevel || 0}
                            </div>
                            <div className="text-[10px] font-mono text-gray-400 uppercase">{role.id.substring(0, 8)}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};