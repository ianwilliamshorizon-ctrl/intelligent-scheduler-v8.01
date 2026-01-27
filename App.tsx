import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import * as T from './types'; 
import { useData } from './core/state/DataContext';
import { useApp } from './core/state/AppContext';
import { createBackup, downloadBackup } from './core/utils/backupUtils';
import { setItem } from './core/db';
import { getCustomerDisplayName } from './core/utils/customerUtils';
import { formatDate } from './core/utils/dateUtils';
import { useWorkshopActions } from './core/hooks/useWorkshopActions';
import { ToastProvider } from './hooks/useToast';

// Layout
import MainLayout from './components/MainLayout';
import AppModals from './components/AppModals';

// Views
import DashboardView from './components/DashboardView';
import DispatchView from './modules/workshop/DispatchView';
import WorkflowView from './components/WorkflowView';
import JobsView from './modules/workshop/JobsView';
import EstimatesView from './components/EstimatesView';
import InvoicesView from './components/InvoicesView';
import PurchaseOrdersView from './components/PurchaseOrdersView';
import SalesView from './components/SalesView';
import StorageView from './components/StorageView';
import RentalsView from './components/RentalsView';
import ConciergeView from './components/ConciergeView';
import CommunicationsView from './components/CommunicationsView';
import AbsenceView from './components/AbsenceView';
import InquiriesView from './components/InquiriesView';

// Modals
import ManagementModal from './components/ManagementModal';
import LoginView from './components/LoginView';

