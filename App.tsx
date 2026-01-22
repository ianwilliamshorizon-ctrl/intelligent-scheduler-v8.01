import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import * as T from './types';
import { useData } from './core/state/DataContext';
import { useApp } from './core/state/AppContext';
import { formatCurrency } from './utils/formatUtils';
import { formatDate, splitJobIntoSegments, addDays } from './core/utils/dateUtils';
import { generateJobId, generatePurchaseOrderId } from './core/utils/numberGenerators';
import { getCustomerDisplayName } from './core/utils/customerUtils';
import { calculateJobStatus } from './core/utils/jobUtils';
import { createBackup, downloadBackup } from './utils/backupUtils';
import { setItem } from './core/db';
import { LayoutDashboard, Calendar, Wrench, FileText, ShoppingCart, Truck, MessageSquare, Menu, Settings, LogOut, Phone, UserCheck, CalendarDays, Package, Briefcase, Car, Building2, Archive } from 'lucide-react';

// View Components
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

// Modals
import ManagementModal from './components/ManagementModal';
import SmartCreateJobModal from './components/SmartCreateJobModal';
import EditJobModal from './components/EditJobModal';
import ConfirmationModal from './components/ConfirmationModal';
import PurchaseOrderFormModal from './components/PurchaseOrderFormModal';
import BatchAddPurchasesModal from './components/BatchAddPurchasesModal';
import PurchaseOrderViewModal from './components/PurchaseOrderViewModal';
import InvoiceFormModal from './components/InvoiceFormModal';
import InvoiceModal from './components/InvoiceModal';
import SalesInvoiceModal from './components/SalesInvoiceModal';
import RentalBookingModal from './components/RentalBookingModal';
import RentalAgreementModal from './components/RentalAgreementModal';
import RentalCheckInCheckOutModal from './components/RentalCheckInCheckOutModal';
import RentalCheckInReportModal from './components/RentalCheckInReportModal';
import SORContractModal from './components/SORContractModal';
import OwnerStatementModal from './components/OwnerStatementModal';
import InternalSaleStatementModal from './components/InternalSaleStatementModal';
import SalesSummaryReportModal from './components/SalesSummaryReportModal';
import ProspectFormModal from './components/ProspectFormModal';
import InquiryFormModal from './components/InquiryFormModal';
import LiveAssistant from './components/LiveAssistant';
import ScheduleJobFromEstimateModal from './components/ScheduleJobFromEstimateModal';
import ScheduleConfirmationEmailModal from './components/ScheduleConfirmationEmailModal';
import NominalCodeExportModal from './components/NominalCodeExportModal';
import CheckInModal from './components/CheckInModal';
import CheckOutModal from './components/CheckOutModal';
import EstimateFormModal from './components/EstimateFormModal';
import EstimateViewModal from './components/EstimateViewModal';
import LoginView from './components/LoginView';

