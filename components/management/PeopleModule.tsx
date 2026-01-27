import React, { useState } from 'react';
import { 
    User, Users, ArrowLeft, Edit3, ChevronRight, Search, 
    Phone, Mail, MapPin, History, FileText, Car, CreditCard, ShieldAlert 
} from 'lucide-react';

export const PeopleModule = ({ data, triggerModal }: any) => {
    const [view, setView] = useState<'staff' | 'customers'>('staff');
    const [selectedPerson, setSelectedPerson] = useState<any>(null);

    const list = view === 'staff' ? (data.users || []) : (data.customers || []);

    if (!selectedPerson) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center bg-white p-3 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex gap-2">
                        <button onClick={() => setView('staff')} className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${view === 'staff' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Workshop Staff</button>
                        <button onClick={() => setView('customers')} className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${view === 'customers' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Customer Database</button>
                    </div>
                    <div className="relative mr-2">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                        <input className="pl-12 pr-6 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold w-64 focus:ring-2 focus:ring-indigo-500" placeholder={`Search ${view}...`} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {list.map((person: any) => (
                        <button key={person.id} onClick={() => setSelectedPerson(person)} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group hover:border-indigo-500 transition-all shadow-sm">
                            <div className="flex items-center gap-6 text-left">
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shadow-inner"><User size={24}/></div>
                                <div>
                                    <h4 className="text-xl font-black text-slate-900 leading-tight">{person.name}</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{person.role || person.type || 'Standard Account'}</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 duration-400">
            {/* Header with Breadcrumb and Edit Trigger */}
            <div className="flex items-center justify-between bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-6">
                    <button onClick={() => setSelectedPerson(null)} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all border border-slate-100"><ArrowLeft size={20}/></button>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedPerson.name}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{view === 'staff' ? 'Staff Personnel File' : 'Customer Account Folder'}</p>
                    </div>
                </div>

                <button 
                    onClick={() => triggerModal(view === 'staff' ? 'STAFF_FORM' : 'CUSTOMER_FORM', selectedPerson)}
                    className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg"
                >
                    <Edit3 size={16}/> Edit Full Details
                </button>
            </div>

            <div className="grid grid-cols-3 gap-8">
                {/* 1. Contact Info (Read-Only Summary) */}
                <div className="col-span-1 space-y-6">
                    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                        <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Primary Contact</h4>
                        <div className="space-y-6">
                            <StaticField label="Phone" value={selectedPerson.phone} icon={<Phone size={14}/>} />
                            <StaticField label="Email" value={selectedPerson.email} icon={<Mail size={14}/>} />
                            <StaticField label="Address" value={selectedPerson.address} icon={<MapPin size={14}/>} isArea />
                        </div>
                    </div>
                    {selectedPerson.balance > 0 && (
                        <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-center gap-4 text-rose-600 animate-pulse">
                            <ShieldAlert size={24}/>
                            <p className="text-xs font-black uppercase tracking-widest">Outstanding Balance Alert</p>
                        </div>
                    )}
                </div>

                {/* 2. Relational Assets (Vehicles/Jobs) */}
                <div className="col-span-2 space-y-6">
                    <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white flex justify-between items-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-5"><CreditCard size={180}/></div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Account Value</p>
                            <p className="text-5xl font-black tracking-tighter">£{selectedPerson.totalSpend || '0.00'}</p>
                            <p className="text-sm font-bold text-slate-400 mt-2">Lifetime revenue from this account</p>
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <h4 className="font-black text-xs uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                {view === 'customers' ? <Car size={18} className="text-indigo-600"/> : <History size={18} className="text-indigo-600"/>}
                                {view === 'customers' ? 'Registered Garage' : 'Completed Assignments'}
                            </h4>
                            <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">+ Link New</button>
                        </div>
                        
                        {/* Placeholder for linked entities */}
                        <div className="p-16 border-2 border-dashed border-slate-50 rounded-[2.5rem] text-center">
                            <p className="text-sm font-bold text-slate-300 italic">
                                {view === 'customers' ? 'No vehicles currently linked to this customer.' : 'No historical job cards found for this technician.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simplified Helpers for Static View
const StaticField = ({ label, value, icon, isArea }: any) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">{icon} {label}</label>
        <div className={`p-5 bg-slate-50 rounded-2xl font-bold text-slate-800 text-sm border border-slate-100/50 ${isArea ? 'min-h-[100px] leading-relaxed' : ''}`}>
            {value || 'Not Configured'}
        </div>
    </div>
);