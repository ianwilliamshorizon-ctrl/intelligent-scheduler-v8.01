import React, { useState } from 'react';
import { 
    Car, Wrench, History, ArrowLeft, 
    Save, Gauge, Info, Maximize2,
    ChevronRight, BookOpen, Layers, Settings,
    Plus, Activity, PenTool,Clock
} from 'lucide-react';

export const FleetModule = ({ data }: any) => {
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<'specs' | 'diagram' | 'schedules'>('specs');

    const vehicleList = data.vehicles || [];

    // --- VIEW 1: FLEET GRID ---
    if (!selectedVehicle) {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center px-4">
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Fleet Database</p>
                        <h2 className="text-xl font-black text-slate-900">Supported Models</h2>
                    </div>
                    <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all">
                        + Register New Model
                    </button>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                    {vehicleList.map((vehicle: any) => (
                        <button 
                            key={vehicle.id}
                            onClick={() => { setSelectedVehicle(vehicle); setActiveDetailTab('specs'); }}
                            className="bg-white p-8 rounded-[3rem] border border-slate-100 flex items-center justify-between group hover:border-indigo-500 transition-all shadow-sm text-left relative overflow-hidden"
                        >
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all border border-slate-100 shadow-inner">
                                    <Car size={32} />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-slate-900 leading-tight">{vehicle.make} {vehicle.model}</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{vehicle.yearRange || 'All Production Years'}</p>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                <ChevronRight size={20} />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // --- VIEW 2: VEHICLE DETAIL (THE TECHNICAL FOLDER) ---
    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 duration-400">
            {/* Header / Navigation */}
            <div className="flex items-center justify-between bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-6">
                    <button onClick={() => setSelectedVehicle(null)} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all border border-slate-100">
                        <ArrowLeft size={20}/>
                    </button>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedVehicle.make} {selectedVehicle.model}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Technical Profile</p>
                    </div>
                </div>

                <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200/50">
                    {[
                        { id: 'specs', label: 'Core Specs', icon: <Info size={14}/> },
                        { id: 'diagram', label: 'Inspection Diagram', icon: <PenTool size={14}/> },
                        { id: 'schedules', label: 'Schedules', icon: <Clock size={14}/> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveDetailTab(tab.id as any)}
                            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${activeDetailTab === tab.id ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* 1. CORE SPECS VIEW */}
                {activeDetailTab === 'specs' && (
                    <div className="grid grid-cols-3 gap-8 animate-in fade-in duration-300">
                        <div className="col-span-1 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                            <div>
                                <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-[10px]">Model Information</h4>
                                <div className="space-y-4">
                                    <DetailField label="Manufacturer" value={selectedVehicle.make} />
                                    <DetailField label="Model Name" value={selectedVehicle.model} />
                                    <DetailField label="Engine Variations" value={selectedVehicle.engines?.join(', ') || 'N/A'} />
                                </div>
                            </div>
                            <div className="pt-8 border-t border-slate-50">
                                <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-[10px]">Fluid Capacities</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm font-bold"><span className="text-slate-400">Engine Oil</span><span>5.2L</span></div>
                                    <div className="flex justify-between text-sm font-bold"><span className="text-slate-400">Coolant</span><span>7.5L</span></div>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 space-y-8">
                            <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 p-12 opacity-5"><Layers size={220}/></div>
                                <div className="relative z-10 flex justify-between items-start">
                                    <div>
                                        <h4 className="text-3xl font-black mb-4">Technical Intelligence</h4>
                                        <p className="text-slate-400 font-medium max-w-sm leading-relaxed">AI analyzes previous jobs for this model to suggest parts and labor times.</p>
                                    </div>
                                    <div className="bg-white/10 p-6 rounded-[2rem] border border-white/10 backdrop-blur-md">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 text-center">Data Confidence</p>
                                        <p className="text-4xl font-black text-center">98%</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <ActionTile label="Common Faults" count="4" icon={<Activity className="text-rose-500"/>} bg="bg-rose-50" />
                                <ActionTile label="Parts Commonality" count="88%" icon={<BookOpen className="text-blue-500"/>} bg="bg-blue-50" />
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. INSPECTION DIAGRAM VIEW */}
                {activeDetailTab === 'diagram' && (
                    <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-12 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h4 className="text-2xl font-black text-slate-900">Inspection Mapping</h4>
                                <p className="text-sm font-bold text-slate-400">Configure hotspots for visual damage reporting.</p>
                            </div>
                            <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600 transition-all">
                                <Maximize2 size={16}/> Edit Hotspots
                            </button>
                        </div>
                        
                        <div className="aspect-video bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 group cursor-pointer hover:bg-slate-100 transition-all">
                            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center text-slate-300 group-hover:text-indigo-600 transition-colors">
                                <Car size={40} />
                            </div>
                            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Model Diagram Preview (SVG)</p>
                        </div>
                    </div>
                )}

                {/* 3. SCHEDULES VIEW */}
                {activeDetailTab === 'schedules' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center px-4">
                            <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Maintenance Schedules</h4>
                            <button className="text-indigo-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                <Plus size={14}/> Add Schedule
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <ScheduleRow title="Minor Service" interval="10,000 mi / 12 months" items={12} />
                            <ScheduleRow title="Major Service" interval="20,000 mi / 24 months" items={28} />
                            <ScheduleRow title="Timing Belt Replacement" interval="60,000 mi / 5 years" items={5} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- HELPER COMPONENTS ---

const DetailField = ({ label, value }: any) => (
    <div className="space-y-1">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <div className="p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 text-sm border border-slate-100/50">{value}</div>
    </div>
);

const ActionTile = ({ label, count, icon, bg }: any) => (
    <div className={`${bg} p-8 rounded-[2.5rem] border border-white shadow-sm flex flex-col justify-between h-44`}>
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-4xl font-black text-slate-900">{count}</p>
        </div>
    </div>
);

const ScheduleRow = ({ title, interval, items }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex justify-between items-center group hover:border-indigo-500 transition-all shadow-sm">
        <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                <Settings size={24} />
            </div>
            <div>
                <h4 className="text-lg font-black text-slate-900">{title}</h4>
                <p className="text-sm font-bold text-slate-400 tracking-tight">{interval}</p>
            </div>
        </div>
        <div className="flex items-center gap-6">
            <div className="text-right">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Checklist</p>
                <p className="font-black text-slate-900 text-sm">{items} Steps</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <ChevronRight size={18} />
            </div>
        </div>
    </div>
);