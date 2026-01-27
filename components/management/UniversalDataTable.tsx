import React, { useState } from 'react';
import { Search, Edit3, Filter, Download, Upload } from 'lucide-react';

interface TableProps {
    data: any; 
    columns: any[];
    onEdit: (row: any) => void;
    onImport?: () => void;
    searchPlaceholder?: string;
    type?: string;
}

export const UniversalDataTable = ({ data, columns, onEdit, onImport, searchPlaceholder, type }: TableProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const safeData = Array.isArray(data) ? data : [];

    const filteredData = safeData.filter(item => 
        JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                    <input 
                        className="w-full pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                        placeholder={searchPlaceholder || `Search ${type}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex gap-3 px-2">
                    {onImport && (
                        <button 
                            onClick={onImport}
                            className="flex items-center gap-2 px-5 py-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all font-black text-[10px] uppercase tracking-widest"
                        >
                            <Upload size={16}/> Import CSV
                        </button>
                    )}
                    <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all border border-slate-100">
                        <Download size={18}/>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            {columns.map((col, i) => (
                                <th key={i} className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                    {col.header}
                                </th>
                            ))}
                            <th className="p-6 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredData.map((row, rowIndex) => (
                            <tr key={rowIndex} className="group hover:bg-indigo-50/30 transition-colors">
                                {columns.map((col, colIndex) => (
                                    <td key={colIndex} className="p-6 text-sm font-bold text-slate-700">
                                        {col.render ? col.render(row[col.key], row) : row[col.key] || '---'}
                                    </td>
                                ))}
                                <td className="p-6 text-right">
                                    <button 
                                        onClick={() => onEdit(row)}
                                        className="p-2 bg-white text-indigo-600 rounded-lg shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600 hover:text-white"
                                    >
                                        <Edit3 size={14}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredData.length === 0 && (
                    <div className="p-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">
                        No {type} Found
                    </div>
                )}
            </div>
        </div>
    );
};