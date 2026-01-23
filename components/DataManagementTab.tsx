import React, { useState } from 'react';
import { useApp } from '../core/state/AppContext';
import * as Seeding from '../core/utils/seeding';
import { Loader2, Database, Trash2, AlertTriangle } from 'lucide-react';

const SeedButton: React.FC<{
    label: string;
    action: (force: boolean) => Promise<any>;
    force: boolean;
    setIsLoading: (loading: boolean) => void;
    isLoading: boolean;
}> = ({ label, action, force, setIsLoading, isLoading }) => {
    const handleClick = async () => {
        setIsLoading(true);
        try {
            await action(force);
            alert(`${label} completed successfully.`);
        } catch (error) {
            console.error(`Error seeding ${label}:`, error);
            alert(`Error during ${label}. Check console for details.`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            className="w-full text-left p-2 text-sm rounded-md bg-gray-50 hover:bg-gray-100 disabled:opacity-50 flex items-center gap-2"
        >
            <Database size={14} className="text-gray-500"/>
            <span>{label}</span>
        </button>
    );
};


const DataSeedingControls: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [forceSeed, setForceSeed] = useState(false);
    const { setConfirmation } = useApp();

    const handleClearAll = () => {
        setConfirmation({
            isOpen: true,
            title: 'Confirm Clear All Data',
            message: 'Are you sure you want to permanently delete all data from all collections? This action cannot be undone.',
            confirmText: 'Yes, Delete Everything',
            type: 'danger',
            onConfirm: async () => {
                setIsLoading(true);
                try {
                    await Seeding.clearAllData();
                    alert('All data has been cleared.');
                } catch (error) {
                    alert('An error occurred while clearing data. Check console for details.');
                    console.error(error);
                } finally {
                    setIsLoading(false);
                }
            },
        });
    };

    const handleSeedAll = () => {
        setConfirmation({
            isOpen: true,
            title: 'Confirm Seed All Data',
            message: `Are you sure you want to seed all collections? ${forceSeed ? 'This will CLEAR all existing data first.' : 'This will only add data to empty collections.'}`,
            confirmText: `Yes, ${forceSeed ? 'Force Seed' : 'Seed'} All`,
            type: forceSeed ? 'danger' : 'warning',
            onConfirm: async () => {
                setIsLoading(true);
                try {
                    await Seeding.seedAllDataSequentially(forceSeed);
                    alert('All data has been seeded successfully.');
                } catch (error) {
                    alert('An error occurred during seeding. Check console for details.');
                    console.error(error);
                } finally {
                    setIsLoading(false);
                }
            },
        });
    };

    const individualSeedActions = [
        { label: 'Level 0 (Core Config)', action: Seeding.seedCoreConfig },
        { label: 'Level 1 (Customers)', action: Seeding.seedCustomersAndRules },
        { label: 'Level 2 (Vehicles)', action: Seeding.seedVehiclesAndProspects },
        { label: 'Level 3 (Jobs & Rentals)', action: Seeding.seedJobsAndRentals },
        { label: 'Level 4 (Invoices)', action: Seeding.seedFinancials },
        { label: 'Misc', action: Seeding.seedMisc },
    ];


    return (
        <div className="relative">
            {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50 rounded-lg">
                    <Loader2 className="animate-spin text-indigo-600" size={48} />
                    <span className="ml-4 text-lg font-medium text-gray-700">Processing...</span>
                </div>
            )}
            <div className={`space-y-6 ${isLoading ? 'opacity-50' : ''}`}>
                 <div className="p-4 border rounded-lg bg-white">
                    <h3 className="font-bold text-lg mb-4 text-gray-800">Master Controls</h3>
                    <div className="space-y-3">
                         <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                            <h4 className="font-semibold text-indigo-800">Seed All Initial Data</h4>
                            <button onClick={handleSeedAll} className="px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2 text-sm">
                                <Database size={16}/> Seed All
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                            <h4 className="font-semibold text-red-800">Clear All Data</h4>
                            <button onClick={handleClearAll} className="px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 text-sm">
                                <Trash2 size={16}/> Clear
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 pl-1">
                         <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                             <input type="checkbox" checked={forceSeed} onChange={(e) => setForceSeed(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"/>
                            <span><span className="font-semibold">Force Seed:</span> Overwrite existing data.</span>
                        </label>
                    </div>
                </div>

                <div className="p-4 border rounded-lg bg-white">
                    <h3 className="font-bold text-lg mb-2 text-gray-800">Individual Seeding Levels</h3>
                    <p className="text-sm text-gray-500 mb-4">Run seeding for specific data levels. Dependencies are handled within each level.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {individualSeedActions.map(({ label, action }) => (
                            <SeedButton key={label} label={label} action={action} force={forceSeed} setIsLoading={setIsLoading} isLoading={isLoading} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataSeedingControls;
