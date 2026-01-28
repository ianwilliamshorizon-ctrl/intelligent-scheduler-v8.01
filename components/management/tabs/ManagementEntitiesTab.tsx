import React from 'react';
import { BusinessEntity } from '../../../types';
import { PlusCircle, Building2, MapPin, Phone } from 'lucide-react';

interface ManagementEntitiesTabProps {
    entities: BusinessEntity[];
    onAdd: () => void;
    onEdit: (entity: BusinessEntity) => void;
    onDelete: (id: string) => void;
}

export const ManagementEntitiesTab: React.FC<ManagementEntitiesTabProps> = ({ 
    entities, 
    onAdd, 
    onEdit, 
    onDelete 
}) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-900">Business Entities</h3>
                <button onClick={onAdd} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black">
                    Register New Entity
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {entities.map(entity => (
                    <div key={entity.id} className="bg-white border-2 border-slate-100 rounded-[32px] p-8">
                        <div className="flex justify-between items-start mb-6">
                            <Building2 size={32} className="text-indigo-600" />
                            <div className="flex gap-2">
                                <button onClick={() => onEdit(entity)} className="text-indigo-600 font-bold">Edit</button>
                                <button onClick={() => onDelete(entity.id)} className="text-rose-600 font-bold">Delete</button>
                            </div>
                        </div>
                        <h4 className="text-2xl font-black text-slate-900 mb-4">{entity.name}</h4>
                        <div className="space-y-3 mb-8">
                            <div className="flex items-start gap-3 text-slate-500 text-sm">
                                <MapPin size={18} />
                                <span>{entity.addressLine1}, {entity.postcode}</span>
                            </div>
                            {/* Check for phone property safety */}
                            {(entity as any).phone && (
                                <div className="flex items-center gap-3 text-slate-500 text-sm">
                                    <Phone size={18} />
                                    <span>{(entity as any).phone}</span>
                                </div>
                            )}
                        </div>
                        <div className="pt-6 border-t border-slate-50">
                            <p className="text-[10px] font-black uppercase text-slate-400">Company Number</p>
                            <p className="text-sm font-mono font-bold text-slate-700">{entity.companyNumber || 'N/A'}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};