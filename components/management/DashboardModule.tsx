import React, { useMemo } from 'react';
import { 
    Users, Car, Wrench, AlertCircle, 
    TrendingUp, Database, Activity, Clock, CheckCircle2
} from 'lucide-react';

export const DashboardModule = ({ data, onNavigate }: any) => {
    // DIAGNOSTICS LOGIC (Sharp & Fast)
    const diagnostics = useMemo(() => {
        const issues = [];
        if (data.customers?.filter((c: any) => !c.mobile && !c.email).length > 0) {
            issues.push({ id: 'contact', title: 'Data Gap', desc: 'Incomplete client profiles found.', severity: 'warning' });
        }
        if (data.parts?.filter((p: any) => !p.nominalCode).length > 0) {
            issues.push({ id: 'finance', title: 'Tax Risk', desc: 'Unmapped nominal codes.', severity: 'critical' });
        }
        return issues;
    }, [data]);

    const stats = [
        { label: 'Staff Members', val: data.users?.length || 0, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
        { label: 'Fleet Models', val: data.vehicles?.length || 0, color: 'text-blue-600', bg: 'bg-blue-50/50' },
        { label: 'Service Kits', val: data.servicePackages?.length || 0, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
        { label: 'Cloud Status', val: 'Online', color: 'text-amber-600', bg: 'bg-amber-50/50' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stat Grid - Sharp Shadows & Borders */}
            <div className="grid grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className={`p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]`}>
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">{stat.label}</p>
                        <p className={`text-4xl font-black ${stat.color}`}>{stat.val}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-3 gap-8">
                {/* System Integrity - Removed Blur for Crispness */}
                <div className="col-span-2 bg-slate-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
                    {/* Background Pattern - Crisp SVG style instead of scaled icon */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`, size: '20px 20px' }} />
                    
                    <div className="relative z-10">
                        <h3 className="text-2xl font-black mb-6 flex items-center gap-3">Workshop Intelligence</h3>
                        <div className="space-y-3">
                            {diagnostics.length > 0 ? diagnostics.map(issue => (
                                <div key={issue.id} className="flex items-center justify-between p-5 bg-white/10 rounded-2xl border border-white/10 shadow-lg">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${issue.severity === 'critical' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                                        <p className="font-bold text-sm">{issue.title}: <span className="text-slate-400 font-medium">{issue.desc}</span></p>
                                    </div>
                                    <button onClick={() => onNavigate(issue.id === 'contact' ? 'customers' : 'finance')} className="text-[10px] font-black text-indigo-400 hover:text-white uppercase tracking-widest">Resolve</button>
                                </div>
                            )) : (
                                <div className="p-6 bg-emerald-500/20 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                                    <CheckCircle2 className="text-emerald-400" size={20} />
                                    <p className="font-bold text-emerald-400 text-sm">System Optimised: No data errors found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Live Feed */}
                <div className="bg-white border border-slate-100 rounded-[3.5rem] p-8 shadow-sm">
                    <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2 text-sm uppercase tracking-widest">
                        <Clock className="text-indigo-500" size={16}/> Live Activity
                    </h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-xs font-black text-slate-800">Database Mirrored</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">System • Just Now</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-xs font-black text-slate-800">Entity Check Complete</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Admin • 12m ago</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};