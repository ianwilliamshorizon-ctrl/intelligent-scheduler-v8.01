
import React from 'react';
import { useData } from '../../../core/state/DataContext';
import { PlusCircle, Trash2, Edit, FolderInput, CarFront } from 'lucide-react';
import AsyncImage from '../../AsyncImage';

export const ManagementDiagramsTab = ({ 
    searchTerm, 
    onAdd, 
    onEdit, 
    onDelete, 
    onBulkUpload
}: any) => {
    const { inspectionDiagrams } = useData();
    const filtered = inspectionDiagrams.filter(d => 
        d.make.toLowerCase().includes(searchTerm.toLowerCase()) || 
        d.model.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
             <div className="flex justify-end items-center mb-4 gap-2">
                <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer shadow">
                    <FolderInput size={16}/> Bulk Upload
                    <input type="file" multiple accept="image/*" className="hidden" onChange={onBulkUpload} />
                </label>
                <button onClick={onAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2">
                    <PlusCircle size={16}/> Add Diagram
                </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto max-h-[70vh]">
                {filtered.map(d => (
                    <div key={d.id} className="border rounded-lg bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group">
                        <div className="h-32 bg-gray-100 flex items-center justify-center p-2">
                            <AsyncImage imageId={d.imageId} alt={`${d.make} ${d.model}`} className="max-w-full max-h-full object-contain"/>
                        </div>
                        <div className="p-3">
                            <h4 className="font-bold text-sm text-gray-800">{d.make}</h4>
                            <p className="text-xs text-gray-600">{d.model}</p>
                        </div>
                         <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onEdit(d)} className="p-1 bg-white rounded-full text-indigo-600 hover:text-indigo-800 shadow"><Edit size={14}/></button>
                            <button onClick={() => onDelete(d.id)} className="p-1 bg-white rounded-full text-red-600 hover:text-red-800 shadow"><Trash2 size={14}/></button>
                        </div>
                    </div>
                ))}
                 {filtered.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500">
                        <CarFront size={48} className="mx-auto mb-2 text-gray-300" />
                        <p>No diagrams found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
