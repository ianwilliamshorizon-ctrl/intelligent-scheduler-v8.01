import React, { useState, useMemo } from 'react';
import { 
  X, Printer, Mail, Save, FileText, Eye, EyeOff, Package, 
  ChevronRight, Car, User, ShieldCheck 
} from 'lucide-react';
import { 
  Estimate, TaxRate, Part, ServicePackage, 
  Vehicle, Customer, BusinessEntity 
} from '../types';
import { formatCurrency } from '../utils/formatUtils';
import ServicePackageFormModal from './ServicePackageFormModal';
import { useToast } from '../hooks/useToast';

interface EstimateViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  estimate: Estimate;
  customer?: Customer;
  vehicle?: Vehicle;
  taxRates: TaxRate[];
  parts: Part[];
  businessEntities: BusinessEntity[];
  onSavePackage: (pkg: ServicePackage) => Promise<void>;
}

const EstimateViewModal: React.FC<EstimateViewModalProps> = ({
  isOpen, 
  onClose, 
  estimate, 
  customer, 
  vehicle, 
  taxRates, 
  parts, 
  businessEntities,
  onSavePackage
}) => {
  const [isCustomerMode, setIsCustomerMode] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [packageDataForModal, setPackageDataForModal] = useState<Partial<ServicePackage> | null>(null);
  const { showToast } = useToast();

  // Calculate totals for display
  const dynamicTotals = useMemo(() => {
    const net = estimate.lineItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const tax = estimate.lineItems.reduce((sum, item) => {
      const rate = taxRates.find(r => r.id === item.taxCodeId)?.rate || 0;
      return sum + (item.unitPrice * item.quantity * (rate / 100));
    }, 0);
    return { net, tax, total: net + tax };
  }, [estimate.lineItems, taxRates]);

  // The logic that bridges the Estimate to a Service Package
  const handleCreatePackageFromEstimate = () => {
    // Filter out optional items to create a clean template
    const itemsToPackage = estimate.lineItems.filter(item => !item.isOptional);
    
    if (itemsToPackage.length === 0) {
      showToast("No items found to create a package template.", "error");
      return;
    }

    setPackageDataForModal({
      name: `${vehicle?.make || ''} ${vehicle?.model || ''} Service Template`.trim(),
      description: `Auto-generated from Estimate #${estimate.estimateNumber}`,
      totalPrice: dynamicTotals.net, 
      costItems: itemsToPackage.map(item => ({
        ...item,
        id: crypto.randomUUID(),
        unitCost: item.unitCost || item.unitPrice, 
        isLabor: item.isLabor || false
      })),
      entityId: estimate.entityId,
      taxCodeId: estimate.lineItems[0]?.taxCodeId || taxRates[0]?.id
    });

    setIsPackageModalOpen(true);
  };

  const handlePackageSave = async (newPkg: ServicePackage) => {
    try {
      await onSavePackage(newPkg);
      setIsPackageModalOpen(false);
      showToast("Service Package saved to library successfully", "success");
    } catch (error) {
      showToast("Failed to save package template", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-6xl max-h-[95vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Toolbar Header */}
        <div className="bg-white border-b border-gray-100 p-6 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Estimate {estimate.estimateNumber}</h2>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                {new Date(estimate.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsCustomerMode(!isCustomerMode)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                isCustomerMode ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-600'
              }`}
            >
              {isCustomerMode ? <Eye size={18} /> : <EyeOff size={18} />}
              {isCustomerMode ? 'Customer View' : 'Internal View'}
            </button>
            
            {!isCustomerMode && (
              <button 
                onClick={handleCreatePackageFromEstimate}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
              >
                <Save size={18} />
                Save as Package
              </button>
            )}

            <div className="h-8 w-[1px] bg-gray-100 mx-2" />
            
            <button onClick={onClose} className="p-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Document Content Area */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-gray-50/50">
          <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-sm p-12 lg:p-16 border-t-[12px] border-indigo-600 min-h-screen">
            
            {/* Header / Brand */}
            <div className="flex justify-between items-start mb-20">
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tighter italic">GARAGE<span className="text-indigo-600">OS</span></h1>
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Workshop Management System</p>
              </div>
              <div className="text-right">
                <h2 className="text-5xl font-black text-gray-100 leading-none uppercase select-none">Estimate</h2>
                <p className="font-mono text-gray-400 font-bold mt-2">REF: {estimate.estimateNumber}</p>
              </div>
            </div>

            {/* Entity/Customer Info */}
            <div className="grid grid-cols-2 gap-16 mb-20">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Customer Details</h4>
                <div>
                  <p className="text-xl font-black text-gray-900">{customer?.firstName} {customer?.lastName}</p>
                  <p className="text-gray-500 text-sm">{customer?.email}</p>
                  <p className="text-gray-500 text-sm">{customer?.phone}</p>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Vehicle Details</h4>
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <p className="font-black text-gray-900 text-lg uppercase">{vehicle?.make} {vehicle?.model}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-yellow-400 text-black px-2 py-0.5 rounded font-black text-xs tracking-wider border border-black/5">
                      {vehicle?.registration}
                    </span>
                    <span className="text-xs font-bold text-gray-400 italic">VIN: {vehicle?.vin?.slice(-6)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <table className="w-full mb-12">
              <thead>
                <tr className="border-b-2 border-gray-900 text-left">
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Description</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Qty</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Unit</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {estimate.lineItems.map((item) => (
                  <tr key={item.id} className={item.isOptional ? 'bg-amber-50/30' : ''}>
                    <td className="py-6">
                      <p className="font-bold text-gray-900">{item.description}</p>
                      {!isCustomerMode && item.partNumber && (
                        <span className="text-[9px] font-mono text-gray-400 uppercase bg-gray-100 px-1 py-0.5 rounded">Part: {item.partNumber}</span>
                      )}
                      {item.isOptional && <span className="ml-2 text-[9px] font-black text-amber-600 uppercase">Optional</span>}
                    </td>
                    <td className="py-6 text-center text-sm font-bold text-gray-500">{item.quantity}</td>
                    <td className="py-6 text-right text-sm font-bold text-gray-500">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-6 text-right font-black text-gray-900">{formatCurrency(item.unitPrice * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Summary */}
            <div className="flex justify-end pt-8 border-t-2 border-gray-900">
              <div className="w-full max-w-xs space-y-3">
                <div className="flex justify-between text-sm font-bold text-gray-400 italic">
                  <span>Net Amount</span>
                  <span>{formatCurrency(dynamicTotals.net)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-400 italic">
                  <span>VAT (20%)</span>
                  <span>{formatCurrency(dynamicTotals.tax)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="font-black text-xl uppercase tracking-tighter">Total Payable</span>
                  <span className="font-black text-3xl text-indigo-600">{formatCurrency(dynamicTotals.total)}</span>
                </div>
              </div>
            </div>

            {/* Footer Terms */}
            <div className="mt-24 pt-8 border-t border-gray-50 text-[10px] text-gray-400 font-medium leading-relaxed">
              <p>This estimate is valid for 30 days. All parts are subject to availability. 
              The totals provided are inclusive of VAT unless otherwise stated. 
              GarageOS Workshop Management Software.</p>
            </div>
          </div>
        </div>
      </div>

      {/* SERVICE PACKAGE SUB-MODAL */}
      {isPackageModalOpen && (
        <ServicePackageFormModal 
          isOpen={isPackageModalOpen}
          onClose={() => setIsPackageModalOpen(false)}
          servicePackage={packageDataForModal}
          taxRates={taxRates}
          entityId={estimate.entityId}
          businessEntities={businessEntities}
          parts={parts}
          onSave={handlePackageSave}
        />
      )}
    </div>
  );
};

export default EstimateViewModal;