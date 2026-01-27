import React, { useState } from 'react';
import { 
    Building2, ArrowLeft, Edit3, Landmark, Hash, 
    MapPin, Receipt, History, Wallet, ChevronRight,
    TrendingUp, Percent, Coins
} from 'lucide-react';

// FIXED: Path points to the local folder as requested
import { UniversalDataTable } from './UniversalDataTable';

export const FinanceModule = ({ data, triggerModal }: any) => {
    const [selectedEntity, setSelectedEntity] = useState<any>(null);
    
    // Ensure we have an array to prevent crashes
    const entities = data?.entities || [];

    // Define columns for the UniversalDataTable
    const entityColumns = [
        { 
            header: 'Business Name', 
            key: 'name',
            render: (val: string) => <span className="font-black text-slate-900 tracking-tight">{val}</span>
        },
        { header: 'VAT Number', key: 'vatNumber' },
        { 
            header: 'Master Labor Rate', 
            key: 'hourlyRate',
            render: (val: number) => (
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span className="font-bold text-indigo-600">£{val || '0.00'}/hr</span>
                </div>
            )
        },
        { 
            header: 'Tax Status', 
            key: 'status',
            render: () => <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase">Active</span>
        }
    ];

    // --- VIEW 1: SELECT ENTITY (List View) ---
    if (!selectedEntity) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="px-4 flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Financial Entities</p>
                        <h2 className="text-xl font-black text-slate-900">Legal & Billing Units</h2>
                    </div>
                    <button 
                        onClick={() => triggerModal('ENTITY_FORM', null)}
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all"
                    >
                        + Register New Entity
                    </button>
                </div>

                <UniversalDataTable 
                    type="Entities"
                    data={entities}
                    columns={entityColumns}
                    onEdit={(entity: any) => setSelectedEntity(entity)}
                    searchPlaceholder="Search legal names or tax IDs..."
                />
            </div>
        );
    }

    // --- VIEW 2: ENTITY FOLDER (Detail View) ---
    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 duration-400">
            {/* Header / Breadcrumb */}
            <div className="flex items-center justify-between bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => setSelectedEntity(null)} 
                        className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all border border-slate-100"
                    >
                        <ArrowLeft size={20}/>
                    </button>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{selectedEntity.name}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Financial Profile</p>
                    </div>
                </div>

                <button 
                    onClick={() => triggerModal('ENTITY_FORM', selectedEntity)}
                    className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg"
                >
                    <Edit3 size={16}/> Edit Core Details
                </button>
            </div>

            <div className="grid grid-cols-3 gap-8">
                {/* Left Column: Rates & Tax Intelligence */}
                <div className="col-span-1 space-y-6">
                    <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-xl relative overflow-hidden group">
                        <TrendingUp size={120} className="absolute -right-4 -bottom-4 text-white/5 group-hover:scale-110 transition-transform duration-700" />
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Global Hourly Labor Rate</p>
                            <h4 className="text-5xl font-black tracking-tighter">£{selectedEntity.hourlyRate || '0.00'}</h4>
                            <p className="text-sm font-bold text-slate-500 mt-2">Source of truth for all job cards</p>
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-6">
                        <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Tax & Nominals</h4>
                        <div className="space-y-6">
                            <DetailRow label="Tax Registration" value={selectedEntity.vatNumber || 'Not Registered'} icon={<Hash size={14}/>} />
                            <DetailRow label="Default Tax Code" value={selectedEntity.defaultTaxCode || 'T1 (20%)'} icon={<Percent size={14}/>} />
                            <DetailRow label="Operating Currency" value={selectedEntity.currency || 'GBP (£)'} icon={<Coins size={14}/>} />
                        </div>
                    </div>
                </div>

                {/* Right Column: Assets & Logistics */}
                <div className="col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
                            <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                <Landmark size={16} className="text-indigo-600" /> Banking Info
                            </h4>
                            <div className="space-y-4 font-bold text-sm text-slate-700">
                                <p className="flex justify-between border-b border-slate-50 pb-2">Account: <span className="text-slate-400 tracking-widest">•••• 4421</span></p>
                                <p className="flex justify-between">Sort Code: <span className="text-slate-400 tracking-widest">20-00-00</span></p>
                            </div>
                        </div>
                        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
                            <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                <MapPin size={16} className="text-indigo-600" /> Registered Address
                            </h4>
                            <p className="text-sm font-bold text-slate-600 leading-relaxed italic uppercase">
                                {selectedEntity.address || 'Registered address not yet configured.'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-16 border-2 border-dashed border-slate-100 rounded-[4rem] text-center group hover:border-indigo-200 transition-all">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-200 group-hover:text-indigo-400 transition-colors">
                            <History size={32} />
                        </div>
                        <h5 className="font-black text-xs uppercase tracking-widest text-slate-900">Transaction History</h5>
                        <p className="text-sm font-bold text-slate-400 mt-2">Nominal ledger logs will appear here upon first audit.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Internal Helper
const DetailRow = ({ label, value, icon }: any) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
            {icon} {label}
        </label>
        <div className="p-5 bg-slate-50 rounded-2xl font-bold text-slate-800 text-sm border border-slate-100/50">
            {value}
        </div>
    </div>
);