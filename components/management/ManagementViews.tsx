import React from 'react';

// 1. We MUST use curly braces because the tabs use 'export const'
import { ManagementCustomersTab } from './tabs/ManagementCustomersTab';
import { ManagementVehiclesTab } from './tabs/ManagementVehiclesTab';
import { ManagementDiagramsTab } from './tabs/ManagementDiagramsTab';
import { ManagementStaffTab } from './tabs/ManagementStaffTab';
import { ManagementRolesTab } from './tabs/ManagementRolesTab';
import { ManagementEntitiesTab } from './tabs/ManagementEntitiesTab';
import { ManagementSuppliersTab } from './tabs/ManagementSuppliersTab';
import { ManagementPartsTab } from './tabs/ManagementPartsTab';
import { ManagementPackagesTab } from './tabs/ManagementPackagesTab';
import { ManagementNominalCodesTab } from './tabs/ManagementNominalCodesTab';

// 2. We EXPORT them so ManagementModal.tsx can find them here
export {
    ManagementCustomersTab,
    ManagementVehiclesTab,
    ManagementDiagramsTab,
    ManagementStaffTab,
    ManagementRolesTab,
    ManagementEntitiesTab,
    ManagementSuppliersTab,
    ManagementPartsTab,
    ManagementPackagesTab,
    ManagementNominalCodesTab
};

interface ManagementViewsProps {
    activeTab: string;
    searchTerm: string;
    onShowStatus: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ManagementViews: React.FC<ManagementViewsProps> = ({ activeTab, searchTerm, onShowStatus }) => {
    const renderContent = () => {
        switch (activeTab) {
            case 'customers':
                return <ManagementCustomersTab searchTerm={searchTerm} onShowStatus={onShowStatus} />;
            case 'vehicles':
                return <ManagementVehiclesTab searchTerm={searchTerm} onShowStatus={onShowStatus} />;
            case 'diagrams':
                return <ManagementDiagramsTab searchTerm={searchTerm} onShowStatus={onShowStatus} />;
            case 'staff':
                return <ManagementStaffTab searchTerm={searchTerm} onShowStatus={onShowStatus} />;
            case 'roles':
                return <ManagementRolesTab searchTerm={searchTerm} onShowStatus={onShowStatus} />;
            case 'entities':
                return <ManagementEntitiesTab searchTerm={searchTerm} onShowStatus={onShowStatus} />;
            case 'suppliers':
                return <ManagementSuppliersTab searchTerm={searchTerm} onShowStatus={onShowStatus} />;
            case 'parts':
                return <ManagementPartsTab searchTerm={searchTerm} onShowStatus={onShowStatus} />;
            case 'packages':
                return <ManagementPackagesTab searchTerm={searchTerm} onShowStatus={onShowStatus} />;
            case 'nominal':
                return <ManagementNominalCodesTab searchTerm={searchTerm} onShowStatus={onShowStatus} />;
            default:
                return (
                    <div className="flex items-center justify-center h-full text-gray-400 italic">
                        Select a management category from the sidebar
                    </div>
                );
        }
    };

    return (
        <div className="h-full w-full">
            {renderContent()}
        </div>
    );
};