const App = () => {
    const { 
        currentView, currentUser, 
        selectedEntityId, 
        confirmation, setConfirmation,
        users, isAuthenticated, login,
        backupSchedule, setBackupSchedule
    } = useApp();

    const data = useData();
    const { 
        jobs, vehicles, customers, estimates, invoices, purchaseOrders, 
        purchases, parts, servicePackages, suppliers, engineers, lifts,
        rentalVehicles, rentalBookings, saleVehicles, saleOverheadPackages,
        prospects, storageBookings, storageLocations, batteryChargers,
        nominalCodes, nominalCodeRules, absenceRequests, inquiries, 
        reminders, auditLog, businessEntities, taxRates, roles, inspectionDiagrams,
        setJobs, setEstimates, setInvoices, setPurchaseOrders, setRentalBookings,
        setStorageBookings, setProspects, setInquiries, setAbsenceRequests, setParts,
        setServicePackages
    } = data;

    // --- Modal & Management States ---
    const [isManagementOpen, setIsManagementOpen] = useState(false);
    const [managementInitialView, setManagementInitialView] = useState<{ tab: string; id: string } | null>(null);
    const [servicePackageFormModal, setServicePackageFormModal] = useState<{ isOpen: boolean; servicePackage: Partial<T.ServicePackage> | null }>({ isOpen: false, servicePackage: null });
    
    // --- Other UI States ---
    const [isSmartCreateOpen, setIsSmartCreateOpen] = useState(false);
    const [smartCreateMode, setSmartCreateMode] = useState<'job' | 'estimate'>('job');
    const [smartCreateDefaultDate, setSmartCreateDefaultDate] = useState<string | null>(null);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [isEditJobModalOpen, setIsEditJobModalOpen] = useState(false);
    const [checkInJob, setCheckInJob] = useState<T.Job | null>(null);
    const [checkOutJob, setCheckOutJob] = useState<T.Job | null>(null);
    const [poModal, setPoModal] = useState<{ isOpen: boolean; po: T.PurchaseOrder | null }>({ isOpen: false, po: null });
    const [batchPoModalOpen, setBatchPoModalOpen] = useState(false);
    const [viewPoModal, setViewPoModal] = useState<{ isOpen: boolean; po: T.PurchaseOrder | null }>({ isOpen: false, po: null });
    const [invoiceFormModal, setInvoiceFormModal] = useState<{ isOpen: boolean; invoice: T.Invoice | null }>({ isOpen: false, invoice: null });
    const [viewInvoiceModal, setViewInvoiceModal] = useState<{ isOpen: boolean; invoice: T.Invoice | null }>({ isOpen: false, invoice: null });
    const [salesInvoiceModal, setSalesInvoiceModal] = useState<{ isOpen: boolean; invoice: T.Invoice | null }>({ isOpen: false, invoice: null });
    const [exportModal, setExportModal] = useState<{ isOpen: boolean; type: 'invoices' | 'purchases'; items: any[] }>({ isOpen: false, type: 'invoices', items: [] });
    const [rentalBookingModal, setRentalBookingModal] = useState<{ isOpen: boolean; booking: Partial<T.RentalBooking> | null }>({ isOpen: false, booking: null });
    const [rentalConditionModal, setRentalConditionModal] = useState<{ isOpen: boolean; booking: T.RentalBooking | null; mode: 'checkOut' | 'checkIn' }>({ isOpen: false, booking: null, mode: 'checkOut' });
    const [rentalAgreementModal, setRentalAgreementModal] = useState<{ isOpen: boolean; booking: T.RentalBooking | null }>({ isOpen: false, booking: null });
    const [rentalReturnReportModal, setRentalReturnReportModal] = useState<{ isOpen: boolean; booking: T.RentalBooking | null }>({ isOpen: false, booking: null });
    const [sorContractModal, setSorContractModal] = useState<{ isOpen: boolean; saleVehicle: T.SaleVehicle | null }>({ isOpen: false, saleVehicle: null });
    const [ownerStatementModal, setOwnerStatementModal] = useState<{ isOpen: boolean; saleVehicle: T.SaleVehicle | null }>({ isOpen: false, saleVehicle: null });
    const [internalStatementModal, setInternalStatementModal] = useState<{ isOpen: boolean; saleVehicle: T.SaleVehicle | null }>({ isOpen: false, saleVehicle: null });
    const [salesReportModal, setSalesReportModal] = useState(false);
    const [prospectModal, setProspectModal] = useState<{ isOpen: boolean; prospect: T.Prospect | null }>({ isOpen: false, prospect: null });
    const [estimateFormModal, setEstimateFormModal] = useState<{ isOpen: boolean; estimate: Partial<T.Estimate> | null }>({ isOpen: false, estimate: null });
    const [estimateViewModal, setEstimateViewModal] = useState<{ isOpen: boolean; estimate: T.Estimate | null }>({ isOpen: false, estimate: null });
    const [scheduleJobFromEstimateModal, setScheduleJobFromEstimateModal] = useState<{ isOpen: boolean; estimate: T.Estimate | null; inquiryId?: string }>({ isOpen: false, estimate: null });
    const [scheduleEmailModal, setScheduleEmailModal] = useState<{ isOpen: boolean; data: any }>({ isOpen: false, data: null });
    const [inquiryModal, setInquiryModal] = useState<{ isOpen: boolean; inquiry: Partial<T.Inquiry> | null }>({ isOpen: false, inquiry: null });
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [assistantContextJobId, setAssistantContextJobId] = useState<string | null>(null);

    const workshopActions = useWorkshopActions();
    const lastBackupTimeRef = useRef<string | null>(null);

    // --- System Actions ---
    const getFullStateData = useCallback(() => ({
        jobs, vehicles, customers, estimates, invoices, purchaseOrders, 
        purchases, parts, servicePackages, suppliers, engineers, lifts,
        rentalVehicles, rentalBookings, saleVehicles, saleOverheadPackages,
        prospects, storageBookings, storageLocations, batteryChargers,
        nominalCodes, nominalCodeRules, absenceRequests, inquiries, 
        reminders, auditLog, businessEntities, taxRates, roles, inspectionDiagrams, users
    }), [jobs, vehicles, customers, estimates, invoices, purchaseOrders, purchases, parts, servicePackages, suppliers, engineers, lifts, rentalVehicles, rentalBookings, saleVehicles, saleOverheadPackages, prospects, storageBookings, storageLocations, batteryChargers, nominalCodes, nominalCodeRules, absenceRequests, inquiries, reminders, auditLog, businessEntities, taxRates, roles, inspectionDiagrams, users]);

    const handleManualBackup = useCallback(() => {
        downloadBackup(createBackup(getFullStateData()));
    }, [getFullStateData]);

    const handleAutoBackup = useCallback(async () => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        try {
            await setItem(`backup_auto_${timestamp}`, createBackup(getFullStateData()));
            setConfirmation({ isOpen: true, title: 'Auto-Backup', message: 'System backed up successfully.', type: 'success' });
        } catch (e) { console.error(e); }
    }, [getFullStateData, setConfirmation]);

    useEffect(() => {
        if (!backupSchedule.enabled) return;
        const interval = setInterval(() => {
            const timeString = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            if (backupSchedule.times.includes(timeString) && lastBackupTimeRef.current !== timeString) {
                handleAutoBackup();
                lastBackupTimeRef.current = timeString;
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [backupSchedule, handleAutoBackup]);

    // --- Hard Reset for Management Modal ---
    const closeManagement = useCallback(() => {
        setIsManagementOpen(false);
        setServicePackageFormModal({ isOpen: false, servicePackage: null });
        setManagementInitialView(null);
    }, []);

    const openManagementForPackage = (pkg: Partial<T.ServicePackage>) => {
        setServicePackageFormModal({ isOpen: true, servicePackage: pkg });
        setManagementInitialView({ tab: 'servicePackages', id: pkg.id || '' });
        setIsManagementOpen(true);
    };

    if (!isAuthenticated) return <LoginView users={users} onLogin={login} />;

    const commonProps = {
        onStartWork: (jobId: string, segmentId: string) => workshopActions.handleUpdateSegmentStatus(jobId, segmentId, 'In Progress'),
        onPause: (id: string, segId: string) => workshopActions.handleUpdateSegmentStatus(id, segId, 'Paused'),
        onRestartWork: (jobId: string, segmentId: string) => workshopActions.handleUpdateSegmentStatus(jobId, segmentId, 'In Progress'),
        onEngineerComplete: (job: T.Job, segmentId: string) => workshopActions.handleUpdateSegmentStatus(job.id, segmentId, 'Engineer Complete'),
        onQcApprove: workshopActions.handleQcApprove,
        onOpenAssistant: (id: string) => { setAssistantContextJobId(id); setIsAssistantOpen(true); },
        onEditJob: (id: string) => { setSelectedJobId(id); setIsEditJobModalOpen(true); },
    };

    const renderView = () => {
        switch (currentView) {
            case 'dashboard': return <DashboardView {...commonProps} onCheckIn={(id) => { const job = jobs.find(j => j.id === id); if(job) setCheckInJob(job); }} onOpenInquiry={(inq) => setInquiryModal({isOpen: true, inquiry: inq})} />;
            case 'estimates': 
                return (
                    <EstimatesView 
                        onOpenEstimateModal={(est) => setEstimateFormModal({isOpen: true, estimate: est})} 
                        onViewEstimate={(est) => setEstimateViewModal({isOpen: true, estimate: est})} 
                        onSmartCreateClick={() => { setSmartCreateMode('estimate'); setIsSmartCreateOpen(true); }} 
                        onOpenServicePackageModal={openManagementForPackage} 
                    />
                );
            case 'dispatch': return <DispatchView setDefaultDateForModal={setSmartCreateDefaultDate} setIsSmartCreateOpen={setIsSmartCreateOpen} setSmartCreateMode={setSmartCreateMode} setSelectedJobId={setSelectedJobId} setIsEditModalOpen={setIsEditJobModalOpen} onOpenPurchaseOrder={(po) => setViewPoModal({isOpen: true, po})} onReassignEngineer={workshopActions.handleReassignEngineer} onCheckIn={(id) => { const job = jobs.find(j => j.id === id); if(job) setCheckInJob(job); }} onUnscheduleSegment={workshopActions.handleUnscheduleSegment} {...commonProps} />;
            case 'workflow': return <WorkflowView jobs={jobs} vehicles={vehicles} customers={customers} engineers={engineers} currentUser={currentUser} onGenerateInvoice={() => {}} {...commonProps} />;
            case 'jobs': return <JobsView onEditJob={(id) => { setSelectedJobId(id); setIsEditJobModalOpen(true); }} onSmartCreateClick={() => { setSmartCreateMode('job'); setIsSmartCreateOpen(true); }} />;
            case 'invoices': return <InvoicesView invoices={invoices} customers={customers} vehicles={vehicles} taxRates={taxRates} onViewInvoice={(inv) => setViewInvoiceModal({isOpen: true, invoice: inv})} onEditInvoice={(inv) => setInvoiceFormModal({isOpen: true, invoice: inv})} onOpenExportModal={(type, items) => setExportModal({isOpen: true, type, items})} onCreateAdhocInvoice={() => setInvoiceFormModal({isOpen: true, invoice: { createdByUserId: currentUser.id } as any})} />;
            case 'purchaseOrders': return <PurchaseOrdersView purchaseOrders={purchaseOrders} suppliers={suppliers} onOpenPurchaseOrderModal={(po) => setPoModal({isOpen: true, po})} onViewPurchaseOrder={(po) => setViewPoModal({isOpen: true, po})} onDeletePurchaseOrder={(id) => { if(window.confirm('Delete PO?')) setPurchaseOrders(p => p.filter(i => i.id !== id)) }} onExport={() => {}} onOpenBatchAddModal={() => setBatchPoModalOpen(true)} />;
            case 'sales': return <SalesView entity={businessEntities.find(e => e.id === selectedEntityId)!} onManageSaleVehicle={() => {}} onAddSaleVehicle={() => {}} onGenerateReport={() => setSalesReportModal(true)} onAddProspect={() => setProspectModal({isOpen: true, prospect: null})} onEditProspect={(p) => setProspectModal({isOpen: true, prospect: p})} onViewCustomer={() => {}} />;
            case 'storage': return <StorageView entity={businessEntities.find(e => e.id === selectedEntityId)!} onSaveBooking={(b) => workshopActions.handleSaveItem(setStorageBookings, b)} onBookOutVehicle={() => {}} onViewInvoice={() => {}} onAddCustomerAndVehicle={() => {}} onSaveInvoice={() => {}} setConfirmation={setConfirmation} setViewedInvoice={() => {}} />;
            case 'rentals': return <RentalsView entity={businessEntities.find(e => e.id === selectedEntityId)!} onOpenRentalBooking={(b) => setRentalBookingModal({isOpen: true, booking: b})} />;
            case 'concierge': return <ConciergeView onCheckIn={(id) => { const job = jobs.find(j => j.id === id); if(job) setCheckInJob(job); }} onOpenPurchaseOrder={(po) => setViewPoModal({isOpen: true, po})} onGenerateInvoice={() => {}} onCollect={(id) => { const job = jobs.find(j => j.id === id); if(job) setCheckOutJob(job); }} {...commonProps} />;
            case 'absence': return <AbsenceView currentUser={currentUser} users={users} absenceRequests={absenceRequests} setAbsenceRequests={setAbsenceRequests} />;
            case 'inquiries': return <InquiriesView onOpenInquiryModal={(inq) => setInquiryModal({isOpen: true, inquiry: inq})} onConvert={() => {}} onViewEstimate={(est) => setEstimateViewModal({isOpen: true, estimate: est})} onScheduleEstimate={(est, inquiryId) => setScheduleJobFromEstimateModal({isOpen: true, estimate: est, inquiryId})} onOpenPurchaseOrder={(po) => setViewPoModal({isOpen: true, po})} onEditEstimate={(est) => setEstimateFormModal({isOpen: true, estimate: est})} />;
            default: return <DashboardView {...commonProps} onCheckIn={() => {}} onOpenInquiry={() => {}} />;
        }
    };

    const modalsState = {
        isSmartCreateOpen, smartCreateMode, smartCreateDefaultDate,
        selectedJobId, isEditJobModalOpen, checkInJob, checkOutJob,
        poModal, batchPoModalOpen, viewPoModal,
        invoiceFormModal, viewInvoiceModal, salesInvoiceModal, exportModal,
        rentalBookingModal, rentalConditionModal, rentalAgreementModal, rentalReturnReportModal,
        sorContractModal, ownerStatementModal, internalStatementModal, salesReportModal,
        prospectModal, estimateFormModal, estimateViewModal, scheduleJobFromEstimateModal,
        scheduleEmailModal, inquiryModal, isAssistantOpen, assistantContextJobId,
        servicePackageFormModal
    };

    const setters = {
        setIsSmartCreateOpen, setSelectedJobId, setIsEditJobModalOpen, setCheckInJob, setCheckOutJob,
        setPoModal, setBatchPoModalOpen, setViewPoModal, setInvoiceFormModal, setViewInvoiceModal,
        setSalesInvoiceModal, setExportModal, setRentalBookingModal, setRentalConditionModal,
        setRentalAgreementModal, setRentalReturnReportModal, setSorContractModal, setOwnerStatementModal,
        setInternalStatementModal, setSalesReportModal, setProspectModal, setEstimateFormModal,
        setEstimateViewModal, setScheduleJobFromEstimateModal, setScheduleEmailModal, setInquiryModal,
        setIsAssistantOpen, setServicePackageFormModal
    };

    const modalActions = {
        handleSaveItem: workshopActions.handleSaveItem,
        setCustomers: data.setCustomers,
        setVehicles: data.setVehicles,
        handleSavePurchaseOrder: workshopActions.handleSavePurchaseOrder,
        handleSaveEstimate: workshopActions.handleSaveEstimate,
        handleApproveEstimate: workshopActions.handleApproveEstimate,
        handleCustomerApproveEstimate: () => {},
        handleCustomerDeclineEstimate: () => {},
        updateLinkedInquiryStatus: workshopActions.updateLinkedInquiryStatus,
        handleMarkJobAsAwaitingCollection: () => {}
    };

    return (
        <ToastProvider>
            <MainLayout onOpenManagement={() => { closeManagement(); setIsManagementOpen(true); }}>
                {renderView()}
                <AppModals modals={modalsState} setters={setters} actions={modalActions} />
                <ManagementModal 
                    isOpen={isManagementOpen} 
                    onClose={closeManagement} 
                    servicePackage={servicePackageFormModal.servicePackage}
                    initialView={managementInitialView}
                    selectedEntityId={selectedEntityId}
                    onViewJob={(id) => { setSelectedJobId(id); setIsEditJobModalOpen(true); }}
                    onViewEstimate={(est) => setEstimateViewModal({isOpen: true, estimate: est})}
                    backupSchedule={backupSchedule}
                    setBackupSchedule={setBackupSchedule}
                    onManualBackup={handleManualBackup}
                />
            </MainLayout>
        </ToastProvider>
    );
};

export default App;