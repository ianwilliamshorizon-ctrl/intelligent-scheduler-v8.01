import React, { useState } from 'react';
import { 
    Wrench, Box, Clock, ArrowLeft, Edit3, Search, 
    ChevronRight, LayoutTemplate, Zap, ShieldCheck, 
    Layers, Settings2, Plus, Info
} from 'lucide-react';

export const ServiceLibraryModule = ({ data, triggerModal }: any) => {
    const [selectedPackage, setSelectedPackage] = useState<any>(null);
    const [view, setView] = useState<'packages' | 'parts'>('packages');

    const list = view === 'packages' ? (data.servicePackages || []) : (data.partsInventory || []);

    if (!selectedPackage) {
        return (
            <div className="space-y-6 animate-in fade-in">
                {/* Module Navigation */}
                <div className="flex justify-between items-center bg-white p-3 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex gap-2">
                        <button onClick={() => setView('packages')} className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${view === 'packages' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Service Templates</button>
                        <button onClick={() => setView('parts')} className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${view === 'parts' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Global Parts Catalog</button>
                    </div>
                    <div className="relative mr-2">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                        <input className="pl-12 pr-6 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold w-64 focus:ring-2 focus:ring-indigo-500" placeholder={`Filter ${view}...`} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {list.map((item: any) => (
                        <button 
                            key={item.id} 
                            onClick={() => setSelectedPackage(item)} 
                            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group hover:border-indigo-500 transition-all shadow-sm"
                        >
                            <div className="flex items-center gap-6 text-left">
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shadow-inner">
                                    {view === 'packages' ? <LayoutTemplate size={24}/> : <Box size={24}/>}
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-slate-900 leading-tight">{item.name}</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                        {view === 'packages' ? `${item.items?.length || 0} Components` : `SKU: ${item.sku || 'N/A'}`}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-slate-200 group-hover:text-indigo-600 transition-all" />
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 duration-400">
            {/* Context Header */}
            <div className="flex items-center justify-between bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-6">
                    <button onClick={() => setSelectedPackage(null)} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all border border-slate-100">
                        <ArrowLeft size={20}/>
                    </button>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedPackage.name}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Library Definition</p>
                    </div>
                </div>

                {/* MODAL TRIGGER: Calls SERVICE_FORM or PART_FORM */}
                <button 
                    onClick={() => triggerModal(view === 'packages' ? 'SERVICE_FORM' : 'PART_FORM', selectedPackage)}
                    className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg"
                >
                    <Edit3 size={16}/> Edit Specification
                </button>
            </div>

            <div className="grid grid-cols-3 gap-8">
                {/* 1. Technical Summary */}
                <div className="col-span-1 space-y-6">
                    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                        <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Core Metadata</h4>
                        <div className="space-y-6">
                            <StaticDetail label="Labor Estimate" value={`${selectedPackage.laborHours || 0} Hours`} icon={<Clock size={14}/>} />
                            <StaticDetail label="Category" value={selectedPackage.category || 'Maintenance'} icon={<Layers size={14}/>} />
                            <StaticDetail label="AI Confidence" value="High (94%)" icon={<Zap size={14}/>} />
                        </div>
                    </div>
                    
                    <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[3rem] flex items-center gap-4 text-emerald-700">
                        <ShieldCheck size={28}/>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest">Safety Compliance</p>
                            <p className="text-xs font-bold opacity-80">This template includes mandatory safety checks.</p>
                        </div>
                    </div>
                </div>

                {/* 2. Parts & Labor Breakdown */}
                <div className="col-span-2 space-y-6">
                    <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white flex justify-between items-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-5"><Wrench size={200}/></div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Package Retail (Excl. VAT)</p>
                            <p className="text-5xl font-black tracking-tighter">£{selectedPackage.basePrice || '0.00'}</p>
                            <p className="text-sm font-bold text-slate-400 mt-2">Calculated from {selectedPackage.items?.length || 0} line items</p>
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-8 px-2">
                            <h4 className="font-black text-xs uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                <Settings2 size={18} className="text-indigo-600"/> Itemised Breakdown
                            </h4>
                            <span className="text-[10px] font-black text-slate-300 uppercase">Live Pricing Enabled</span>
                        </div>
                        
                        <div className="space-y-3">
                            {selectedPackage.items?.length > 0 ? (
                                selectedPackage.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100"><Box size={16}/></div>
                                            <div>
                                                <p className="font-black text-slate-800 text-sm">{item.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qty: {item.quantity || 1}</p>
                                            </div>
                                        </div>
                                        <p className="font-black text-indigo-600 text-sm">£{item.price}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="p-16 border-2 border-dashed border-slate-50 rounded-[2.5rem] text-center">
                                    <p className="text-sm font-bold text-slate-300 italic">No individual items linked to this service yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// UI Static Detail Helper
const StaticDetail = ({ label, value, icon }: any) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
            {icon} {label}
        </label>
        <div className="p-5 bg-slate-50 rounded-2xl font-bold text-slate-800 text-sm border border-slate-100/50">
            {value || 'Not Defined'}
        </div>
    </div>
);