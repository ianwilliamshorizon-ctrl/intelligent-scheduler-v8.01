import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ServicePackage, EstimateLineItem, TaxRate, BusinessEntity, Part } from '../types';
import { PlusCircle, Trash2, Package, Info, Search, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatUtils';
import FormModal from './FormModal';
import { useToast } from '../hooks/useToast';

interface ServicePackageFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (pkg: ServicePackage) => Promise<void> | void; // Updated to support async
    servicePackage: Partial<ServicePackage> | null;
    taxRates: TaxRate[];
    entityId: string;
    businessEntities: BusinessEntity[];
    parts: Part[];
}

const ServicePackageFormModal: React.FC<ServicePackageFormModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    servicePackage, 
    taxRates, 
    entityId, 
    businessEntities,
    parts 
}) => {
    const [formData, setFormData] = useState<Partial<ServicePackage>>({});
    const [activeSearchRow, setActiveSearchRow] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();

    const standardTaxRateId = useMemo(() => taxRates.find(t => t.code === 'T1')?.id, [taxRates]);

    // Initialize/Reset form data
    useEffect(() => { 
        if (isOpen) {
            if (servicePackage) {
                const initialItems = (servicePackage.costItems || (servicePackage as any).lineItems || []).map((item: any) => ({
                    ...item,
                    id: item.id || crypto.randomUUID(),
                    unitCost: item.unitCost || item.unitPrice || 0,
                    isLabor: item.isLabor || false,
                    fromStock: item.fromStock || false
                }));

                setFormData({
                    ...servicePackage,
                    name: servicePackage.name || '',
                    description: servicePackage.description || '',
                    totalPrice: servicePackage.totalPrice || 0,
                    costItems: initialItems,
                    entityId: servicePackage.entityId || entityId,
                    taxCodeId: servicePackage.taxCodeId || standardTaxRateId
                });
            } else {
                setFormData({ 
                    entityId, 
                    name: '', 
                    description: '', 
                    totalPrice: 0, 
                    costItems: [], 
                    taxCodeId: standardTaxRateId 
                });
            }
        }
    }, [servicePackage, isOpen, entityId, standardTaxRateId]);

    const filteredParts = useMemo(() => {
        if (!searchTerm) return [];
        const lower = searchTerm.toLowerCase();
        return parts.filter(p => 
            p.partNumber.toLowerCase().includes(lower) || 
            p.description.toLowerCase().includes(lower)
        ).slice(0, 10);
    }, [parts, searchTerm]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(p => ({...p, [name]: name === 'totalPrice' ? parseFloat(value) || 0 : value}));
    };

    const handleLineChange = useCallback((id: string, field: string, value: any) => { 
        setFormData(p => ({
            ...p, 
            costItems: (p.costItems||[]).map(li => 
                li.id === id 
                    ? {...li, [field]: ['quantity', 'unitCost'].includes(field) ? parseFloat(value) || 0 : value } 
                    : li
            )
        })); 
    }, []);

    const addLine = (isLabor: boolean) => { 
        const newLine: any = { 
            id: crypto.randomUUID(), 
            description: '', 
            quantity: 1, 
            unitCost: 0, 
            isLabor, 
            taxCodeId: formData.taxCodeId || standardTaxRateId,
            fromStock: false 
        }; 
        setFormData(p => ({...p, costItems: [...(p.costItems||[]), newLine]})); 
    };

    const removeLine = (id: string) => setFormData(p => ({...p, costItems: (p.costItems||[]).filter(li => li.id !== id)}));

    const handleSelectPart = (lineItemId: string, part: Part) => {
        setFormData(p => ({...p, costItems: (p.costItems||[]).map(li => li.id === lineItemId ? {
            ...li,
            partId: part.id,
            partNumber: part.partNumber,
            description: part.description,
            unitCost: part.costPrice,
            fromStock: part.stockQuantity > 0
        } : li)}));
        setActiveSearchRow(null);
        setSearchTerm('');
    };

    const packageTotals = useMemo(() => {
        const costItems = formData.costItems || [];
        const totalCost = costItems.reduce((sum, item) => sum + ((item.unitCost || 0) * (item.quantity || 0)), 0);
        const totalSale = formData.totalPrice || 0;
        const totalProfit = totalSale - totalCost;
        const margin = totalSale > 0 ? (totalProfit / totalSale) * 100 : 0;
        return { totalCost, totalSale, totalProfit, margin };
    }, [formData.costItems, formData.totalPrice]);

    const executeSave = async () => {
        if(!formData.name?.trim()) { 
            showToast('Please provide a name for this package', 'error');
            return;
        }

        try {
            setIsSaving(true);
            // We await onSave to prevent the "message channel closed" error
            // by ensuring the async logic finishes before we trigger onClose (unmount)
            await onSave(formData as ServicePackage);
            onClose();
        } catch (error) {
            console.error("Save Error:", error);
            showToast("Failed to save package", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <FormModal 
            isOpen={isOpen} 
            onClose={onClose} 
            onSave={executeSave} 
            title={servicePackage?.id ? "Edit Service Package" : "Create Service Package"} 
            maxWidth="max-w-5xl"
            isSubmitting={isSaving}
        >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Package Name</label>
                    <input name="name" value={formData.name || ''} onChange={handleChange} placeholder="e.g. Major Service" className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Total Sell Price (£)</label>
                    <input name="totalPrice" type="number" step="0.01" value={formData.totalPrice ?? ''} onChange={handleChange} className="w-full p-2 border rounded font-bold text-indigo-700" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tax Code</label>
                    <select name="taxCodeId" value={formData.taxCodeId || ''} onChange={handleChange} className="w-full p-2 border rounded bg-white">
                        {taxRates.map(t => <option key={t.id} value={t.id}>{t.code} ({t.rate}%)</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-inner">
                <div className="grid grid-cols-12 gap-3 text-[10px] font-black text-gray-400 uppercase px-2 mb-3">
                    <div className="col-span-2">Part Number</div>
                    <div className="col-span-5">Description</div>
                    <div className="col-span-2 text-right">Qty</div>
                    <div className="col-span-2 text-right">Unit Cost</div>
                    <div className="col-span-1"></div>
                </div>

                <div className="space-y-2 min-h-[120px]">
                    {(formData.costItems || []).map(li => (
                        <div key={li.id} className="grid grid-cols-12 gap-3 items-center group">
                            <div className="col-span-2">
                                {!li.isLabor && (
                                    <input 
                                        value={li.partNumber || ''} 
                                        onChange={(e) => handleLineChange(li.id, 'partNumber', e.target.value)} 
                                        onFocus={() => setActiveSearchRow(li.id)} 
                                        placeholder="Part #" 
                                        className="w-full p-1.5 border rounded text-sm font-mono" 
                                    />
                                )}
                            </div>
                            <div className="col-span-5 relative">
                                <input 
                                    value={li.description} 
                                    onChange={(e) => { handleLineChange(li.id, 'description', e.target.value); setSearchTerm(e.target.value); }} 
                                    onFocus={() => setActiveSearchRow(li.id)} 
                                    placeholder={li.isLabor ? "Labor Details..." : "Search parts..."} 
                                    className={`w-full p-1.5 border rounded text-sm ${li.isLabor ? 'border-l-4 border-l-blue-400' : ''}`} 
                                />
                                {activeSearchRow === li.id && filteredParts.length > 0 && (
                                    <div className="absolute z-50 top-full left-0 w-full bg-white border rounded shadow-2xl mt-1 overflow-hidden">
                                        {filteredParts.map(part => (
                                            <div key={part.id} onMouseDown={() => handleSelectPart(li.id, part)} className="p-3 hover:bg-indigo-50 cursor-pointer border-b last:border-0 flex justify-between">
                                                <div>
                                                    <p className="text-sm font-bold">{part.partNumber}</p>
                                                    <p className="text-xs text-gray-500">{part.description}</p>
                                                </div>
                                                <p className="text-sm font-bold text-indigo-600">{formatCurrency(part.costPrice)}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <input type="number" step="0.1" value={li.quantity} onChange={e => handleLineChange(li.id, 'quantity', e.target.value)} className="col-span-2 p-1.5 border rounded text-sm text-right" />
                            <input type="number" step="0.01" value={li.unitCost} onChange={e => handleLineChange(li.id, 'unitCost', e.target.value)} className="col-span-2 p-1.5 border rounded text-sm text-right bg-indigo-50/30" />
                            <button onClick={() => removeLine(li.id)} className="col-span-1 text-gray-300 hover:text-red-500 transition-colors flex justify-center"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>

                <div className="flex gap-4 mt-6">
                    <button onClick={() => addLine(false)} className="text-xs font-bold text-indigo-600 hover:bg-white px-4 py-2 rounded-lg border border-indigo-100 flex items-center gap-2">
                        <PlusCircle size={16}/> Add Part Cost
                    </button>
                    <button onClick={() => addLine(true)} className="text-xs font-bold text-blue-600 hover:bg-white px-4 py-2 rounded-lg border border-blue-100 flex items-center gap-2">
                        <PlusCircle size={16}/> Add Labor Cost
                    </button>
                </div>
            </div>

            <div className="mt-8 bg-gray-900 text-white p-6 rounded-2xl shadow-xl flex justify-between items-center">
                <div className="space-y-1">
                    <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Total Internal Cost</p>
                    <p className="text-xl font-bold">{formatCurrency(packageTotals.totalCost)}</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Margin</p>
                    <p className={`text-xl font-bold ${packageTotals.margin < 30 ? 'text-amber-400' : 'text-green-400'}`}>
                        {packageTotals.margin.toFixed(1)}%
                    </p>
                </div>
                <div className="text-right space-y-1">
                    <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Estimated Profit</p>
                    <p className="text-2xl font-black text-indigo-400">{formatCurrency(packageTotals.totalProfit)}</p>
                </div>
            </div>
        </FormModal>
    );
};

export default ServicePackageFormModal;