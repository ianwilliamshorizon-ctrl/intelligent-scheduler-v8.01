import React from 'react';
import { User, Role } from '../../../types';
import { PlusCircle, Shield, Mail, User as UserIcon } from 'lucide-react';

interface ManagementStaffTabProps {
    users: User[];
    roles: Role[];
    onAdd: () => void;
    onEdit: (user: User) => void;
    onDelete: (id: string) => void;
}

export const ManagementStaffTab: React.FC<ManagementStaffTabProps> = ({ 
    users, 
    roles, 
    onAdd, 
    onEdit, 
    onDelete 
}) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-black text-slate-900">Staff Members</h3>
                    <p className="text-sm text-slate-500 font-medium">Manage system access and permissions</p>
                </div>
                <button 
                    onClick={onAdd} 
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2 font-black transition-all"
                >
                    <PlusCircle size={18}/> Add Staff Member
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map(user => {
                    // Fix: Check for 'role' property per your types.ts
                    const userRole = roles.find(r => r.id === (user as any).roleId || r.name === user.role);
                    return (
                        <div key={user.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-xl transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 transition-colors">
                                    <UserIcon size={24} />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => onEdit(user)} className="text-xs font-black text-indigo-600 hover:underline">Edit</button>
                                    <button onClick={() => onDelete(user.id)} className="text-xs font-black text-rose-600 hover:underline">Delete</button>
                                </div>
                            </div>
                            
                            <h4 className="font-black text-slate-900 text-lg">{user.name}</h4>
                            <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
                                <Mail size={14} />
                                <span className="truncate">{(user as any).email || 'No email set'}</span>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-slate-600">
                                    <Shield size={14} />
                                    <span className="text-[11px] font-black uppercase tracking-wider">{user.role || 'No Role'}</span>
                                </div>
                                {(user as any).isActive !== undefined && (
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${(user as any).isActive ? 'text-emerald-500' : 'text-slate-300'}`}>
                                        {(user as any).isActive ? 'Active' : 'Inactive'}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};