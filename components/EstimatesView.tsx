import React, { useState, useMemo } from 'react';
import { useData } from '../core/state/DataContext';
import { useApp } from '../core/state/AppContext';
import { Estimate, EstimateLineItem, Vehicle } from '../types';
import { 
    Plus, Eye, Edit, Trash2, Search, PlusCircle, Wand2, 
    ChevronDown, ChevronUp, Loader2, Printer 
} from 'lucide-react';
import { formatCurrency } from '../core/utils/formatUtils';
import { generateServicePackageName } from '../core/services/geminiService';
import { getRelativeDate } from '../core/utils/dateUtils';
import PrintableEstimateList from './PrintableEstimateList';
import { usePrint } from '../core/hooks/usePrint';

// --- Sub-Component: Status Filter Bar ---
const StatusFilter = ({ 
    statuses, 
    selectedStatuses, 
    onToggle 
}: { 
    statuses: readonly Estimate['status'][]; 
    selectedStatuses: Estimate['status'][]; 
    onToggle: (status: Estimate['status']) => void; 
}) => (
    <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium text-gray-700 mr-2">Status:</span>
        {statuses.map(status => (
            <button
                key={status}
                onClick={() => onToggle(status)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                    selectedStatuses.includes(status)
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
                {status}
            </button>
        ))}
    </div>
);

interface EstimatesViewProps {
    onOpenEstimateModal: (estimate: Partial<Estimate> | null) => void;
    onViewEstimate: (estimate: Estimate) => void;
    onSmartCreateClick: () => void;
    onOpenServicePackageModal: (pkg: any) => void;
}

const EstimatesView = ({ 
    onOpenEstimateModal, 
    onViewEstimate, 
    onSmartCreateClick,
    onOpenServicePackageModal 
}: EstimatesViewProps) => {
    // --- Data Hooks ---
    const { estimates, customers, vehicles, taxRates, setServicePackages, businessEntities } = useData();
    const { selectedEntityId, users } = useApp();
    const print = usePrint();
    
    // --- Local State ---
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<Estimate['status'][]>([]);
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [isCreatingPackage, setIsCreatingPackage] = useState(false);

    // --- Memoized Lookups ---
    const customerMap = useMemo(() => new Map(customers.map(c => [c.id, `${c.forename} ${c.surname}`])), [customers]);
    const vehicleMap = useMemo(() => new Map(vehicles.map(v => [v.id, v])), [vehicles]);
    const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);
    const taxRatesMap = useMemo(() => new Map(taxRates.map(t => [t.id, t.rate])), [taxRates]);
    const standardTaxRateId = useMemo(() => taxRates.find(t => t.code === 'T1')?.id || taxRates[0]?.id, [taxRates]);
    
    const estimateStatusOptions: readonly Estimate['status'][] = ['Draft', 'Sent', 'Approved', 'Declined', 'Converted to Job', 'Closed'];

    // --- Filtering Logic ---
    const filteredEstimates = useMemo(() => {
        const thirtyDaysAgo = getRelativeDate(-30);
        const selectedEntity = businessEntities.find(e => e.id === selectedEntityId);

        return estimates.filter(estimate => {
            if (selectedEntityId !== 'all') {
                if (selectedEntity?.shortCode) {
                    if (!estimate.estimateNumber.startsWith(selectedEntity.shortCode)) return false;
                } else if (estimate.entityId !== selectedEntityId) return false;
            }

            if (estimate.issueDate < thirtyDaysAgo) return false;

            const vehicle = vehicleMap.get(estimate.vehicleId);
            const customer = customerMap.get(estimate.customerId);
            const lowerFilter = filter.toLowerCase().replace(/\s/g, '');

            const matchesSearch = filter === '' ||
                estimate.estimateNumber.toLowerCase().includes(lowerFilter) ||
                (customer && customer.toLowerCase().replace(/\s/g, '').includes(lowerFilter)) ||
                (vehicle && (
                    vehicle.registration.toLowerCase().replace(/\s/g, '').includes(lowerFilter) ||
                    (vehicle.previousRegistrations || []).some(pr => pr.registration.toLowerCase().replace(/\s/g, '').includes(lowerFilter))
                ));
            
            const matchesStatus = statusFilter.length === 0 || statusFilter.includes(estimate.status);
            return matchesSearch && matchesStatus;
        }).sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.estimateNumber.localeCompare(a.estimateNumber));
    }, [estimates, filter, statusFilter, customerMap, vehicleMap, selectedEntityId, businessEntities]);

    // --- Totals Logic ---
    const calculateTotal = (lineItems: EstimateLineItem[]) => {
        return (lineItems || []).filter(item => !item.isPackageComponent).reduce((sum, item) => {
            const itemNet = (item.quantity || 0) * (item.unitPrice || 0);
            const taxCodeId = item.taxCodeId || standardTaxRateId;
            const rate = taxCodeId ? (taxRatesMap.get(taxCodeId) || 0) / 100 : 0;
            return sum + itemNet + (itemNet * rate);
        }, 0);
    };
    
    const handleStatusToggle = (status: Estimate['status']) => {
        setStatusFilter(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
    };

    // --- Smart Service Package Creation ---
    const handleCreatePackage = async (estimate: Estimate) => {
        const vehicle = vehicleMap.get(estimate.vehicleId);
        if (!vehicle) {
            alert("Cannot create a package without vehicle details.");
            return;
        }

        setIsCreatingPackage(true);
        try {
            const { name, description } = await generateServicePackageName(estimate.lineItems, vehicle.make, vehicle.model);
            const totalNet = (estimate.lineItems || []).filter(item => !item.isPackageComponent).reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

            const newPackage: any = {
                id: `pkg_${Date.now()}`,
                entityId: estimate.entityId,
                name: name || `${vehicle.make} Service`,
                description: description || `Derived from Estimate ${estimate.estimateNumber}`,
                totalPrice: totalNet,
                costItems: estimate.lineItems.map(li => ({
                    ...li, 
                    id: crypto.randomUUID(),
                    isPackageComponent: true
                })),
                applicableMake: vehicle.make,
                applicableModel: vehicle.model,
            };
            
            setServicePackages(prev => [...prev, newPackage]);
            onOpenServicePackageModal(newPackage); // Opens the modal for final review
        } catch (error: any) {
            alert(`AI failed to template package: ${error.message}`);
        } finally {
            setIsCreatingPackage(false);
        }
    };

    const handlePrintList = () => {
        print(
            <PrintableEstimateList 
                estimates={filteredEstimates} 
                customers={customerMap as any} 
                vehicles={vehicleMap}
                taxRates={taxRates}
                title="Estimates Report (Last 30 Days)"
            />
        );
    };
    
    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 bg-gray-50">
            <header className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Estimates</h2>
                <div className="flex items-center gap-3">
                     <button onClick={handlePrintList} className="flex items-center gap-2 py-2.5 px-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-all">
                        <Printer size={18}/> Print
                    </button>
                    <button onClick={onSmartCreateClick} className="flex items-center gap-2 py-2.5 px-4 bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all">
                        <Wand2 size={18}/> Smart Create
                    </button>
                    <button onClick={() => onOpenEstimateModal({})} className="flex items-center gap-2 py-2.5 px-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                        <PlusCircle size={18}/> New Estimate
                    </button>
                </div>
            </header>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 flex-shrink-0">
                <StatusFilter statuses={estimateStatusOptions} selectedStatuses={statusFilter} onToggle={handleStatusToggle}/>
                <div className="relative w-full max-w-md">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input 
                        type="text" 
                        placeholder="Search number, name, or registration..." 
                        value={filter} 
                        onChange={e => setFilter(e.target.value)} 
                        className="w-full p-3 pl-11 border-none bg-white rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                </div>
            </div>
            
             <main className="flex-grow overflow-y-auto">
                <div className="border border-gray-100 rounded-[2rem] overflow-hidden bg-white shadow-xl shadow-gray-200/50">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr className="text-gray-400 font-black uppercase tracking-widest text-[10px]">
                                <th className="p-5 text-left w-12"></th>
                                <th className="p-5 text-left">Ref No.</th>
                                <th className="p-5 text-left">Customer</th>
                                <th className="p-5 text-left">Vehicle</th>
                                <th className="p-5 text-left">Issued</th>
                                <th className="p-5 text-left">Status</th>
                                <th className="p-5 text-right">Total</th>
                                <th className="p-5 text-center">Actions</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-gray-50">
                            {filteredEstimates.map(estimate => (
                                <React.Fragment key={estimate.id}>
                                    <tr className={`hover:bg-indigo-50/30 transition-colors cursor-pointer ${expandedRowId === estimate.id ? 'bg-indigo-50/30' : ''}`} onClick={() => setExpandedRowId(expandedRowId === estimate.id ? null : estimate.id)}>
                                        <td className="p-5 text-center text-gray-300">
                                            {expandedRowId === estimate.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </td>
                                        <td className="p-5 font-mono font-bold text-indigo-600">{estimate.estimateNumber}</td>
                                        <td className="p-5 font-semibold text-gray-900">{customerMap.get(estimate.customerId)}</td>
                                        <td className="p-5">
                                            <span className="bg-gray-100 px-2 py-1 rounded font-mono font-bold text-gray-700">
                                                {vehicleMap.get(estimate.vehicleId)?.registration}
                                            </span>
                                        </td>
                                        <td className="p-5 text-gray-500 font-medium">{estimate.issueDate}</td>
                                        <td className="p-5">
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-tighter rounded-full ${
                                                estimate.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                                                estimate.status === 'Declined' ? 'bg-rose-100 text-rose-700' :
                                                'bg-gray-100 text-gray-600'}`}>{estimate.status}</span>
                                        </td>
                                        <td className="p-5 text-right font-black text-gray-900">{formatCurrency(calculateTotal(estimate.lineItems))}</td>
                                        <td className="p-5">
                                            <div className="flex justify-center gap-2" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => onViewEstimate(estimate)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"><Eye size={18} /></button>
                                                <button onClick={() => onOpenEstimateModal(estimate)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"><Edit size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedRowId === estimate.id && (
                                        <tr className="bg-gray-50/50">
                                            <td colSpan={8} className="p-8 border-t border-gray-100">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                    <div>
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Line Items</h4>
                                                        <ul className="space-y-3">
                                                            {(estimate.lineItems || []).filter(i => !i.isPackageComponent).map(item => (
                                                                <li key={item.id} className="flex justify-between text-sm font-medium border-b border-gray-100 pb-2">
                                                                    <span className="text-gray-600">{item.quantity}x {item.description}</span>
                                                                    <span className="text-gray-900">{formatCurrency(item.unitPrice * item.quantity)}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100">
                                                        <p className="text-xs font-bold text-gray-400 mb-4">Template this service for future {vehicleMap.get(estimate.vehicleId)?.make} models?</p>
                                                         <button 
                                                            onClick={() => handleCreatePackage(estimate)}
                                                            disabled={isCreatingPackage}
                                                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-500 text-white font-black rounded-xl hover:bg-teal-600 disabled:opacity-50 transition-all"
                                                        >
                                                            {isCreatingPackage ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                                                            {isCreatingPackage ? 'Generating...' : 'Save to Service Library'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                         </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default EstimatesView;