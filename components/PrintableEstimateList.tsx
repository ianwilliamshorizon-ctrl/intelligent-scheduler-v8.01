import React from 'react';
import { Estimate, Vehicle, TaxRate } from '../types';
import { formatCurrency } from '../core/utils/formatUtils';

interface PrintableEstimateListProps {
    estimates: Estimate[];
    customers: Map<string, string>;
    vehicles: Map<string, Vehicle>;
    taxRates: TaxRate[];
    title: string;
}

const PrintableEstimateList: React.FC<PrintableEstimateListProps> = ({ 
    estimates, 
    customers, 
    vehicles, 
    taxRates,
    title 
}) => {
    // Helper to get tax rate value
    const getTaxRate = (id?: string) => {
        const rate = taxRates.find(t => t.id === id);
        return rate ? rate.rate / 100 : 0;
    };

    // Calculate item total (Gross)
    const calculateItemTotal = (item: any) => {
        const net = item.quantity * item.unitPrice;
        return net + (net * getTaxRate(item.taxCodeId));
    };

    return (
        <div className="p-8 bg-white text-black font-sans print:p-0">
            {/* Print Header */}
            <div className="flex justify-between items-end border-b-4 border-black pb-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">{title}</h1>
                    <p className="text-sm text-gray-600 font-bold">Report Generated: {new Date().toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                    <p className="text-xl font-bold">Records: {estimates.length}</p>
                </div>
            </div>

            {/* Estimates Table */}
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b-2 border-black text-[10px] font-black uppercase tracking-widest">
                        <th className="py-2 px-1">Ref No.</th>
                        <th className="py-2 px-1">Customer</th>
                        <th className="py-2 px-1">Vehicle</th>
                        <th className="py-2 px-1 text-center">Date</th>
                        <th className="py-2 px-1">Status</th>
                        <th className="py-2 px-1 text-right">Total (Inc. Tax)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {estimates.map((estimate) => {
                        const total = estimate.lineItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
                        const vehicle = vehicles.get(estimate.vehicleId);

                        return (
                            <tr key={estimate.id} className="text-xs break-inside-avoid">
                                <td className="py-3 px-1 font-mono font-bold">{estimate.estimateNumber}</td>
                                <td className="py-3 px-1 font-semibold">{customers.get(estimate.customerId) || 'Unknown'}</td>
                                <td className="py-3 px-1">
                                    <div className="font-bold">{vehicle?.registration || 'N/A'}</div>
                                    <div className="text-[10px] text-gray-500 uppercase">{vehicle?.make} {vehicle?.model}</div>
                                </td>
                                <td className="py-3 px-1 text-center font-medium">{estimate.issueDate}</td>
                                <td className="py-3 px-1">
                                    <span className="text-[9px] font-black uppercase border border-black px-1.5 py-0.5 rounded">
                                        {estimate.status}
                                    </span>
                                </td>
                                <td className="py-3 px-1 text-right font-black">{formatCurrency(total)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Footer / Disclaimer */}
            <div className="mt-12 pt-4 border-t border-gray-200 text-[9px] text-gray-400 italic">
                <p>This document is an internal summary report. Individual detailed estimates should be consulted for full parts and labor breakdowns.</p>
                <p>Confidential: For Authorized Personnel Only.</p>
            </div>

            {/* Print-specific CSS to ensure the layout remains clean */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { size: A4; margin: 20mm; }
                    body { background: white; }
                    .no-print { display: none !important; }
                }
            `}} />
        </div>
    );
};

export default PrintableEstimateList;