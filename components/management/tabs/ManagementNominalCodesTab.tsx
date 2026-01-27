
import React from 'react';
import { useData } from '../../../core/state/DataContext';
import { PlusCircle } from 'lucide-react';

export const ManagementNominalCodesTab = ({ 
    onAddCode, onEditCode, onDeleteCode,
    onAddRule, onEditRule, onDeleteRule
}: any) => {
    const { nominalCodes, nominalCodeRules, businessEntities } = useData();
    return (
        <div className="space-y-6">
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-700">Financial Nominal Codes</h3>
                    <button onClick={onAddCode} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2 text-sm">
                        <PlusCircle size={16}/> Add Code
                    </button>
                </div>
                <div className="overflow-y-auto max-h-[30vh] border rounded-lg">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 sticky top-0"><tr><th className="p-2">Code</th><th className="p-2">Name</th><th className="p-2">Secondary Code</th><th className="p-2">Actions</th></tr></thead>
                        <tbody>
                            {nominalCodes.map(nc => (
                                <tr key={nc.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2 font-mono font-bold">{nc.code}</td>
                                    <td className="p-2">{nc.name}</td>
                                    <td className="p-2 font-mono text-xs">{nc.secondaryCode || '-'}</td>
                                    <td className="p-2">
                                        <button onClick={() => onEditCode(nc)} className="text-indigo-600 hover:underline mr-2">Edit</button>
                                        <button onClick={() => onDeleteCode(nc.id)} className="text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-700">Assignment Rules</h3>
                    <button onClick={onAddRule} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow flex items-center gap-2 text-sm">
                        <PlusCircle size={16}/> Add Rule
                    </button>
                </div>
                <div className="overflow-y-auto max-h-[35vh] border rounded-lg">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="p-2 w-16 text-center">Priority</th>
                                <th className="p-2">Type</th>
                                <th className="p-2">Entity</th>
                                <th className="p-2">Keywords (Include)</th>
                                <th className="p-2">Keywords (Exclude)</th>
                                <th className="p-2">Assigned Code</th>
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...nominalCodeRules].sort((a, b) => b.priority - a.priority).map(rule => {
                                const code = nominalCodes.find(c => c.id === rule.nominalCodeId);
                                const entity = businessEntities.find(e => e.id === rule.entityId);
                                return (
                                    <tr key={rule.id} className="border-b hover:bg-gray-50">
                                        <td className="p-2 text-center font-mono">{rule.priority}</td>
                                        <td className="p-2"><span className="px-2 py-0.5 bg-gray-200 rounded text-xs">{rule.itemType}</span></td>
                                        <td className="p-2 text-xs">{entity ? entity.name : (rule.entityId === 'all' ? 'All Entities' : 'Unknown')}</td>
                                        <td className="p-2 text-xs font-mono">{rule.keywords || '*'}</td>
                                        <td className="p-2 text-xs font-mono text-red-600">{rule.excludeKeywords || '-'}</td>
                                        <td className="p-2 text-xs font-semibold">{code ? `${code.code} - ${code.name}` : 'Unknown Code'}</td>
                                        <td className="p-2">
                                            <button onClick={() => onEditRule(rule)} className="text-indigo-600 hover:underline mr-2">Edit</button>
                                            <button onClick={() => onDeleteRule(rule.id)} className="text-red-600 hover:underline">Delete</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