const App = () => {
    const { 
        currentView, setCurrentView, 
        currentUser, setCurrentUser, 
        selectedEntityId, setSelectedEntityId, 
        confirmation, setConfirmation,
        users,
        filteredBusinessEntities,
        isAuthenticated, login, logout,
        backupSchedule, setBackupSchedule,
        appEnvironment
    } = useApp();

    const data = useData();
    const { 
        jobs, setJobs, estimates, setEstimates, 
        inquiries, setInquiries, 
        businessEntities, absenceRequests, setAbsenceRequests,
        customers, vehicles, purchaseOrders, setPurchaseOrders,
        invoices, setInvoices, purchases, setPurchases,
        rentalBookings, setRentalBookings, rentalVehicles,
        saleVehicles, setSaleVehicles, prospects, setProspects,
        storageBookings, setStorageBookings, suppliers, parts, setParts,
        servicePackages, taxRates, nominalCodes, nominalCodeRules, roles,
        saleOverheadPackages, storageLocations, batteryChargers, reminders, auditLog, inspectionDiagrams, engineers, lifts
    } = data;

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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

    // Assistant
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [assistantContextJobId, setAssistantContextJobId] = useState<string | null>(null);

    // --- Automated Backup Logic ---
    const lastBackupTimeRef = useRef<string | null>(null);

    // Helper to gather all data state for backup
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
                // Prevent multiple backups within the same minute
                if (lastBackupTimeRef.current !== timeString) {
                    handleAutoBackup();
                    lastBackupTimeRef.current = timeString;
                }
            }
        };

        const interval = setInterval(checkBackupTime, 15000); // Check every 15 seconds
        return () => clearInterval(interval);
    }, [backupSchedule, handleAutoBackup]);

    // --- Authentication Guard ---
    if (!isAuthenticated) {
        return <LoginView users={users} onLogin={login} environment={appEnvironment} />;
    }

    const handleSaveItem = <Type extends { id: string }>(setter: React.Dispatch<React.SetStateAction<Type[]>>, item: Type) => {
        setter(prev => {
            const index = prev.findIndex(i => i.id === item.id);
            if (index >= 0) {
                const newArr = [...prev];
                newArr[index] = item;
                return newArr;
            }
            return [...prev, item];
        });
    };

    const handleDeleteItem = <Type extends { id: string }>(setter: React.Dispatch<React.SetStateAction<Type[]>>, id: string) => {
        if(confirm('Are you sure you want to delete this item?')) {
            setter(prev => prev.filter(i => i.id !== id));
        }
    };
    
    // ... (rest of the component helper functions like handleSaveEstimate, handleSavePurchaseOrder, etc. remain unchanged)
    const updateLinkedInquiryStatus = (estimateId: string, newStatus: T.Inquiry['status'], extraUpdates: Partial<T.Inquiry> = {}) => {
        setInquiries(prev => prev.map(inq => {
            if (inq.linkedEstimateId === estimateId && inq.status !== 'Closed') {
                return { ...inq, status: newStatus, ...extraUpdates };
            }
            return inq;
        }));
    };
    
    const handleSaveEstimate = (estimate: T.Estimate) => {
        const isNew = !estimates.some(e => e.id === estimate.id);
        handleSaveItem(setEstimates, estimate);
        if (estimate.status === 'Sent') updateLinkedInquiryStatus(estimate.id, 'Sent');
        if (isNew && estimate.jobId) {
             const newInquiry: T.Inquiry = {
                id: crypto.randomUUID(),
                entityId: estimate.entityId,
                createdAt: new Date().toISOString(),
                fromName: `Workshop (${currentUser.name})`,
                fromContact: 'Internal',
                message: `Supplementary Estimate #${estimate.estimateNumber} created for Job #${estimate.jobId}. Please review and send to customer.`,
                takenByUserId: currentUser.id,
                status: 'Open',
                linkedCustomerId: estimate.customerId,
                linkedVehicleId: estimate.vehicleId,
                linkedEstimateId: estimate.id,
                actionNotes: 'Auto-generated from workshop.',
            };
            handleSaveItem(setInquiries, newInquiry);
            setConfirmation({ isOpen: true, title: 'Sent to Inquiries', message: `Supplementary Estimate #${estimate.estimateNumber} has been created and sent to the Inquiries queue for review.`, type: 'success' });
        }
    };
    
    const handleSavePurchaseOrder = (po: T.PurchaseOrder) => {
        const poToSave = {
            ...po,
            createdByUserId: po.createdByUserId || currentUser.id
        };
        handleSaveItem(setPurchaseOrders, poToSave);
        if (po.jobId) {
            const job = jobs.find(j => j.id === po.jobId);
            if (job) {
                const otherJobPOs = purchaseOrders.filter(p => p.jobId === job.id && p.id !== po.id);
                const allJobPOs = [...otherJobPOs, poToSave];
                let newPartsStatus: T.Job['partsStatus'] = job.partsStatus;
                if (allJobPOs.length > 0) {
                     if (allJobPOs.every(p => p.status === 'Received')) newPartsStatus = 'Fully Received';
                     else if (allJobPOs.some(p => p.status === 'Partially Received' || p.status === 'Received')) newPartsStatus = 'Partially Received';
                     else if (allJobPOs.some(p => p.status === 'Ordered')) newPartsStatus = 'Ordered';
                     else newPartsStatus = 'Awaiting Order';
                }
                const needsIdLink = !job.purchaseOrderIds?.includes(po.id);
                if (newPartsStatus !== job.partsStatus || needsIdLink) {
                    const updatedJob = { ...job, partsStatus: newPartsStatus, purchaseOrderIds: needsIdLink ? [...(job.purchaseOrderIds || []), po.id] : job.purchaseOrderIds };
                    handleSaveItem(setJobs, updatedJob);
                }
            }
        }
        setInquiries(prev => prev.map(inq => {
            const isLinkedToPO = inq.linkedPurchaseOrderIds?.includes(po.id);
            if (isLinkedToPO) {
                const otherInqPos = purchaseOrders.filter(p => inq.linkedPurchaseOrderIds?.includes(p.id) && p.id !== po.id);
                const allInqPos = [...otherInqPos, po];
                const allOrderedOrBetter = allInqPos.every(p => ['Ordered', 'Partially Received', 'Received'].includes(p.status));
                if (allOrderedOrBetter && inq.status !== 'Closed') {
                    return { ...inq, status: 'Closed', actionNotes: (inq.actionNotes || '') + `\n[System]: All parts ordered. Inquiry closed.` };
                }
            }
            return inq;
        }));
    };

    const handleApproveEstimate = (estimate: T.Estimate, selectedOptionalItemIds: string[], notes?: string, scheduledDate?: string) => {
        const explicitItemIds = new Set((estimate.lineItems || []).filter(li => !li.isOptional || selectedOptionalItemIds.includes(li.id)).map(i => i.id));
        const allIncludedIds = new Set(explicitItemIds);
        (estimate.lineItems || []).forEach(item => {
            if (item.isPackageComponent && item.servicePackageId) {
                const header = (estimate.lineItems || []).find(h => h.servicePackageId === item.servicePackageId && !h.isPackageComponent);
                if (header && explicitItemIds.has(header.id)) allIncludedIds.add(item.id);
            }
        });
        const activeLineItems = (estimate.lineItems || []).filter(li => allIncludedIds.has(li.id));
        const approvedLineItems = activeLineItems.map(li => ({ ...li, isOptional: false }));
        let updatedEstimate: T.Estimate = { ...estimate, lineItems: approvedLineItems, status: 'Approved', notes: notes ? `${estimate.notes || ''}\n${notes}` : estimate.notes };

        if (estimate.jobId && !scheduledDate) {
             const existingJob = jobs.find(j => j.id === estimate.jobId);
             if (existingJob) {
                 const partItems = approvedLineItems.filter(li => !li.isLabor && li.partId);
                 const newPOs: T.PurchaseOrder[] = [];
                 const newPurchaseOrderIds: string[] = [];
                 if (partItems.length > 0) {
                     const partsBySupplier: Record<string, T.EstimateLineItem[]> = {};
                     partItems.forEach(item => {
                         const partDef = parts.find(p => p.id === item.partId);
                         const supplierId = partDef?.defaultSupplierId || 'no_supplier';
                         if (!partsBySupplier[supplierId]) partsBySupplier[supplierId] = [];
                         partsBySupplier[supplierId].push(item);
                     });
                     const entity = businessEntities.find(e => e.id === existingJob.entityId);
                     const entityShortCode = entity?.shortCode || 'UNK';
                     let currentPOsForIdGen = [...purchaseOrders];
                     Object.entries(partsBySupplier).forEach(([supplierId, items]) => {
                         const newPOId = generatePurchaseOrderId(currentPOsForIdGen, entityShortCode);
                         const vehicle = vehicles.find(v => v.id === existingJob.vehicleId);
                         const newPO: T.PurchaseOrder = {
                             id: newPOId, entityId: existingJob.entityId, supplierId: supplierId === 'no_supplier' ? null : supplierId, vehicleRegistrationRef: vehicle?.registration || 'N/A',
                             orderDate: formatDate(new Date()), status: 'Draft', jobId: existingJob.id, createdByUserId: currentUser.id,
                             lineItems: items.map(item => ({ id: crypto.randomUUID(), partNumber: item.partNumber, description: item.description, quantity: item.quantity, receivedQuantity: 0, unitPrice: item.unitCost || 0, taxCodeId: item.taxCodeId }))
                         };
                         newPOs.push(newPO); newPurchaseOrderIds.push(newPOId); currentPOsForIdGen.push(newPO);
                     });
                 }
                 let jobUpdates: Partial<T.Job> = {};
                 if (newPOs.length > 0) {
                     const allPOIds = [...(existingJob.purchaseOrderIds || []), ...newPurchaseOrderIds];
                     jobUpdates.purchaseOrderIds = allPOIds; jobUpdates.partsStatus = 'Awaiting Order'; 
                 }
                 const additionalHours = approvedLineItems.filter(li => li.isLabor).reduce((sum, i) => sum + i.quantity, 0);
                 if (additionalHours > 0) jobUpdates.estimatedHours = (existingJob.estimatedHours || 0) + additionalHours;
                 
                 if (existingJob.estimateId && existingJob.estimateId !== estimate.id) {
                     const mainEstimate = estimates.find(e => e.id === existingJob.estimateId);
                     if (mainEstimate) {
                         const mergedItems = [...(mainEstimate.lineItems || []), ...approvedLineItems];
                         const updatedMainEstimate = { ...mainEstimate, lineItems: mergedItems };
                         handleSaveItem(setEstimates, updatedMainEstimate);
                         updatedEstimate.notes = (updatedEstimate.notes || '') + ' [Merged into Job Estimate]';
                     }
                 } else if (!existingJob.estimateId) {
                     jobUpdates.estimateId = estimate.id;
                 }
                 if (Object.keys(jobUpdates).length > 0) {
                     const updatedJob = { ...existingJob, ...jobUpdates };
                     handleSaveItem(setJobs, updatedJob);
                 }
                 newPOs.forEach(po => handleSaveItem(setPurchaseOrders, po));

                 const existingInquiry = inquiries.find(i => i.linkedEstimateId === estimate.id);
                 if (existingInquiry) {
                     const updatedInquiry = { ...existingInquiry, status: 'Approved' as const, linkedPurchaseOrderIds: [...(existingInquiry.linkedPurchaseOrderIds || []), ...newPurchaseOrderIds], actionNotes: (existingInquiry.actionNotes || '') + '\n[System]: Supplementary Estimate Approved. Parts ordered/work authorized.' };
                     handleSaveItem(setInquiries, updatedInquiry);
                 } else {
                     const progressInquiry: T.Inquiry = { id: crypto.randomUUID(), entityId: estimate.entityId, createdAt: new Date().toISOString(), fromName: 'System (Supplementary Approval)', fromContact: 'Internal', message: `Supplementary Estimate #${estimate.estimateNumber} Approved for Job #${existingJob.id}. Parts ordered/work authorized.`, takenByUserId: currentUser.id, status: 'Approved', linkedCustomerId: estimate.customerId, linkedVehicleId: estimate.vehicleId, linkedJobId: existingJob.id, linkedEstimateId: estimate.id, linkedPurchaseOrderIds: newPurchaseOrderIds, actionNotes: 'Auto-generated upon supplementary estimate approval.' };
                     handleSaveItem(setInquiries, progressInquiry);
                 }
                 updatedEstimate.status = 'Closed'; 
                 setConfirmation({ isOpen: true, title: 'Supplementary Work Approved', message: `Job #${existingJob.id} updated. ${newPOs.length} new Purchase Order(s) created and tracking card added to Inquiries.`, type: 'success' });
             }
        }
        else if (scheduledDate) {
             const entity = businessEntities.find(e => e.id === estimate.entityId);
             const laborItems = approvedLineItems.filter(li => li.isLabor);
             const totalHours = laborItems.reduce((acc, i) => acc + i.quantity, 0);
             const partItems = approvedLineItems.filter(li => !li.isLabor && li.partId);
             const newPOs: T.PurchaseOrder[] = [];
             const newPurchaseOrderIds: string[] = [];

             if (partItems.length > 0) {
                 const partsBySupplier: Record<string, T.EstimateLineItem[]> = {};
                 partItems.forEach(item => {
                     const partDef = parts.find(p => p.id === item.partId);
                     const supplierId = partDef?.defaultSupplierId || 'no_supplier';
                     if (!partsBySupplier[supplierId]) partsBySupplier[supplierId] = [];
                     partsBySupplier[supplierId].push(item);
                 });
                 let currentPOsForIdGen = [...purchaseOrders];
                 const entityShortCode = entity?.shortCode || 'UNK';
                 Object.entries(partsBySupplier).forEach(([supplierId, items]) => {
                     const newPOId = generatePurchaseOrderId(currentPOsForIdGen, entityShortCode);
                     const vehicle = vehicles.find(v => v.id === estimate.vehicleId);
                     const newPO: T.PurchaseOrder = { id: newPOId, entityId: estimate.entityId, supplierId: supplierId === 'no_supplier' ? null : supplierId, vehicleRegistrationRef: vehicle?.registration || 'N/A', orderDate: formatDate(new Date()), status: 'Draft', jobId: null, createdByUserId: currentUser.id, lineItems: items.map(item => ({ id: crypto.randomUUID(), partNumber: item.partNumber, description: item.description, quantity: item.quantity, receivedQuantity: 0, unitPrice: item.unitCost || 0, taxCodeId: item.taxCodeId })) };
                     newPOs.push(newPO); newPurchaseOrderIds.push(newPOId); currentPOsForIdGen.push(newPO);
                 });
             }
             const newJobId = generateJobId(jobs, entity?.shortCode || 'UNK');
             newPOs.forEach(po => po.jobId = newJobId);
             const newJob: T.Job = { id: newJobId, entityId: estimate.entityId, vehicleId: estimate.vehicleId, customerId: estimate.customerId, description: `Work from Est #${estimate.estimateNumber}`, estimatedHours: Math.max(1, totalHours), scheduledDate: scheduledDate, status: 'Unallocated', createdAt: formatDate(new Date()), createdByUserId: currentUser.id, segments: [], estimateId: estimate.id, notes: notes || estimate.notes, vehicleStatus: 'Awaiting Arrival', partsStatus: newPOs.length > 0 ? 'Awaiting Order' : 'Not Required', purchaseOrderIds: newPurchaseOrderIds.length > 0 ? newPurchaseOrderIds : undefined };
             newJob.segments = splitJobIntoSegments(newJob);
             handleSaveItem(setJobs, newJob);
             newPOs.forEach(po => handleSaveItem(setPurchaseOrders, po));
             updatedEstimate = { ...updatedEstimate, status: 'Converted to Job', jobId: newJob.id };
             const existingInquiry = inquiries.find(i => i.linkedEstimateId === estimate.id);
             if (existingInquiry) {
                  const status = newPOs.length > 0 ? 'Approved' : 'Closed';
                  const updatedInquiry = { ...existingInquiry, status: status as any, linkedJobId: newJob.id, linkedPurchaseOrderIds: [...(existingInquiry.linkedPurchaseOrderIds || []), ...newPurchaseOrderIds], actionNotes: (existingInquiry.actionNotes || '') + `\n[System]: Job Scheduled. ${newPOs.length} Purchase Orders generated.` };
                 handleSaveItem(setInquiries, updatedInquiry);
             }
             setConfirmation({ isOpen: true, title: 'Job Created', message: `Job #${newJob.id} created for ${scheduledDate}. ${newPOs.length > 0 ? `${newPOs.length} Purchase Order(s) generated.` : ''}`, type: 'success' });
        } else {
             setConfirmation({ isOpen: true, title: 'Estimate Approved', message: 'Estimate has been marked as approved.', type: 'success' });
            updateLinkedInquiryStatus(estimate.id, 'Approved');
        }
        handleSaveItem(setEstimates, updatedEstimate);
    };

    const handleCustomerApproveEstimate = (estimate: T.Estimate, selectedOptionalItemIds: string[], dateRange: any, notes: string) => {
        if (estimate.jobId) { handleApproveEstimate(estimate, selectedOptionalItemIds, notes); return; }
        const customer = customers.find(c => c.id === estimate.customerId);
        const selectedOptionsList = (estimate.lineItems || []).filter(item => item.isOptional && selectedOptionalItemIds.includes(item.id)).map(item => `- ${item.description} (${formatCurrency(item.unitPrice * item.quantity)})`).join('\n');
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
        updateLinkedInquiryStatus(estimate.id, 'Rejected');
        setConfirmation({ isOpen: true, title: 'Estimate Declined', message: 'You have declined this estimate. We have been notified.', type: 'warning' });
    };

    // --- Job Segment Control Handlers ---
    const handleUpdateSegmentStatus = (jobId: string, segmentId: string, newStatus: T.JobSegment['status'], extraUpdates: Partial<T.JobSegment> = {}) => {
        setJobs(prev => prev.map(job => {
            if (job.id === jobId) {
                const newSegments = job.segments.map(s => s.segmentId === segmentId ? { ...s, status: newStatus, ...extraUpdates } : s);
                return { ...job, segments: newSegments, status: calculateJobStatus(newSegments) };
            }
            return job;
        }));
    };
    const handleStartWork = (jobId: string, segmentId: string) => handleUpdateSegmentStatus(jobId, segmentId, 'In Progress');
    const handlePauseWork = (jobId: string, segmentId: string) => handleUpdateSegmentStatus(jobId, segmentId, 'Paused');
    const handleRestartWork = (jobId: string, segmentId: string) => handleUpdateSegmentStatus(jobId, segmentId, 'In Progress');
    const handleEngineerComplete = (job: T.Job, segmentId: string) => handleUpdateSegmentStatus(job.id, segmentId, 'Engineer Complete', { engineerCompletedAt: new Date().toISOString() });
    const handleQcApprove = (jobId: string) => {
        setJobs(prev => prev.map(job => {
            if (job.id === jobId) {
                const newSegments = job.segments.map(s => s.status === 'Engineer Complete' ? { ...s, status: 'QC Complete' as const, qcCompletedAt: new Date().toISOString(), qcCompletedByUserId: currentUser.id } : s);
                return { ...job, segments: newSegments, status: 'Complete' as const };
            }
            return job;
        }));
    };
    const handleReassignEngineer = (jobId: string, segmentId: string, newEngineerId: string) => {
        setJobs(prev => prev.map(job => {
             if (job.id === jobId) {
                 const newSegments = job.segments.map(s => s.segmentId === segmentId ? { ...s, engineerId: newEngineerId } : s);
                 return { ...job, segments: newSegments };
             }
             return job;
        }));
    };
    const handleUnscheduleSegment = (jobId: string, segmentId: string) => {
        setJobs(prev => prev.map(job => {
            if (job.id === jobId) {
                const newSegments = job.segments.map(s => s.segmentId === segmentId ? { ...s, status: 'Unallocated' as const, allocatedLift: null, scheduledStartSegment: null, engineerId: null } : s);
                return { ...job, segments: newSegments, status: calculateJobStatus(newSegments) };
            }
            return job;
        }));
    }

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
            issueDate: formatDate(new Date()), dueDate: formatDate(addDays(new Date(), 30)), status: 'Draft', lineItems: lineItems, createdByUserId: currentUser.id
        };
        setInvoiceFormModal({ isOpen: true, invoice: newInvoice as T.Invoice });
    };

    const handleMarkJobAsAwaitingCollection = (jobId: string) => {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, vehicleStatus: 'Awaiting Collection' } : j));
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'dispatch', label: 'Dispatch', icon: Calendar },
        { id: 'concierge', label: 'Service Stream', icon: Wrench },
        { id: 'jobs', label: 'Jobs', icon: Briefcase },
        { id: 'estimates', label: 'Estimates', icon: FileText },
        { id: 'invoices', label: 'Invoices', icon: FileText },
        { id: 'purchaseOrders', label: 'Purchase Orders', icon: ShoppingCart },
        { id: 'sales', label: 'Car Sales', icon: Car },
        { id: 'storage', label: 'Vehicle Storage', icon: Archive },
        { id: 'rentals', label: 'Rentals', icon: Truck },
        { id: 'communications', label: 'Comms', icon: MessageSquare },
        { id: 'inquiries', label: 'Inquiries', icon: Phone },
        { id: 'absence', label: 'Absence', icon: CalendarDays },
    ];

    const userRoleDef = roles.find(r => r.name === currentUser.role);
    const allowedViews = currentUser.allowedViews || userRoleDef?.defaultAllowedViews || [];

    const commonProps = {
        onStartWork: handleStartWork,
        onPause: (id: string, segId: string, reason?: string) => handlePauseWork(id, segId),
        onRestartWork: handleRestartWork,
        onRestart: handleRestartWork,
        onEngineerComplete: handleEngineerComplete,
        onQcApprove: handleQcApprove,
        onOpenAssistant: (id: string) => { setAssistantContextJobId(id); setIsAssistantOpen(true); },
        onEditJob: (id: string) => { setSelectedJobId(id); setIsEditJobModalOpen(true); },
    };

    const renderView = () => {
        switch (currentView) {
            case 'dashboard': return <DashboardView {...commonProps} onCheckIn={(id) => { const job = jobs.find(j => j.id === id); if(job) setCheckInJob(job); }} onOpenInquiry={(inq) => setInquiryModal({isOpen: true, inquiry: inq})} />;
            case 'dispatch': return <DispatchView setDefaultDateForModal={setSmartCreateDefaultDate} setIsSmartCreateOpen={setIsSmartCreateOpen} setSmartCreateMode={setSmartCreateMode} setSelectedJobId={setSelectedJobId} setIsEditModalOpen={setIsEditJobModalOpen} onOpenPurchaseOrder={(po) => setViewPoModal({isOpen: true, po})} onReassignEngineer={handleReassignEngineer} onCheckIn={(id) => { const job = jobs.find(j => j.id === id); if(job) setCheckInJob(job); }} onUnscheduleSegment={handleUnscheduleSegment} {...commonProps} />;
            case 'workflow': return <WorkflowView jobs={jobs} vehicles={vehicles} customers={customers} engineers={engineers} currentUser={currentUser} onGenerateInvoice={handleGenerateInvoice} {...commonProps} />;
            case 'jobs': return <JobsView onEditJob={(id) => { setSelectedJobId(id); setIsEditJobModalOpen(true); }} onSmartCreateClick={() => { setSmartCreateMode('job'); setIsSmartCreateOpen(true); }} />;
            case 'estimates': return <EstimatesView onOpenEstimateModal={(est) => setEstimateFormModal({isOpen: true, estimate: est})} onViewEstimate={(est) => setEstimateViewModal({isOpen: true, estimate: est})} onSmartCreateClick={() => { setSmartCreateMode('estimate'); setIsSmartCreateOpen(true); }} />;
            case 'invoices': return <InvoicesView onViewInvoice={(inv) => setViewInvoiceModal({isOpen: true, invoice: inv})} onEditInvoice={(inv) => setInvoiceFormModal({isOpen: true, invoice: inv})} onOpenExportModal={(type, items) => setExportModal({isOpen: true, type, items})} onCreateAdhocInvoice={() => setInvoiceFormModal({isOpen: true, invoice: { createdByUserId: currentUser.id } as any})} />;
            case 'purchaseOrders': return <PurchaseOrdersView onOpenPurchaseOrderModal={(po) => setPoModal({isOpen: true, po})} onViewPurchaseOrder={(po) => setViewPoModal({isOpen: true, po})} onDeletePurchaseOrder={(id) => handleDeleteItem(setPurchaseOrders, id)} onExport={() => {}} onOpenBatchAddModal={() => setBatchPoModalOpen(true)} />;
            case 'sales': return <SalesView entity={businessEntities.find(e => e.id === selectedEntityId)!} onManageSaleVehicle={(sv) => setSorContractModal({isOpen: false, saleVehicle: null}) /* Placeholder */ } onAddSaleVehicle={() => {}} onGenerateReport={() => setSalesReportModal(true)} onAddProspect={() => setProspectModal({isOpen: true, prospect: null})} onEditProspect={(p) => setProspectModal({isOpen: true, prospect: p})} onViewCustomer={() => {}} />;
            case 'storage': return <StorageView entity={businessEntities.find(e => e.id === selectedEntityId)!} onSaveBooking={(b) => handleSaveItem(setStorageBookings, b)} onBookOutVehicle={() => {}} onViewInvoice={(id) => { const inv = invoices.find(i => i.id === id); if(inv) setViewInvoiceModal({isOpen: true, invoice: inv}); }} onAddCustomerAndVehicle={(c, v) => { handleSaveItem(data.setCustomers, c); handleSaveItem(data.setVehicles, v); }} onSaveInvoice={(inv) => handleSaveItem(setInvoices, inv)} setConfirmation={setConfirmation} setViewedInvoice={(inv) => setViewInvoiceModal({isOpen: true, invoice: inv})} />;
            case 'rentals': return <RentalsView entity={businessEntities.find(e => e.id === selectedEntityId)!} onOpenRentalBooking={(b) => setRentalBookingModal({isOpen: true, booking: b})} />;
            case 'concierge': return <ConciergeView onCheckIn={(id) => { const job = jobs.find(j => j.id === id); if(job) setCheckInJob(job); }} onOpenPurchaseOrder={(po) => setViewPoModal({isOpen: true, po})} onGenerateInvoice={handleGenerateInvoice} onCollect={(id) => { const job = jobs.find(j => j.id === id); if(job) setCheckOutJob(job); }} {...commonProps} />;
            case 'communications': return <CommunicationsView />;
            case 'absence': return <AbsenceView currentUser={currentUser} users={users} absenceRequests={absenceRequests} setAbsenceRequests={setAbsenceRequests} />;
            case 'inquiries': return <InquiriesView onOpenInquiryModal={(inq) => setInquiryModal({isOpen: true, inquiry: inq})} onConvert={() => {}} onViewEstimate={(est) => setEstimateViewModal({isOpen: true, estimate: est})} onScheduleEstimate={(est, inquiryId) => setScheduleJobFromEstimateModal({isOpen: true, estimate: est, inquiryId})} onOpenPurchaseOrder={(po) => setViewPoModal({isOpen: true, po})} onEditEstimate={(est) => setEstimateFormModal({isOpen: true, estimate: est})} />;
            default: return <DashboardView {...commonProps} onCheckIn={() => {}} onOpenInquiry={() => {}} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 font-sans text-gray-900">
            {/* Sidebar */}
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col flex-shrink-0 z-20`}>
                <div className="p-4 flex items-center justify-between">
                    {isSidebarOpen && <span className="font-bold text-xl tracking-tight">BROOKSPEED</span>}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 rounded hover:bg-slate-800">
                        <Menu size={20} />
                    </button>
                </div>
                
                <nav className="flex-grow overflow-y-auto py-4">
                    <div className="px-2 space-y-1">
                        {navItems.filter(item => allowedViews.includes(item.id as T.ViewType) || currentUser.role === 'Admin').map(item => (
                            <button 
                                key={item.id}
                                onClick={() => setCurrentView(item.id as T.ViewType)} 
                                className={`w-full flex items-center p-2 rounded-lg transition-colors ${currentView === item.id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                            >
                                <item.icon size={20} className="min-w-[20px]" />
                                {isSidebarOpen && <span className="ml-3">{item.label}</span>}
                            </button>
                        ))}
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-grow flex flex-col h-full overflow-hidden">
                {/* Global Top Bar */}
                <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 flex-shrink-0 z-10 shadow-sm">
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                             <Building2 size={18} className="text-indigo-600" />
                             <select 
                                value={selectedEntityId} 
                                onChange={(e) => setSelectedEntityId(e.target.value)}
                                className="border-none bg-transparent font-semibold text-gray-700 focus:ring-0 cursor-pointer outline-none hover:text-indigo-700 transition-colors"
                                title="Select Business Entity"
                             >
                                <option value="all">All Entities</option>
                                {filteredBusinessEntities.map(e => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                             </select>
                        </div>
                     </div>

                     <div className="flex items-center gap-4">
                         <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <UserCheck size={16} />
                                <span className="font-medium">{currentUser.name}</span>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{currentUser.role}</span>
                            </div>
                            <button 
                                onClick={logout}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                title="Log Out"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>

                         {currentUser.role === 'Admin' && (
                             <button 
                                onClick={() => setIsManagementOpen(true)} 
                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                title="Global Settings"
                            >
                                 <Settings size={20} />
                             </button>
                         )}
                     </div>
                </header>

                <div className="flex-grow overflow-hidden relative">
                    {renderView()}
                </div>
            </div>

            {/* Modals */}
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

            <ConfirmationModal 
                isOpen={confirmation.isOpen} 
                title={confirmation.title} 
                message={confirmation.message} 
                onClose={() => setConfirmation({ ...confirmation, isOpen: false })} 
                onConfirm={confirmation.onConfirm}
                confirmText={confirmation.confirmText}
                cancelText={confirmation.cancelText}
                type={confirmation.type}
            />

            {isEditJobModalOpen && selectedJobId && (
                <EditJobModal
                    isOpen={isEditJobModalOpen}
                    onClose={() => setIsEditJobModalOpen(false)}
                    selectedJobId={selectedJobId}
                    onOpenPurchaseOrder={(po) => setViewPoModal({isOpen: true, po})}
                    rentalBookings={rentalBookings}
                    onOpenRentalBooking={(b) => setRentalBookingModal({isOpen: true, booking: b})}
                    onOpenConditionReport={(b, mode) => setRentalConditionModal({isOpen: true, booking: b, mode})}
                    onCreateSupplementaryEstimate={(job) => setEstimateFormModal({isOpen: true, estimate: { jobId: job.id, customerId: job.customerId, vehicleId: job.vehicleId, entityId: job.entityId, createdByUserId: currentUser.id } as any })}
                    onViewEstimate={(est) => setEstimateViewModal({isOpen: true, estimate: est})}
                />
            )}

            {isSmartCreateOpen && (
                <SmartCreateJobModal
                    isOpen={isSmartCreateOpen}
                    onClose={() => setIsSmartCreateOpen(false)}
                    creationMode={smartCreateMode}
                    onJobCreate={(jobData) => { handleSaveItem(setJobs, { ...jobData, createdByUserId: currentUser.id }); setIsSmartCreateOpen(false); }}
                    onVehicleAndJobCreate={(c, v, j) => { handleSaveItem(data.setCustomers, c); handleSaveItem(data.setVehicles, v); handleSaveItem(setJobs, { ...j, createdByUserId: currentUser.id }); setIsSmartCreateOpen(false); }}
                    onEstimateCreate={(estData) => { handleSaveItem(setEstimates, estData); setIsSmartCreateOpen(false); }}
                    onVehicleAndEstimateCreate={(c, v, e) => { handleSaveItem(data.setCustomers, c); handleSaveItem(data.setVehicles, v); handleSaveItem(setEstimates, e); setIsSmartCreateOpen(false); }}
                    vehicles={vehicles}
                    customers={customers}
                    servicePackages={servicePackages}
                    defaultDate={smartCreateDefaultDate}
                />
            )}

            {poModal.isOpen && (
                <PurchaseOrderFormModal
                    isOpen={poModal.isOpen}
                    onClose={() => setPoModal({isOpen: false, po: null})}
                    onSave={(po) => handleSavePurchaseOrder({ ...po, createdByUserId: po.createdByUserId || currentUser.id })}
                    purchaseOrder={poModal.po}
                    suppliers={suppliers}
                    taxRates={taxRates}
                    businessEntities={businessEntities}
                    allPurchaseOrders={purchaseOrders}
                    selectedEntityId={selectedEntityId}
                    parts={parts}
                    setParts={setParts}
                    onViewPurchaseOrder={(po) => { setPoModal({isOpen: false, po: null}); setViewPoModal({isOpen: true, po}); }}
                />
            )}

            {batchPoModalOpen && (
                <BatchAddPurchasesModal 
                    isOpen={batchPoModalOpen}
                    onClose={() => setBatchPoModalOpen(false)}
                    onSave={(poData) => { 
                        // Simplified creation for batch
                        const newId = `BPP944${Date.now()}`; // Just an example ID gen
                        const newPo: T.PurchaseOrder = { id: newId, ...poData, createdByUserId: currentUser.id } as T.PurchaseOrder;
                        handleSavePurchaseOrder(newPo);
                    }}
                    jobs={jobs}
                    vehicles={vehicles}
                    suppliers={suppliers}
                    taxRates={taxRates}
                    selectedEntityId={selectedEntityId}
                    businessEntities={businessEntities}
                    parts={parts}
                />
            )}

            {viewPoModal.isOpen && viewPoModal.po && (
                <PurchaseOrderViewModal
                    isOpen={viewPoModal.isOpen}
                    onClose={() => setViewPoModal({isOpen: false, po: null})}
                    purchaseOrder={viewPoModal.po}
                    supplier={suppliers.find(s => s.id === viewPoModal.po!.supplierId)}
                    entity={businessEntities.find(e => e.id === viewPoModal.po!.entityId)}
                    taxRates={taxRates}
                    onSetStatusToOrdered={(po) => handleSavePurchaseOrder(po)}
                    onOpenForEditing={(po) => { setViewPoModal({isOpen: false, po: null}); setPoModal({isOpen: true, po}); }}
                />
            )}

            {invoiceFormModal.isOpen && (
                <InvoiceFormModal 
                    isOpen={invoiceFormModal.isOpen}
                    onClose={() => setInvoiceFormModal({isOpen: false, invoice: null})}
                    onSave={(inv) => {
                        const finalInvoice = { ...inv, createdByUserId: inv.createdByUserId || currentUser.id };
                        handleSaveItem(setInvoices, finalInvoice);
                        
                        // Link Invoice to Job
                        if (finalInvoice.jobId) {
                            setJobs(prev => prev.map(j => j.id === finalInvoice.jobId ? { ...j, invoiceId: finalInvoice.id, status: 'Invoiced' } : j));
                        }

                        // Close form
                        setInvoiceFormModal({isOpen: false, invoice: null});
                        // Open view immediately to allow printing
                        setViewInvoiceModal({isOpen: true, invoice: finalInvoice});
                    }}
                    invoice={invoiceFormModal.invoice}
                    customers={customers}
                    onSaveCustomer={(c) => handleSaveItem(data.setCustomers, c)}
                    vehicles={vehicles}
                    onSaveVehicle={(v) => handleSaveItem(data.setVehicles, v)}
                    businessEntities={businessEntities}
                    taxRates={taxRates}
                    servicePackages={servicePackages}
                    parts={parts}
                    invoices={invoices}
                />
            )}

            {viewInvoiceModal.isOpen && viewInvoiceModal.invoice && (
                <InvoiceModal
                    isOpen={viewInvoiceModal.isOpen}
                    onClose={() => setViewInvoiceModal({isOpen: false, invoice: null})}
                    invoice={viewInvoiceModal.invoice}
                    customer={customers.find(c => c.id === viewInvoiceModal.invoice!.customerId)}
                    vehicle={vehicles.find(v => v.id === viewInvoiceModal.invoice!.vehicleId)}
                    entity={businessEntities.find(e => e.id === viewInvoiceModal.invoice!.entityId)}
                    job={jobs.find(j => j.id === viewInvoiceModal.invoice!.jobId)}
                    taxRates={taxRates}
                    onUpdateInvoice={(inv) => handleSaveItem(setInvoices, inv)}
                    onInvoiceAction={handleMarkJobAsAwaitingCollection}
                />
            )}

            {salesInvoiceModal.isOpen && salesInvoiceModal.invoice && (
                <SalesInvoiceModal 
                    isOpen={salesInvoiceModal.isOpen}
                    onClose={() => setSalesInvoiceModal({isOpen: false, invoice: null})}
                    saleVehicle={saleVehicles.find(sv => sv.id === salesInvoiceModal.invoice!.saleVehicleId)!}
                    invoice={salesInvoiceModal.invoice}
                    vehicle={vehicles.find(v => v.id === salesInvoiceModal.invoice!.vehicleId)}
                    buyer={customers.find(c => c.id === salesInvoiceModal.invoice!.customerId)}
                    entity={businessEntities.find(e => e.id === salesInvoiceModal.invoice!.entityId)}
                    taxRates={taxRates}
                    onUpdateInvoice={(inv) => handleSaveItem(setInvoices, inv)}
                />
            )}

            {rentalBookingModal.isOpen && (
                <RentalBookingModal 
                    isOpen={rentalBookingModal.isOpen}
                    onClose={() => setRentalBookingModal({isOpen: false, booking: null})}
                    onSave={(b) => handleSaveItem(setRentalBookings, b)}
                    booking={rentalBookingModal.booking}
                    vehicles={vehicles}
                    rentalVehicles={rentalVehicles}
                    customers={customers}
                    jobs={jobs}
                    rentalEntities={businessEntities.filter(e => e.type === 'Rentals')}
                />
            )}

            {rentalConditionModal.isOpen && rentalConditionModal.booking && (
                <RentalCheckInCheckOutModal 
                    isOpen={rentalConditionModal.isOpen}
                    onClose={() => setRentalConditionModal({isOpen: false, booking: null, mode: 'checkOut'})}
                    onSave={(b) => handleSaveItem(setRentalBookings, b)}
                    booking={rentalConditionModal.booking}
                    mode={rentalConditionModal.mode}
                    rentalVehicle={rentalVehicles.find(rv => rv.id === rentalConditionModal.booking!.rentalVehicleId)!}
                    vehicle={vehicles.find(v => v.id === rentalConditionModal.booking!.rentalVehicleId)!}
                />
            )}

            {rentalAgreementModal.isOpen && rentalAgreementModal.booking && (
                <RentalAgreementModal 
                    isOpen={rentalAgreementModal.isOpen}
                    onClose={() => setRentalAgreementModal({isOpen: false, booking: null})}
                    booking={rentalAgreementModal.booking}
                    rentalVehicle={rentalVehicles.find(rv => rv.id === rentalAgreementModal.booking!.rentalVehicleId)}
                    vehicle={vehicles.find(v => v.id === rentalAgreementModal.booking!.rentalVehicleId)}
                    customer={customers.find(c => c.id === rentalAgreementModal.booking!.customerId)}
                    entity={businessEntities.find(e => e.id === rentalAgreementModal.booking!.entityId)}
                />
            )}

            {rentalReturnReportModal.isOpen && rentalReturnReportModal.booking && (
                <RentalCheckInReportModal 
                    isOpen={rentalReturnReportModal.isOpen}
                    onClose={() => setRentalReturnReportModal({isOpen: false, booking: null})}
                    booking={rentalReturnReportModal.booking}
                    rentalVehicle={rentalVehicles.find(rv => rv.id === rentalReturnReportModal.booking!.rentalVehicleId)}
                    vehicle={vehicles.find(v => v.id === rentalReturnReportModal.booking!.rentalVehicleId)}
                    customer={customers.find(c => c.id === rentalReturnReportModal.booking!.customerId)}
                    entity={businessEntities.find(e => e.id === rentalReturnReportModal.booking!.entityId)}
                />
            )}

            {sorContractModal.isOpen && sorContractModal.saleVehicle && (
                <SORContractModal 
                    isOpen={sorContractModal.isOpen}
                    onClose={() => setSorContractModal({isOpen: false, saleVehicle: null})}
                    saleVehicle={sorContractModal.saleVehicle}
                    vehicle={vehicles.find(v => v.id === sorContractModal.saleVehicle!.vehicleId)}
                    owner={customers.find(c => c.id === vehicles.find(v => v.id === sorContractModal.saleVehicle!.vehicleId)?.customerId)}
                    entity={businessEntities.find(e => e.id === sorContractModal.saleVehicle!.entityId)}
                />
            )}

            {ownerStatementModal.isOpen && ownerStatementModal.saleVehicle && (
                <OwnerStatementModal 
                    isOpen={ownerStatementModal.isOpen}
                    onClose={() => setOwnerStatementModal({isOpen: false, saleVehicle: null})}
                    saleVehicle={ownerStatementModal.saleVehicle}
                    vehicle={vehicles.find(v => v.id === ownerStatementModal.saleVehicle!.vehicleId)}
                    owner={customers.find(c => c.id === vehicles.find(v => v.id === ownerStatementModal.saleVehicle!.vehicleId)?.customerId)}
                    entity={businessEntities.find(e => e.id === ownerStatementModal.saleVehicle!.entityId)}
                />
            )}

            {internalStatementModal.isOpen && internalStatementModal.saleVehicle && (
                <InternalSaleStatementModal 
                    isOpen={internalStatementModal.isOpen}
                    onClose={() => setInternalStatementModal({isOpen: false, saleVehicle: null})}
                    saleVehicle={internalStatementModal.saleVehicle}
                    vehicle={vehicles.find(v => v.id === internalStatementModal.saleVehicle!.vehicleId)}
                    entity={businessEntities.find(e => e.id === internalStatementModal.saleVehicle!.entityId)}
                />
            )}

            {salesReportModal && (
                <SalesSummaryReportModal 
                    isOpen={salesReportModal}
                    onClose={() => setSalesReportModal(false)}
                    saleVehicles={saleVehicles}
                    vehicles={vehicles}
                    entity={businessEntities.find(e => e.id === selectedEntityId)}
                />
            )}

            {prospectModal.isOpen && (
                <ProspectFormModal 
                    isOpen={prospectModal.isOpen}
                    onClose={() => setProspectModal({isOpen: false, prospect: null})}
                    onSave={(p) => handleSaveItem(setProspects, p)}
                    prospect={prospectModal.prospect}
                    entityId={selectedEntityId}
                    saleVehicles={saleVehicles}
                    vehicles={vehicles}
                    customers={customers}
                    onSaveCustomer={(c) => handleSaveItem(data.setCustomers, c)}
                />
            )}

            {estimateFormModal.isOpen && (
                <EstimateFormModal 
                    isOpen={estimateFormModal.isOpen}
                    onClose={() => setEstimateFormModal({isOpen: false, estimate: null})}
                    onSave={handleSaveEstimate}
                    estimate={estimateFormModal.estimate}
                    customers={customers}
                    onSaveCustomer={(c) => handleSaveItem(data.setCustomers, c)}
                    vehicles={vehicles}
                    onSaveVehicle={(v) => handleSaveItem(data.setVehicles, v)}
                    businessEntities={businessEntities}
                    taxRates={taxRates}
                    servicePackages={servicePackages}
                    parts={parts}
                    estimates={estimates}
                    currentUser={currentUser}
                    selectedEntityId={selectedEntityId}
                />
            )}

            {estimateViewModal.isOpen && estimateViewModal.estimate && (
                <EstimateViewModal 
                    isOpen={estimateViewModal.isOpen}
                    onClose={() => setEstimateViewModal({isOpen: false, estimate: null})}
                    estimate={estimateViewModal.estimate}
                    customer={customers.find(c => c.id === estimateViewModal.estimate!.customerId)}
                    vehicle={vehicles.find(v => v.id === estimateViewModal.estimate!.vehicleId)}
                    taxRates={taxRates}
                    entityDetails={businessEntities.find(e => e.id === estimateViewModal.estimate!.entityId)}
                    onApprove={handleApproveEstimate}
                    onCustomerApprove={handleCustomerApproveEstimate}
                    onDecline={handleCustomerDeclineEstimate}
                    onEmailSuccess={(est) => {
                        handleSaveItem(setEstimates, est);
                        updateLinkedInquiryStatus(est.id, 'Sent');
                    }}
                    viewMode="internal"
                    parts={parts}
                    users={users}
                    currentUser={currentUser}
                    onViewAsCustomer={() => { /* Toggle view mode locally in modal */ }}
                    onCreateInquiry={(est) => setInquiryModal({isOpen: true, inquiry: { linkedEstimateId: est.id, linkedCustomerId: est.customerId, linkedVehicleId: est.vehicleId, message: `Question regarding Estimate #${est.estimateNumber}` }})}
                />
            )}

            {scheduleJobFromEstimateModal.isOpen && scheduleJobFromEstimateModal.estimate && (
                <ScheduleJobFromEstimateModal 
                    isOpen={scheduleJobFromEstimateModal.isOpen}
                    onClose={() => setScheduleJobFromEstimateModal({isOpen: false, estimate: null})}
                    onConfirm={(job, est, options) => {
                        // 1. Identify parts needed from estimate (excluding labor and optional items not selected)
                        const partItems = (est.lineItems || []).filter(li => !li.isLabor && li.partId && !li.isOptional);
                        
                        const newPOs: T.PurchaseOrder[] = [];
                        const newPurchaseOrderIds: string[] = [];
                        
                        if (partItems.length > 0) {
                             const partsBySupplier: Record<string, T.EstimateLineItem[]> = {};
                             partItems.forEach(item => {
                                 const partDef = parts.find(p => p.id === item.partId);
                                 const supplierId = partDef?.defaultSupplierId || 'no_supplier';
                                 if (!partsBySupplier[supplierId]) partsBySupplier[supplierId] = [];
                                 partsBySupplier[supplierId].push(item);
                             });
                             
                             const entity = businessEntities.find(e => e.id === job.entityId);
                             const entityShortCode = entity?.shortCode || 'UNK';
                             // Simulate updated PO list for ID generation
                             let tempAllPOs = [...purchaseOrders]; 
            
                             Object.entries(partsBySupplier).forEach(([supplierId, items]) => {
                                 const newPOId = generatePurchaseOrderId(tempAllPOs, entityShortCode);
                                 const vehicle = vehicles.find(v => v.id === job.vehicleId);
            
                                 const newPO: T.PurchaseOrder = {
                                     id: newPOId,
                                     entityId: job.entityId,
                                     supplierId: supplierId === 'no_supplier' ? null : supplierId,
                                     vehicleRegistrationRef: vehicle?.registration || 'N/A',
                                     orderDate: formatDate(new Date()),
                                     status: 'Draft',
                                     jobId: job.id,
                                     createdByUserId: currentUser.id,
                                     lineItems: items.map(item => ({
                                         id: crypto.randomUUID(),
                                         partNumber: item.partNumber,
                                         description: item.description,
                                         quantity: item.quantity,
                                         receivedQuantity: 0,
                                         unitPrice: item.unitCost || 0,
                                         taxCodeId: item.taxCodeId
                                     }))
                                 };
                                 
                                 newPOs.push(newPO);
                                 newPurchaseOrderIds.push(newPOId);
                                 tempAllPOs.push(newPO);
                             });
                        }

                        // 2. Update Job with PO info
                        const jobToSave: T.Job = {
                            ...job,
                            partsStatus: newPOs.length > 0 ? 'Awaiting Order' : 'Not Required',
                            purchaseOrderIds: newPurchaseOrderIds.length > 0 ? newPurchaseOrderIds : undefined,
                            createdByUserId: currentUser.id
                        };

                        handleSaveItem(setJobs, jobToSave);
                        handleSaveItem(setEstimates, est);
                        newPOs.forEach(po => handleSaveItem(setPurchaseOrders, po));
                        
                        // 3. Handle Inquiry Status
                        // Logic: If there is an explicit inquiryId passed, use it.
                        // Otherwise try to find one linked to the estimate.
                        const targetInquiryId = scheduleJobFromEstimateModal.inquiryId || inquiries.find(i => i.linkedEstimateId === est.id)?.id;

                        if (targetInquiryId) {
                            const inquiry = inquiries.find(i => i.id === targetInquiryId);
                            if (inquiry) {
                                if (newPOs.length === 0) {
                                    // If no POs, close immediately
                                    const closedInquiry: T.Inquiry = { 
                                        ...inquiry, 
                                        status: 'Closed', 
                                        actionNotes: (inquiry.actionNotes || '') + '\n[System]: Job Scheduled (No Parts Required). Inquiry Closed.' 
                                    };
                                    handleSaveItem(setInquiries, closedInquiry);
                                } else {
                                    // If POs exist, link them and update status to 'In Progress' so they can be processed
                                    const updatedInquiry: T.Inquiry = {
                                        ...inquiry,
                                        status: 'In Progress',
                                        linkedPurchaseOrderIds: [...(inquiry.linkedPurchaseOrderIds || []), ...newPurchaseOrderIds],
                                        actionNotes: (inquiry.actionNotes || '') + `\n[System]: Job Scheduled. ${newPOs.length} Purchase Order(s) raised.`
                                    };
                                    handleSaveItem(setInquiries, updatedInquiry);
                                }
                            }
                        }

                        setScheduleJobFromEstimateModal({isOpen: false, estimate: null});
                        setScheduleEmailModal({
                            isOpen: true,
                            data: {
                                job: jobToSave,
                                customer: customers.find(c => c.id === jobToSave.customerId),
                                vehicle: vehicles.find(v => v.id === jobToSave.vehicleId),
                                isAlternative: options.isAlternative,
                                originalDate: options.originalDate
                            }
                        });
                    }}
                    estimate={scheduleJobFromEstimateModal.estimate}
                    customer={customers.find(c => c.id === scheduleJobFromEstimateModal.estimate!.customerId)}
                    vehicle={vehicles.find(v => v.id === scheduleJobFromEstimateModal.estimate!.vehicleId)}
                    jobs={jobs}
                    vehicles={vehicles}
                    maxDailyCapacityHours={businessEntities.find(e => e.id === scheduleJobFromEstimateModal.estimate!.entityId)?.dailyCapacityHours || 40}
                    businessEntities={businessEntities}
                    customers={customers}
                    absenceRequests={absenceRequests}
                    onEditJob={(id) => { setSelectedJobId(id); setIsEditJobModalOpen(true); }}
                />
            )}

            {scheduleEmailModal.isOpen && (
                <ScheduleConfirmationEmailModal 
                    isOpen={scheduleEmailModal.isOpen}
                    onClose={() => setScheduleEmailModal({isOpen: false, data: null})}
                    onSend={() => {
                        // In real app, send email here
                        setScheduleEmailModal({isOpen: false, data: null});
                        setConfirmation({isOpen: true, title: 'Email Sent', message: 'Booking confirmation email sent.', type: 'success'});
                    }}
                    data={scheduleEmailModal.data}
                />
            )}

            {inquiryModal.isOpen && (
                <InquiryFormModal 
                    isOpen={inquiryModal.isOpen}
                    onClose={() => setInquiryModal({isOpen: false, inquiry: null})}
                    onSave={(inq) => handleSaveItem(setInquiries, inq)}
                    inquiry={inquiryModal.inquiry}
                    users={users}
                    customers={customers}
                    vehicles={vehicles}
                    estimates={estimates}
                    onViewEstimate={(est) => setEstimateViewModal({isOpen: true, estimate: est})}
                    onScheduleEstimate={(est, inquiryId) => setScheduleJobFromEstimateModal({isOpen: true, estimate: est, inquiryId})}
                    onOpenPurchaseOrder={(po) => setViewPoModal({isOpen: true, po})}
                    onEditEstimate={(est) => setEstimateFormModal({isOpen: true, estimate: est})}
                />
            )}

            {isAssistantOpen && (
                <LiveAssistant 
                    isOpen={isAssistantOpen}
                    onClose={() => setIsAssistantOpen(false)}
                    jobId={assistantContextJobId}
                    onAddNote={() => {}}
                    onReviewPackage={() => {}}
                />
            )}

            {checkInJob && (
                <CheckInModal 
                    isOpen={!!checkInJob}
                    onClose={() => setCheckInJob(null)}
                    onSave={(updatedJob) => handleSaveItem(setJobs, updatedJob)}
                    job={checkInJob}
                />
            )}

            {checkOutJob && (
                <CheckOutModal 
                    isOpen={!!checkOutJob}
                    onClose={() => setCheckOutJob(null)}
                    onSave={(updatedJob) => handleSaveItem(setJobs, updatedJob)}
                    job={checkOutJob}
                    invoice={invoices.find(i => i.jobId === checkOutJob.id) || null}
                    vehicle={vehicles.find(v => v.id === checkOutJob.vehicleId) || null}
                    customer={customers.find(c => c.id === checkOutJob.customerId) || null}
                    onUpdateInvoice={(inv) => handleSaveItem(setInvoices, inv)}
                />
            )}

            {exportModal.isOpen && (
                <NominalCodeExportModal 
                    isOpen={exportModal.isOpen}
                    onClose={() => setExportModal({isOpen: false, type: 'invoices', items: []})}
                    type={exportModal.type}
                    items={exportModal.items}
                    nominalCodes={nominalCodes}
                    nominalCodeRules={nominalCodeRules}
                    customers={customers}
                    vehicles={vehicles}
                    taxRates={taxRates}
                />
            )}

        </div>
    );
};

export default App;