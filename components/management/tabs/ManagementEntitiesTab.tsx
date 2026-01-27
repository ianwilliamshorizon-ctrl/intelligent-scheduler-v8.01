
import React from 'react';
import { useData } from '../../../core/state/DataContext';
import { PlusCircle, Upload } from 'lucide-react';

export const ManagementEntitiesTab = ({ onAdd, onEdit, onImportJobs, onImportInvoices, setImportTargetEntityId }: any) => {
    const { businessEntities } = useData();
    return (
        <div>
            <div className="flex justify-end mb-4">
                 <button onClick={onAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2">
                    <PlusCircle size={16}/> Add Business Entity
                </button>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[70vh]">
                {businessEntities.map(e => (
                    <div key={e.id} className={`p-4 border-2 rounded-lg transition-all border-${e.color}-200 bg-white relative group`}>
                        <div className={`w-full h-2 bg-${e.color}-500 rounded-t mb-2`}></div>
                        <div className="flex justify-between items-start cursor-pointer" onClick={() => onEdit(e)}>
                            <div>
                                <h3 className="font-bold text-lg">{e.name}</h3>
                                <p className="text-sm text-gray-500">{e.type}</p>
                                <p className="text-xs text-gray-400 mt-2">{e.city}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t flex gap-2 justify-end">
                            <label className="text-xs flex items-center gap-1 cursor-pointer bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200" title="Import Jobs CSV">
                                <Upload size={12} /> Import Jobs
                                <input type="file" accept=".csv" className="hidden" onClick={() => setImportTargetEntityId(e.id)} onChange={onImportJobs} />
                            </label>
                            <label className="text-xs flex items-center gap-1 cursor-pointer bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200" title="Import Invoices CSV">
                                <Upload size={12} /> Import Invoices
                                <input type="file" accept=".csv" className="hidden" onClick={() => setImportTargetEntityId(e.id)} onChange={onImportInvoices} />
                            </label>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
