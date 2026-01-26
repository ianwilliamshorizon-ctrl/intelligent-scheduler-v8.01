
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
import EstimatesView from './modules/workshop/EstimatesView';
import InvoicesView from './modules/workshop/InvoicesView';
import PurchaseOrdersView from './modules/workshop/PurchaseOrdersView';
import SalesView from './components/SalesView';
import StorageView from './components/StorageView';
import RentalsView from './components/RentalsView';
import ConciergeView from './components/ConciergeView';
import CommunicationsView from './components/CommunicationsView';
import AbsenceView from './components/AbsenceView';
import InquiriesView from './components/InquiriesView';

// Modals managed here (others moved to AppModals)
import ManagementModal from './components/ManagementModal';
import LoginView from './components/LoginView';

const App = () => {
    const { 
        currentView, currentUser, 
        selectedEntityId, 
        confirmation, setConfirmation,
        users, isAuthenticated, login,
        backupSchedule, setBackupSchedule, appEnvironment
    } = useApp();

    const data = useData();
    // Destructure everything needed for backup
    const { 
        jobs, vehicles, customers, estimates, invoices, purchaseOrders, 
        purchases, parts, servicePackages, suppliers, engineers, lifts,
        rentalVehicles, rentalBookings, saleVehicles, saleOverheadPackages,
        prospects, storageBookings, storageLocations, batteryChargers,
        nominalCodes, nominalCodeRules, absenceRequests, inquiries, 
        reminders, auditLog, businessEntities, taxRates, roles, inspectionDiagrams,
        setJobs, setEstimates, setInvoices, setPurchaseOrders, setRentalBookings,
        setStorageBookings, setProspects, setInquiries, setAbsenceRequests, setParts
    } = data;

    // --- Modal State Management ---
    const [isManagementOpen, setIsManagementOpen] = useState(false);
    const [managementInitialView, setManagementInitialView] = useState<{ tab: string; id: string } | null>(null);
    
    // Smart Create
    const [isSmartCreateOpen, setIsSmartCreateOpen] = useState(false);
    const [smartCreateMode, setSmartCreateMode] = useState<'job' | 'estimate'>('job');
    const [smartCreateDefaultDate, setSmartCreateDefaultDate] = useState<string | null>(null);

    // Job Modals
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [isEditJobModalOpen, setIsEditJobModalOpen] = useState(false);
    const [checkInJob, setCheckInJob] = useState<T.Job | null>(null);
    const [checkOutJob, setCheckOutJob] = useState<T.Job | null>(null);

    // Purchase Order Modals
    const [poModal, setPoModal] = useState<{ isOpen: boolean; po: T.PurchaseOrder | null }>({ isOpen: false, po: null });
    const [batchPoModalOpen, setBatchPoModalOpen] = useState(false);
    const [viewPoModal, setViewPoModal] = useState<{ isOpen: boolean; po: T.PurchaseOrder | null }>({ isOpen: false, po: null });

    // Invoice Modals
    const [invoiceFormModal, setInvoiceFormModal] = useState<{ isOpen: boolean; invoice: T.Invoice | null }>({ isOpen: false, invoice: null });
    const [viewInvoiceModal, setViewInvoiceModal] = useState<{ isOpen: boolean; invoice: T.Invoice | null }>({ isOpen: false, invoice: null });
    const [salesInvoiceModal, setSalesInvoiceModal] = useState<{ isOpen: boolean; invoice: T.Invoice | null }>({ isOpen: false, invoice: null });
    const [exportModal, setExportModal] = useState<{ isOpen: boolean; type: 'invoices' | 'purchases'; items: any[] }>({ isOpen: false, type: 'invoices', items: [] });

    // Rental Modals
    const [rentalBookingModal, setRentalBookingModal] = useState<{ isOpen: boolean; booking: Partial<T.RentalBooking> | null }>({ isOpen: false, booking: null });
    const [rentalConditionModal, setRentalConditionModal] = useState<{ isOpen: boolean; booking: T.RentalBooking | null; mode: 'checkOut' | 'checkIn' }>({ isOpen: false, booking: null, mode: 'checkOut' });
    const [rentalAgreementModal, setRentalAgreementModal] = useState<{ isOpen: boolean; booking: T.RentalBooking | null }>({ isOpen: false, booking: null });
    const [rentalReturnReportModal, setRentalReturnReportModal] = useState<{ isOpen: boolean; booking: T.RentalBooking | null }>({ isOpen: false, booking: null });

    // Sales Modals
    const [sorContractModal, setSorContractModal] = useState<{ isOpen: boolean; saleVehicle: T.SaleVehicle | null }>({ isOpen: false, saleVehicle: null });
    const [ownerStatementModal, setOwnerStatementModal] = useState<{ isOpen: boolean; saleVehicle: T.SaleVehicle | null }>({ isOpen: false, saleVehicle: null });
    const [internalStatementModal, setInternalStatementModal] = useState<{ isOpen: boolean; saleVehicle: T.SaleVehicle | null }>({ isOpen: false, saleVehicle: null });
    const [salesReportModal, setSalesReportModal] = useState(false);
    const [prospectModal, setProspectModal] = useState<{ isOpen: boolean; prospect: T.Prospect | null }>({ isOpen: false, prospect: null });

    // Estimate Modals
    const [estimateFormModal, setEstimateFormModal] = useState<{ isOpen: boolean; estimate: Partial<T.Estimate> | null }>({ isOpen: false, estimate: null });
    const [estimateViewModal, setEstimateViewModal] = useState<{ isOpen: boolean; estimate: T.Estimate | null }>({ isOpen: false, estimate: null });
    const [scheduleJobFromEstimateModal, setScheduleJobFromEstimateModal] = useState<{ isOpen: boolean; estimate: T.Estimate | null; inquiryId?: string }>({ isOpen: false, estimate: null });
    const [scheduleEmailModal, setScheduleEmailModal] = useState<{ isOpen: boolean; data: any }>({ isOpen: false, data: null });

    // Inquiry Modal
    const [inquiryModal, setInquiryModal] = useState<{ isOpen: boolean; inquiry: Partial<T.Inquiry> | null }>({ isOpen: false, inquiry: null });

    // Service Package Modal
    const [servicePackageFormModal, setServicePackageFormModal] = useState<{ isOpen: boolean; servicePackage: Partial<T.ServicePackage> | null }>({ isOpen: false, servicePackage: null });

    // Assistant
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [assistantContextJobId, setAssistantContextJobId] = useState<string | null>(null);

    // Business Logic Hooks
    const workshopActions = useWorkshopActions();

    // --- Automated Backup Logic ---
    const lastBackupTimeRef = useRef<string | null>(null);

    const getFullStateData = useCallback(() => {
        return {
            jobs, vehicles, customers, estimates, invoices, purchaseOrders, 
            purchases, parts, servicePackages, suppliers, engineers, lifts,
            rentalVehicles, rentalBookings, saleVehicles, saleOverheadPackages,
            prospects, storageBookings, storageLocations, batteryChargers,
            nominalCodes, nominalCodeRules, absenceRequests, inquiries, 
            reminders, auditLog, businessEntities, taxRates, roles, inspectionDiagrams, users
        };
    }, [
        jobs, vehicles, customers, estimates, invoices, purchaseOrders, 
        purchases, parts, servicePackages, suppliers, engineers, lifts,
        rentalVehicles, rentalBookings, saleVehicles, saleOverheadPackages,
        prospects, storageBookings, storageLocations, batteryChargers,
        nominalCodes, nominalCodeRules, absenceRequests, inquiries, 
        reminders, auditLog, businessEntities, taxRates, roles, inspectionDiagrams, users
    ]);

    const handleManualBackup = useCallback(() => {
        const backupData = createBackup(getFullStateData());
        downloadBackup(backupData);
    }, [getFullStateData]);

    const handleAutoBackup = useCallback(async () => {
        const backupData = createBackup(getFullStateData());
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        try {
            await setItem(`backup_auto_${timestamp}`, backupData);
            console.log(`Auto-backup successful: backup_auto_${timestamp}`);
            setConfirmation({
                isOpen: true,
                title: 'Automated Backup',
                message: 'A scheduled system backup has been successfully saved to the cloud database.',
                type: 'success'
            });
        } catch (e) {
            console.error("Auto-backup failed", e);
        }
    }, [getFullStateData, setConfirmation]);

    useEffect(() => {
        if (!backupSchedule.enabled) return;
        const checkBackupTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            if (backupSchedule.times.includes(timeString)) {
                if (lastBackupTimeRef.current !== timeString) {
                    handleAutoBackup();
                    lastBackupTimeRef.current = timeString;
                }
            }
        };
        const interval = setInterval(checkBackupTime, 15000);
        return () => clearInterval(interval);
    }, [backupSchedule, handleAutoBackup]);

    // --- Authentication Guard ---
    if (!isAuthenticated) {
        return <LoginView users={users} onLogin={login} environment={appEnvironment} />;
    }

    const handleSaveItem = workshopActions.handleSaveItem;
    const handleDeleteItem = <Type extends { id: string }>(setter: React.Dispatch<React.SetStateAction<Type[]>>, id: string) => {
        if(confirm('Are you sure you want to delete this item?')) {
            setter(prev => prev.filter(i => i.id !== id));
        }
    };

    const handleCustomerApproveEstimate = (estimate: T.Estimate, selectedOptionalItemIds: string[], dateRange: any, notes: string) => {
        if (estimate.jobId) { workshopActions.handleApproveEstimate(estimate, selectedOptionalItemIds, notes); return; }
        const customer = customers.find(c => c.id === estimate.customerId);
        const selectedOptionsList = (estimate.lineItems || []).filter(item => item.isOptional && selectedOptionalItemIds.includes(item.id)).map(item => `- ${item.description} (${(item.unitPrice * item.quantity).toFixed(2)})`).join('\n');
        const inquiryMessage = `ONLINE APPROVAL: Estimate #${estimate.estimateNumber}\n\n` + `Preferred Dates: ${dateRange?.start ? formatDate(new Date(dateRange.start)) : 'N/A'} to ${dateRange?.end ? formatDate(new Date(dateRange.end)) : 'N/A'}\n` + `Customer Notes: ${notes || 'None'}\n\n` + (selectedOptionsList ? `Selected Optional Extras:\n${selectedOptionsList}` : `No optional extras selected.`);
        const existingInquiry = inquiries.find(i => i.linkedEstimateId === estimate.id);
        if (existingInquiry) {
            const updatedInquiry = { ...existingInquiry, status: 'Approved' as const, message: existingInquiry.message + '\n\n' + inquiryMessage, actionNotes: (existingInquiry.actionNotes || '') + '\n[System]: Customer Approved Online. Action Required.' };
            handleSaveItem(setInquiries, updatedInquiry);
        } else {
            const newInquiry: T.Inquiry = { id: crypto.randomUUID(), entityId: estimate.entityId, createdAt: new Date().toISOString(), fromName: getCustomerDisplayName(customer), fromContact: customer?.email || customer?.mobile || "Client Portal", message: inquiryMessage, takenByUserId: 'system', status: 'Approved', linkedCustomerId: estimate.customerId, linkedVehicleId: estimate.vehicleId, linkedEstimateId: estimate.id, actionNotes: 'Auto-generated from Customer Estimate Approval. Please review dates and convert to Job.' };
            handleSaveItem(setInquiries, newInquiry);
        }
        const updatedEstimate: T.Estimate = { ...estimate, status: 'Approved' };
        handleSaveItem(setEstimates, updatedEstimate);
        setConfirmation({ isOpen: true, title: 'Request Received', message: 'Thank you. We have received your approval and preferred dates. A member of our team will review the schedule and confirm your booking shortly.', type: 'success' });
    };

    const handleCustomerDeclineEstimate = (estimate: T.Estimate) => {
        const updatedEstimate: T.Estimate = { ...estimate, status: 'Declined' };
        handleSaveItem(setEstimates, updatedEstimate);
        workshopActions.updateLinkedInquiryStatus(estimate.id, 'Rejected');
        setConfirmation({ isOpen: true, title: 'Estimate Declined', message: 'You have declined this estimate. We have been notified.', type: 'warning' });
    };

    const handleGenerateInvoice = (jobId: string) => {
        const job = jobs.find(j => j.id === jobId);
        if (!job) return;
        let lineItems: T.EstimateLineItem[] = [];
        if (job.estimateId) {
            const estimate = estimates.find(e => e.id === job.estimateId);
            if (estimate && estimate.lineItems) {
                lineItems = estimate.lineItems.map(item => ({ ...item, id: crypto.randomUUID() }));
            }
        }
        const newInvoice: Partial<T.Invoice> = {
            entityId: job.entityId, customerId: job.customerId, vehicleId: job.vehicleId, jobId: job.id,
            issueDate: formatDate(new Date()), dueDate: formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), status: 'Draft', lineItems: lineItems, createdByUserId: currentUser.id
        };
        setInvoiceFormModal({ isOpen: true, invoice: newInvoice as T.Invoice });
    };

    const handleMarkJobAsAwaitingCollection = (jobId: string) => {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, vehicleStatus: 'Awaiting Collection' } : j));
    };

    // Actions passed to views/components
    const commonProps = {
        onStartWork: (jobId: string, segmentId: string) => workshopActions.handleUpdateSegmentStatus(jobId, segmentId, 'In Progress'),
        onPause: (id: string, segId: string) => workshopActions.handleUpdateSegmentStatus(id, segId, 'Paused'),
        onRestartWork: (jobId: string, segmentId: string) => workshopActions.handleUpdateSegmentStatus(jobId, segmentId, 'In Progress'),
        onRestart: (jobId: string, segmentId: string) => workshopActions.handleUpdateSegmentStatus(jobId, segmentId, 'In Progress'),
        onEngineerComplete: (job: T.Job, segmentId: string) => workshopActions.handleUpdateSegmentStatus(job.id, segmentId, 'Engineer Complete', { engineerCompletedAt: new Date().toISOString() }),
        onQcApprove: workshopActions.handleQcApprove,
        onOpenAssistant: (id: string) => { setAssistantContextJobId(id); setIsAssistantOpen(true); },
        onEditJob: (id: string) => { setSelectedJobId(id); setIsEditJobModalOpen(true); },
    };

    const renderView = () => {
        switch (currentView) {
            case 'dashboard': return <DashboardView {...commonProps} onCheckIn={(id) => { const job = jobs.find(j => j.id === id); if(job) setCheckInJob(job); }} onOpenInquiry={(inq) => setInquiryModal({isOpen: true, inquiry: inq})} />;
            case 'dispatch': return <DispatchView setDefaultDateForModal={setSmartCreateDefaultDate} setIsSmartCreateOpen={setIsSmartCreateOpen} setSmartCreateMode={setSmartCreateMode} setSelectedJobId={setSelectedJobId} setIsEditModalOpen={setIsEditJobModalOpen} onOpenPurchaseOrder={(po) => setViewPoModal({isOpen: true, po})} onReassignEngineer={workshopActions.handleReassignEngineer} onCheckIn={(id) => { const job = jobs.find(j => j.id === id); if(job) setCheckInJob(job); }} onUnscheduleSegment={workshopActions.handleUnscheduleSegment} {...commonProps} />;
            case 'workflow': return <WorkflowView jobs={jobs} vehicles={vehicles} customers={customers} engineers={engineers} currentUser={currentUser} onGenerateInvoice={handleGenerateInvoice} {...commonProps} />;
            case 'jobs': return <JobsView onEditJob={(id) => { setSelectedJobId(id); setIsEditJobModalOpen(true); }} onSmartCreateClick={() => { setSmartCreateMode('job'); setIsSmartCreateOpen(true); }} />;
            case 'estimates': return <EstimatesView onOpenEstimateModal={(est) => setEstimateFormModal({isOpen: true, estimate: est})} onViewEstimate={(est) => setEstimateViewModal({isOpen: true, estimate: est})} onSmartCreateClick={() => { setSmartCreateMode('estimate'); setIsSmartCreateOpen(true); }} onOpenServicePackageModal={(pkg) => setServicePackageFormModal({ isOpen: true, servicePackage: pkg })} />;
            case 'invoices': return <InvoicesView onViewInvoice={(inv) => setViewInvoiceModal({isOpen: true, invoice: inv})} onEditInvoice={(inv) => setInvoiceFormModal({isOpen: true, invoice: inv})} onOpenExportModal={(type, items) => setExportModal({isOpen: true, type, items})} onCreateAdhocInvoice={() => setInvoiceFormModal({isOpen: true, invoice: { createdByUserId: currentUser.id } as any})} />;
            case 'purchaseOrders': return <PurchaseOrdersView onOpenPurchaseOrderModal={(po) => setPoModal({isOpen: true, po})} onViewPurchaseOrder={(po) => setViewPoModal({isOpen: true, po})} onDeletePurchaseOrder={(id) => handleDeleteItem(setPurchaseOrders, id)} onExport={() => {}} onOpenBatchAddModal={() => setBatchPoModalOpen(true)} />;
            case 'sales': return <SalesView entity={businessEntities.find(e => e.id === selectedEntityId)!} onManageSaleVehicle={(sv) => setSorContractModal({isOpen: false, saleVehicle: null}) /* Placeholder for future better manage modal */ } onAddSaleVehicle={() => {}} onGenerateReport={() => setSalesReportModal(true)} onAddProspect={() => setProspectModal({isOpen: true, prospect: null})} onEditProspect={(p) => setProspectModal({isOpen: true, prospect: p})} onViewCustomer={() => {}} />;
            case 'storage': return <StorageView entity={businessEntities.find(e => e.id === selectedEntityId)!} onSaveBooking={(b) => handleSaveItem(setStorageBookings, b)} onBookOutVehicle={() => {}} onViewInvoice={(id) => { const inv = invoices.find(i => i.id === id); if(inv) setViewInvoiceModal({isOpen: true, invoice: inv}); }} onAddCustomerAndVehicle={(c, v) => { handleSaveItem(data.setCustomers, c); handleSaveItem(data.setVehicles, v); }} onSaveInvoice={(inv) => handleSaveItem(setInvoices, inv)} setConfirmation={setConfirmation} setViewedInvoice={(inv) => setViewInvoiceModal({isOpen: true, invoice: inv})} />;
            case 'rentals': return <RentalsView entity={businessEntities.find(e => e.id === selectedEntityId)!} onOpenRentalBooking={(b) => setRentalBookingModal({isOpen: true, booking: b})} />;
            case 'concierge': return <ConciergeView onCheckIn={(id) => { const job = jobs.find(j => j.id === id); if(job) setCheckInJob(job); }} onOpenPurchaseOrder={(po) => setViewPoModal({isOpen: true, po})} onGenerateInvoice={handleGenerateInvoice} onCollect={(id) => { const job = jobs.find(j => j.id === id); if(job) setCheckOutJob(job); }} {...commonProps} />;
            case 'communications': return <CommunicationsView />;
            case 'absence': return <AbsenceView currentUser={currentUser} users={users} absenceRequests={absenceRequests} setAbsenceRequests={setAbsenceRequests} />;
            case 'inquiries': return <InquiriesView onOpenInquiryModal={(inq) => setInquiryModal({isOpen: true, inquiry: inq})} onConvert={() => {}} onViewEstimate={(est) => setEstimateViewModal({isOpen: true, estimate: est})} onScheduleEstimate={(est, inquiryId) => setScheduleJobFromEstimateModal({isOpen: true, estimate: est, inquiryId})} onOpenPurchaseOrder={(po) => setViewPoModal({isOpen: true, po})} onEditEstimate={(est) => setEstimateFormModal({isOpen: true, estimate: est})} />;
            default: return <DashboardView {...commonProps} onCheckIn={() => {}} onOpenInquiry={() => {}} />;
        }
    };

    // Prepare state for AppModals
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

    // Actions passed to AppModals to handle saves
    const modalActions = {
        handleSaveItem,
        setCustomers: data.setCustomers,
        setVehicles: data.setVehicles,
        handleSavePurchaseOrder: workshopActions.handleSavePurchaseOrder,
        handleSaveEstimate: workshopActions.handleSaveEstimate,
        handleApproveEstimate: workshopActions.handleApproveEstimate,
        handleCustomerApproveEstimate,
        handleCustomerDeclineEstimate,
        updateLinkedInquiryStatus: workshopActions.updateLinkedInquiryStatus,
        handleMarkJobAsAwaitingCollection
    };

    return (
        <ToastProvider>
        <MainLayout onOpenManagement={() => setIsManagementOpen(true)}>
   
            {renderView()}

            <AppModals 
                modals={modalsState} 
                setters={setters} 
                actions={modalActions} 
            />

            <ManagementModal 
                isOpen={isManagementOpen} 
                onClose={() => setIsManagementOpen(false)} 
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