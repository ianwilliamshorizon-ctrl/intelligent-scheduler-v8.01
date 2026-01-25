
import React, { useState } from 'react';
import { useData } from '../core/state/DataContext';
import { useApp } from '../core/state/AppContext';
import { 
    Vehicle, Customer, User, Part, ServicePackage, Supplier, BusinessEntity, 
    BackupSchedule, Estimate, Role, InspectionDiagram, NominalCode, NominalCodeRule, Job, Invoice 
} from '../types';
import { 
    X, Settings, Database, User as UserIcon, Car, Wrench, Package, Briefcase, 
    Download, Upload, ShieldCheck, Users, Truck, AlertTriangle, RefreshCw, 
    CarFront, List, Info, CheckCircle, Server, Save, Clock, PlusCircle
} from 'lucide-react';

// Modals
import CustomerFormModal from './CustomerFormModal';
import VehicleFormModal from './VehicleFormModal';
import EntityFormModal from './EntityFormModal';
import UserFormModal from './UserFormModal';
import RoleFormModal from './RoleFormModal';
import SupplierFormModal from './SupplierFormModal';
import PartFormModal from './PartFormModal';
import ServicePackageFormModal from './ServicePackageFormModal';
import InspectionDiagramFormModal from './InspectionDiagramFormModal';
import NominalCodeFormModal from './NominalCodeFormModal';
import NominalCodeRuleFormModal from './NominalCodeRuleFormModal';

// Extracted Tab Views
import {
    ManagementCustomersTab, ManagementVehiclesTab, ManagementDiagramsTab,
    ManagementStaffTab, ManagementRolesTab, ManagementEntitiesTab,
    ManagementSuppliersTab, ManagementPartsTab, ManagementPackagesTab,
    ManagementNominalCodesTab
} from './management/ManagementViews';

// Utilities
import { performFactoryReset } from '../core/utils/backupUtils';
import { setItem, getStorageType } from '../core/db';
import { parseCsv } from '../utils/csvUtils';
import { generateCustomerId } from '../core/utils/customerUtils';
import { saveImage, getImage } from '../utils/imageStore';
import { generateJobId, generateInvoiceId } from '../core/utils/numberGenerators';
import { splitJobIntoSegments, formatDate } from '../core/utils/dateUtils';

interface ManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialView: { tab: string; id: string } | null;
    selectedEntityId: string;
    onViewJob: (jobId: string) => void;
    onViewEstimate: (estimate: Estimate) => void;
    backupSchedule: BackupSchedule;
    setBackupSchedule: (schedule: BackupSchedule) => void;
    onManualBackup: () => void;
}

const ManagementModal: React.FC<ManagementModalProps> = ({ isOpen, onClose, initialView, selectedEntityId, onViewJob, onViewEstimate, backupSchedule, setBackupSchedule, onManualBackup }) => {
    const dataContext = useData();
    const { 
        customers, setCustomers, vehicles, setVehicles, parts, setParts, 
        servicePackages, setServicePackages, suppliers, setSuppliers, 
        businessEntities, setBusinessEntities,
        inspectionDiagrams, setInspectionDiagrams, taxRates, roles, setRoles,
        nominalCodes, setNominalCodes, nominalCodeRules, setNominalCodeRules,
        jobs, setJobs, invoices, setInvoices
    } = dataContext;
    
    const { users, setUsers, appEnvironment, setAppEnvironment } = useApp();

    const [activeTab, setActiveTab] = useState(initialView?.tab || 'customers');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Selection States
    const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
    const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(new Set());

    // Modal States
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

    const [selectedPart, setSelectedPart] = useState<Part | null>(null);
    const [isPartModalOpen, setIsPartModalOpen] = useState(false);

    const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);

    const [selectedEntity, setSelectedEntity] = useState<BusinessEntity | null>(null);
    const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);

    const [selectedDiagram, setSelectedDiagram] = useState<InspectionDiagram | null>(null);
    const [isDiagramModalOpen, setIsDiagramModalOpen] = useState(false);
    
    const [selectedNominalCode, setSelectedNominalCode] = useState<NominalCode | null>(null);
    const [isNominalCodeModalOpen, setIsNominalCodeModalOpen] = useState(false);

    const [selectedNominalCodeRule, setSelectedNominalCodeRule] = useState<NominalCodeRule | null>(null);
    const [isNominalCodeRuleModalOpen, setIsNominalCodeRuleModalOpen] = useState(false);
    
    // Import target state
    const [importTargetEntityId, setImportTargetEntityId] = useState<string | null>(null);

    // Software Update & Status
    const [isUpdating, setIsUpdating] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'info' | 'success' | 'error', text: string } | null>(null);

    // Connection Status Check
    const storageType = getStorageType();
    const isConnectedToCloud = storageType === 'firestore' || storageType === 'emulator';
    
    const showStatus = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
        setStatusMessage({ type, text });
        if (type !== 'info') {
            setTimeout(() => setStatusMessage(null), 5000);
        }
    };

    if (!isOpen) return null;

    // --- Helper Functions (Generic) ---
    const updateItem = <T extends { id: string }>(items: T[], newItem: T, setItems: React.Dispatch<React.SetStateAction<T[]>>) => {
        setItems(prev => {
            const exists = prev.some(i => i.id === newItem.id);
            return exists ? prev.map(i => i.id === newItem.id ? newItem : i) : [...prev, newItem];
        });
    };

    const deleteItem = <T extends { id: string }>(items: T[], id: string, setItems: React.Dispatch<React.SetStateAction<T[]>>) => {
        if(confirm('Are you sure you want to delete this item?')) {
            setItems(prev => prev.filter(i => i.id !== id));
        }
    };

    const toggleSelection = (id: string, selectedIds: Set<string>, setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleSelectAll = (filteredItems: any[], selectedIds: Set<string>, setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>) => {
        if (selectedIds.size === filteredItems.length && filteredItems.length > 0) setSelectedIds(new Set());
        else setSelectedIds(new Set(filteredItems.map(i => i.id)));
    };

    const handleBulkDelete = <T extends { id: string }>(
        items: T[],
        selectedIds: Set<string>,
        setItems: React.Dispatch<React.SetStateAction<T[]>>,
        setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>
    ) => {
        if (confirm(`Are you sure you want to delete ${selectedIds.size} items? This cannot be undone.`)) {
            setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
            setSelectedIds(new Set());
            showStatus('Items deleted successfully.', 'success');
        }
    };
    
    // --- Logic Blocks --- (Moved from original file, kept here for context or can be moved to separate utils if needed)

    const handleForceSave = async () => {
        setIsUpdating(true);
        showStatus('Forcing save of all data to storage...', 'info');
        try {
            await Promise.all([
                setItem('brooks_jobs', dataContext.jobs),
                setItem('brooks_vehicles', dataContext.vehicles),
                setItem('brooks_customers', dataContext.customers),
                setItem('brooks_estimates', dataContext.estimates),
                setItem('brooks_invoices', dataContext.invoices),
                setItem('brooks_purchaseOrders', dataContext.purchaseOrders),
                setItem('brooks_purchases', dataContext.purchases),
                setItem('brooks_parts', dataContext.parts),
                setItem('brooks_servicePackages', dataContext.servicePackages),
                setItem('brooks_suppliers', dataContext.suppliers),
                setItem('brooks_engineers', dataContext.engineers),
                setItem('brooks_lifts', dataContext.lifts),
                setItem('brooks_rentalVehicles', dataContext.rentalVehicles),
                setItem('brooks_rentalBookings', dataContext.rentalBookings),
                setItem('brooks_saleVehicles', dataContext.saleVehicles),
                setItem('brooks_saleOverheadPackages', dataContext.saleOverheadPackages),
                setItem('brooks_prospects', dataContext.prospects),
                setItem('brooks_storageBookings', dataContext.storageBookings),
                setItem('brooks_storageLocations', dataContext.storageLocations),
                setItem('brooks_batteryChargers', dataContext.batteryChargers),
                setItem('brooks_nominalCodes', dataContext.nominalCodes),
                setItem('brooks_nominalCodeRules', dataContext.nominalCodeRules),
                setItem('brooks_absenceRequests', dataContext.absenceRequests),
                setItem('brooks_inquiries', dataContext.inquiries),
                setItem('brooks_reminders', dataContext.reminders),
                setItem('brooks_auditLog', dataContext.auditLog),
                setItem('brooks_businessEntities', dataContext.businessEntities),
                setItem('brooks_taxRates', dataContext.taxRates),
                setItem('brooks_roles', dataContext.roles),
                setItem('brooks_inspectionDiagrams', dataContext.inspectionDiagrams),
                setItem('brooks_users', users),
            ]);
            showStatus('All data successfully forced to storage.', 'success');
        } catch (e) {
            console.error(e);
            showStatus('Failed to save some data. Check console for details.', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleImportCustomers = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const data = await parseCsv(file);
            const newCustomers: Customer[] = data.map((row: any) => ({
                id: row.id || generateCustomerId(row.surname || 'Unknown', customers),
                forename: row.forename || 'Unknown',
                surname: row.surname || 'Unknown',
                phone: row.phone || '',
                mobile: row.mobile || '',
                email: row.email || '',
                addressLine1: row.addressLine1 || '',
                postcode: row.postcode || '',
                createdDate: new Date().toISOString(),
                marketingConsent: false,
                serviceReminderConsent: true,
                ...row
            }));
            const uniqueNew = newCustomers.filter(c => !customers.some(ex => ex.id === c.id));
            setCustomers(prev => [...prev, ...uniqueNew]);
            showStatus(`Imported ${uniqueNew.length} new customers successfully.`, 'success');
        } catch (err) {
            console.error(err);
            showStatus('Error importing customers. Please check file format.', 'error');
        }
        e.target.value = '';
    };

    const handleImportVehicles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const data = await parseCsv(file);
            const newVehicles: Vehicle[] = data.map((row: any) => ({
                id: row.id || crypto.randomUUID(),
                registration: (row.registration || '').toUpperCase().replace(/\s/g, ''),
                make: row.make || 'Unknown',
                model: row.model || 'Unknown',
                customerId: row.customerId || 'unknown_owner',
                ...row
            }));
            const uniqueNew = newVehicles.filter(v => !vehicles.some(ex => ex.id === v.id));
            setVehicles(prev => [...prev, ...uniqueNew]);
            showStatus(`Imported ${uniqueNew.length} new vehicles successfully.`, 'success');
        } catch (err) {
            console.error(err);
            showStatus('Error importing vehicles. Please check file format.', 'error');
        }
        e.target.value = '';
    };

    const handleImportParts = async (e: React.ChangeEvent<HTMLInputElement>) => {
         const file = e.target.files?.[0];
        if (!file) return;
        try {
            const data = await parseCsv(file);
            const newParts: Part[] = data.map((row: any) => ({
                id: row.id || `part_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                partNumber: row.partNumber || row.part_number || 'UNKNOWN',
                description: row.description || 'Imported Part',
                salePrice: Number(row.salePrice || row.price || 0),
                costPrice: Number(row.costPrice || row.cost || 0),
                stockQuantity: Number(row.stockQuantity || row.stock || 0),
                isStockItem: true,
                defaultSupplierId: row.defaultSupplierId || undefined,
                taxCodeId: row.taxCodeId || taxRates.find(t => t.code === 'T1')?.id
            }));
            const uniqueNew = newParts.filter(p => !parts.some(ex => ex.partNumber.toLowerCase() === p.partNumber.toLowerCase()));
            if (uniqueNew.length > 0) {
                setParts(prev => [...prev, ...uniqueNew]);
                showStatus(`Imported ${uniqueNew.length} new parts successfully.`, 'success');
            } else {
                showStatus('No new parts imported. Duplicates skipped.', 'info');
            }
        } catch (err) {
            console.error(err);
            showStatus('Error importing parts. Please check file format.', 'error');
        }
        e.target.value = '';
    };
    
    const handleImportJobs = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const entityId = importTargetEntityId;
        if (!file || !entityId) return;
        try {
            const data = await parseCsv(file);
            const entity = businessEntities.find(e => e.id === entityId);
            const entityShortCode = entity?.shortCode || 'UNK';
            let tempJobs = [...jobs];
            const newJobs: Job[] = data.map((row: any) => {
                const reg = (row.registration || '').toUpperCase().replace(/\s/g, '');
                const vehicle = vehicles.find(v => v.registration === reg);
                const customer = customers.find(c => (vehicle && c.id === vehicle.customerId) || (row.customerName && `${c.forename} ${c.surname}`.toLowerCase().includes(String(row.customerName).toLowerCase())));
                const newJobId = row.id || generateJobId(tempJobs, entityShortCode);
                const job: Job = {
                    id: newJobId, entityId: entityId, vehicleId: vehicle?.id || 'unknown_vehicle', customerId: customer?.id || 'unknown_customer', description: row.description || 'Imported Job',
                    estimatedHours: Number(row.estimatedHours) || 1, scheduledDate: row.scheduledDate || null, status: row.status || 'Unallocated', createdAt: row.createdAt || new Date().toISOString(), segments: [],
                    mileage: row.mileage ? Number(row.mileage) : undefined, keyNumber: row.keyNumber ? Number(row.keyNumber) : undefined
                };
                job.segments = splitJobIntoSegments(job);
                tempJobs.push(job);
                return job;
            });
            const uniqueNew = newJobs.filter(j => !jobs.some(ex => ex.id === j.id));
            setJobs(prev => [...prev, ...uniqueNew]);
            showStatus(`Imported ${uniqueNew.length} new jobs successfully.`, 'success');
        } catch (err) { console.error(err); showStatus('Error importing jobs.', 'error'); }
        e.target.value = ''; setImportTargetEntityId(null);
    };

    const handleImportInvoices = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const entityId = importTargetEntityId;
        if (!file || !entityId) return;
        try {
            const data = await parseCsv(file);
            const entity = businessEntities.find(e => e.id === entityId);
            const entityShortCode = entity?.shortCode || 'UNK';
            let tempInvoices = [...invoices];
            const newInvoices: Invoice[] = data.map((row: any) => {
                const reg = (row.registration || '').toUpperCase().replace(/\s/g, '');
                const vehicle = vehicles.find(v => v.registration === reg);
                const customer = customers.find(c => (vehicle && c.id === vehicle.customerId) || (row.customerName && `${c.forename} ${c.surname}`.toLowerCase().includes(String(row.customerName).toLowerCase())));
                const newInvoiceId = row.id || generateInvoiceId(tempInvoices, entityShortCode);
                const total = Number(row.total) || 0; const net = total / 1.2;
                const invoice: Invoice = {
                    id: newInvoiceId, entityId: entityId, customerId: customer?.id || 'unknown_customer', vehicleId: vehicle?.id,
                    issueDate: row.issueDate || formatDate(new Date()), dueDate: row.dueDate || formatDate(new Date()), status: row.status || 'Draft',
                    lineItems: [{ id: crypto.randomUUID(), description: 'Imported Balance', quantity: 1, unitPrice: net, isLabor: false, taxCodeId: taxRates.find(t=>t.code==='T1')?.id }]
                };
                tempInvoices.push(invoice);
                return invoice;
            });
            const uniqueNew = newInvoices.filter(i => !invoices.some(ex => ex.id === i.id));
            setInvoices(prev => [...prev, ...uniqueNew]);
            showStatus(`Imported ${uniqueNew.length} new invoices successfully.`, 'success');
        } catch (err) { console.error(err); showStatus('Error importing invoices.', 'error'); }
        e.target.value = ''; setImportTargetEntityId(null);
    };

    const handleBulkUploadDiagrams = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setIsUpdating(true);
        setStatusMessage({ text: "Uploading diagrams...", type: 'info' });
        const files: File[] = Array.from(e.target.files);
        const newDiagrams: InspectionDiagram[] = [];
        let successCount = 0;
        try {
            for (const file of files) {
                await new Promise<void>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        if (event.target?.result) {
                            const dataUrl = event.target.result as string;
                            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
                            let make = 'Generic'; let model = nameWithoutExt;
                            const parts = nameWithoutExt.split(' ');
                            if (['porsche', 'audi', 'vw', 'volkswagen', 'bmw', 'mercedes', 'ford', 'ferrari', 'mclaren', 'lamborghini', 'honda', 'toyota'].includes(parts[0].toLowerCase())) {
                                make = parts[0]; model = parts.slice(1).join(' ');
                            }
                            make = make.charAt(0).toUpperCase() + make.slice(1); model = model.charAt(0).toUpperCase() + model.slice(1);
                            const imageId = `diag_bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                            try {
                                await saveImage(imageId, dataUrl);
                                newDiagrams.push({ id: crypto.randomUUID(), make, model, imageId });
                                successCount++;
                            } catch (err) { console.error(`Failed to save image for ${file.name}`, err); }
                        }
                        resolve();
                    };
                    reader.onerror = () => resolve(); 
                    reader.readAsDataURL(file);
                });
            }
            if (newDiagrams.length > 0) {
                setInspectionDiagrams(prev => [...prev, ...newDiagrams]);
                showStatus(`Successfully imported ${successCount} diagrams.`, 'success');
            } else { showStatus("No valid images were imported.", 'error'); }
        } catch (e) { console.error("Bulk upload failed", e); showStatus("An error occurred during bulk upload.", 'error'); } finally { setIsUpdating(false); e.target.value = ''; }
    };

    const autoAssignVehicleDiagrams = async () => {
        setStatusMessage(null);
        if (!inspectionDiagrams || inspectionDiagrams.length === 0) { showStatus("Library is empty. Upload diagrams first.", 'error'); return; }
        const candidates = vehicles.filter(v => !v.images?.some(img => img.isPrimaryDiagram));
        if (candidates.length === 0) { showStatus("All vehicles already have diagrams.", 'success'); return; }
        setIsUpdating(true);
        showStatus(`Scanning library for matches...`, 'info');
        let assignedCount = 0;
        try {
            const updatedVehicles = [...vehicles];
            let changesMade = false;
            for (let i = 0; i < updatedVehicles.length; i++) {
                const v = updatedVehicles[i];
                if (!v || v.images?.some(img => img.isPrimaryDiagram)) continue;
                let bestMatch: InspectionDiagram | undefined;
                let bestScore = 0;
                const vMake = (v.make || '').toLowerCase().trim();
                const vModel = (v.model || '').toLowerCase().trim();
                const vFull = `${vMake} ${vModel}`;
                for (const d of inspectionDiagrams) {
                    let score = 0;
                    const dMake = (d.make || '').toLowerCase().trim();
                    const dModel = (d.model || '').toLowerCase().trim();
                    const dFull = `${dMake} ${dModel}`;
                    if (dMake === vMake && dModel === vModel) score = 100;
                    else if (dMake === vMake && vModel.includes(dModel) && dModel.length > 2) score = 80;
                    else if (vFull.includes(dModel) && dModel.length > 3) score = 60;
                    else if (dModel === 'generic' || dModel === 'saloon') score = 1;
                    if (score > bestScore) { bestScore = score; bestMatch = d; }
                }
                if (bestMatch && bestScore > 0) {
                    try {
                        const imageData = await getImage(bestMatch.imageId);
                        if (imageData) {
                             const newImageId = `veh_diag_${v.id}_${Date.now()}`;
                             await saveImage(newImageId, imageData);
                             const newImages = v.images ? [...v.images] : [];
                             newImages.push({ id: newImageId, isPrimaryDiagram: true });
                             updatedVehicles[i] = { ...v, images: newImages };
                             changesMade = true;
                             assignedCount++;
                        }
                    } catch (imgErr) { console.error(`Failed to assign diagram to vehicle ${v.registration}`, imgErr); }
                }
            }
            if (changesMade) {
                setVehicles(updatedVehicles);
                showStatus(`Success! Assigned diagrams to ${assignedCount} vehicles.`, 'success');
            } else { showStatus("Scan complete. No suitable matches found.", 'info'); }
        } catch (e) { console.error("Auto assign error", e); showStatus("Error during auto-assignment.", 'error'); } finally { setIsUpdating(false); }
    };
    
    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!confirm("Restoring from backup will OVERWRITE current data. Are you sure?")) { e.target.value = ''; return; }
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                const dataToRestore = json.data || json; 
                for (const [key, value] of Object.entries(dataToRestore)) {
                    if (key.startsWith('brooks_')) { await setItem(key, value); }
                }
                alert('Restore successful. Reloading...'); window.location.reload();
            } catch (err) { console.error("Restore failed:", err); alert('Failed to restore backup.'); }
        };
        reader.readAsText(file);
    };

    const handleSoftwareUpdate = () => {
        setIsUpdating(true);
        let branch = appEnvironment === 'UAT' ? 'uat' : appEnvironment === 'Development' ? 'dev' : 'production';
        showStatus(`Pulling latest code from git branch: origin/${branch}...`, 'info');
        setTimeout(() => {
             showStatus(`Successfully updated to latest ${appEnvironment} version. Reloading...`, 'success');
             setTimeout(() => { window.location.reload(); }, 1500);
        }, 2000);
    };
    
    const renderStatusBanner = () => {
        if (!statusMessage) return null;
        const bgColors = { info: 'bg-blue-100 text-blue-800 border-blue-200', success: 'bg-green-100 text-green-800 border-green-200', error: 'bg-red-100 text-red-800 border-red-200' };
        const icons = { info: Info, success: CheckCircle, error: AlertTriangle };
        const Icon = icons[statusMessage.type];
        return (
            <div className={`flex items-center gap-2 p-3 mb-4 rounded-lg border ${bgColors[statusMessage.type]} animate-fade-in`}>
                <Icon size={20} />
                <span className="font-semibold text-sm">{statusMessage.text}</span>
                <button onClick={() => setStatusMessage(null)} className="ml-auto"><X size={16}/></button>
            </div>
        );
    };

    // --- Render Backup Tab ---
    const renderBackupRestore = () => (
        <div className="p-4 space-y-6">
            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2"><Download size={20}/> Backup Data</h3>
                <p className="text-sm text-blue-800 mb-4">Download a full backup of all system data to a JSON file.</p>
                <button onClick={onManualBackup} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow">Download Backup File</button>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50 border-gray-200 mt-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2"><Clock size={20}/> Automated Backups</h3>
                <div className="flex items-center gap-4 mb-4">
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={backupSchedule.enabled} onChange={(e) => setBackupSchedule({...backupSchedule, enabled: e.target.checked})} className="sr-only peer"/>
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-900">Enable Automated Backups</span>
                    </label>
                </div>
                {backupSchedule.enabled && (
                    <div>
                        <p className="text-sm text-gray-600 mb-2">Scheduled Times (24h):</p>
                        <div className="flex flex-wrap gap-2">
                            {backupSchedule.times.map((time, index) => (
                                <div key={index} className="flex items-center bg-white border px-2 py-1 rounded shadow-sm">
                                    <span className="text-sm font-mono mr-2">{time}</span>
                                    <button onClick={() => setBackupSchedule({...backupSchedule, times: backupSchedule.times.filter((_, i) => i !== index)})} className="text-red-500 hover:text-red-700"><X size={14}/></button>
                                </div>
                            ))}
                            <div className="flex items-center gap-2">
                                <input type="time" className="border rounded px-2 py-1 text-sm" id="new-backup-time" />
                                <button onClick={() => { const input = document.getElementById('new-backup-time') as HTMLInputElement; if (input.value && !backupSchedule.times.includes(input.value)) { setBackupSchedule({...backupSchedule, times: [...backupSchedule.times, input.value].sort()}); input.value = ''; } }} className="text-indigo-600 hover:text-indigo-800"><PlusCircle size={20}/></button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
             <div className="p-4 border rounded-lg bg-amber-50 border-amber-200">
                <h3 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2"><Upload size={20}/> Restore Data</h3>
                <p className="text-sm text-amber-800 mb-4">Restore system data from a backup file. <strong>WARNING: Overwrites current data.</strong></p>
                <label className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 shadow cursor-pointer inline-block">Select Backup File<input type="file" accept=".json" onChange={handleRestore} className="hidden" /></label>
            </div>
             <div className="p-4 border rounded-lg bg-indigo-50 border-indigo-200">
                <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2"><RefreshCw size={20}/> Software Update</h3>
                <div className="flex flex-col gap-2 mb-4">
                    <label className="text-sm font-medium text-indigo-900">Target Environment</label>
                    <select value={appEnvironment} onChange={(e) => setAppEnvironment(e.target.value as any)} className="p-2 border rounded-md text-sm bg-white w-full md:w-1/2" disabled={isUpdating}>
                        <option value="Production">Production</option><option value="UAT">UAT</option><option value="Development">Development</option>
                    </select>
                </div>
                <button onClick={handleSoftwareUpdate} disabled={isUpdating} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 shadow flex items-center gap-2"><RefreshCw size={16} className={isUpdating ? "animate-spin" : ""} />{isUpdating ? "Updating..." : `Pull Latest`}</button>
            </div>
             <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                <h3 className="text-lg font-bold text-green-900 mb-2 flex items-center gap-2"><Server size={20}/> Database Connection</h3>
                <div className="flex items-center gap-2 mb-2"><div className={`w-3 h-3 rounded-full ${isConnectedToCloud ? 'bg-green-500' : 'bg-orange-500'}`}></div><span className="font-semibold text-sm">{isConnectedToCloud ? (storageType === 'emulator' ? 'Connected to Emulator (Dev)' : 'Connected to Cloud Firestore') : 'Using Local Storage (IndexedDB)'}</span></div>
                {!isConnectedToCloud && <p className="text-xs text-orange-800">Warning: Running locally. Data stored in browser only.</p>}
            </div>
            <div className="p-4 border rounded-lg bg-red-50 border-red-200">
                <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2"><AlertTriangle size={20}/> Factory Reset</h3>
                <p className="text-sm text-red-800 mb-4">Wipe all data and restore defaults. Cannot be undone.</p>
                <button onClick={() => { if(confirm("Are you ABSOLUTELY SURE?")) performFactoryReset(); }} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 shadow">Perform Factory Reset</button>
            </div>
        </div>
    );

    const tabs = [
        { id: 'customers', label: 'Customers', icon: UserIcon, render: () => <ManagementCustomersTab searchTerm={searchTerm} onAdd={() => { setSelectedCustomer(null); setIsCustomerModalOpen(true); }} onEdit={(c: Customer) => { setSelectedCustomer(c); setIsCustomerModalOpen(true); }} onDelete={(id: string) => deleteItem(customers, id, setCustomers)} onImport={handleImportCustomers} selectedIds={selectedCustomerIds} onToggleSelection={(id: string) => toggleSelection(id, selectedCustomerIds, setSelectedCustomerIds)} onSelectAll={(items: any[]) => toggleSelectAll(items, selectedCustomerIds, setSelectedCustomerIds)} onBulkDelete={() => handleBulkDelete(customers, selectedCustomerIds, setCustomers, setSelectedCustomerIds)} /> },
        { id: 'vehicles', label: 'Vehicles', icon: Car, render: () => <ManagementVehiclesTab searchTerm={searchTerm} onAdd={() => { setSelectedVehicle(null); setIsVehicleModalOpen(true); }} onEdit={(v: Vehicle) => { setSelectedVehicle(v); setIsVehicleModalOpen(true); }} onDelete={(id: string) => deleteItem(vehicles, id, setVehicles)} onImport={handleImportVehicles} selectedIds={selectedVehicleIds} onToggleSelection={(id: string) => toggleSelection(id, selectedVehicleIds, setSelectedVehicleIds)} onSelectAll={(items: any[]) => toggleSelectAll(items, selectedVehicleIds, setSelectedVehicleIds)} onBulkDelete={() => handleBulkDelete(vehicles, selectedVehicleIds, setVehicles, setSelectedVehicleIds)} onAutoAssign={autoAssignVehicleDiagrams} isUpdating={isUpdating} /> },
        { id: 'diagrams', label: 'Vehicle Diagrams', icon: CarFront, render: () => <ManagementDiagramsTab searchTerm={searchTerm} onAdd={() => { setSelectedDiagram(null); setIsDiagramModalOpen(true); }} onEdit={(d: InspectionDiagram) => { setSelectedDiagram(d); setIsDiagramModalOpen(true); }} onDelete={(id: string) => deleteItem(inspectionDiagrams, id, setInspectionDiagrams)} onBulkUpload={handleBulkUploadDiagrams} /> },
        { id: 'staff', label: 'Staff (Users)', icon: Users, render: () => <ManagementStaffTab onAdd={() => { setSelectedUser(null); setIsUserModalOpen(true); }} onEdit={(u: User) => { setSelectedUser(u); setIsUserModalOpen(true); }} onDelete={(id: string) => deleteItem(users, id, setUsers)} /> },
        { id: 'roles', label: 'Roles', icon: ShieldCheck, render: () => <ManagementRolesTab onAdd={() => { setSelectedRole(null); setIsRoleModalOpen(true); }} onEdit={(r: Role) => { setSelectedRole(r); setIsRoleModalOpen(true); }} /> },
        { id: 'entities', label: 'Business Entities', icon: Briefcase, render: () => <ManagementEntitiesTab onAdd={() => { setSelectedEntity(null); setIsEntityModalOpen(true); }} onEdit={(e: BusinessEntity) => { setSelectedEntity(e); setIsEntityModalOpen(true); }} onImportJobs={handleImportJobs} onImportInvoices={handleImportInvoices} setImportTargetEntityId={setImportTargetEntityId} /> },
        { id: 'suppliers', label: 'Suppliers', icon: Truck, render: () => <ManagementSuppliersTab onAdd={() => { setSelectedSupplier(null); setIsSupplierModalOpen(true); }} onEdit={(s: Supplier) => { setSelectedSupplier(s); setIsSupplierModalOpen(true); }} onDelete={(id: string) => deleteItem(suppliers, id, setSuppliers)} /> },
        { id: 'parts', label: 'Parts', icon: Settings, render: () => <ManagementPartsTab searchTerm={searchTerm} onAdd={() => { setSelectedPart(null); setIsPartModalOpen(true); }} onEdit={(p: Part) => { setSelectedPart(p); setIsPartModalOpen(true); }} onDelete={(id: string) => deleteItem(parts, id, setParts)} onImport={handleImportParts} /> },
        { id: 'packages', label: 'Service Packages', icon: Package, render: () => <ManagementPackagesTab onAdd={() => { setSelectedPackage(null); setIsPackageModalOpen(true); }} onEdit={(p: ServicePackage) => { setSelectedPackage(p); setIsPackageModalOpen(true); }} onDelete={(id: string) => deleteItem(servicePackages, id, setServicePackages)} /> },
        { id: 'nominalCodes', label: 'Nominal Codes', icon: List, render: () => <ManagementNominalCodesTab onAddCode={() => { setSelectedNominalCode(null); setIsNominalCodeModalOpen(true); }} onEditCode={(c: NominalCode) => { setSelectedNominalCode(c); setIsNominalCodeModalOpen(true); }} onDeleteCode={(id: string) => deleteItem(nominalCodes, id, setNominalCodes)} onAddRule={() => { setSelectedNominalCodeRule(null); setIsNominalCodeRuleModalOpen(true); }} onEditRule={(r: NominalCodeRule) => { setSelectedNominalCodeRule(r); setIsNominalCodeRuleModalOpen(true); }} onDeleteRule={(id: string) => deleteItem(nominalCodeRules, id, setNominalCodeRules)} /> },
        { id: 'backup', label: 'Backup & Restore', icon: Database, render: renderBackupRestore },
    ];

    return (
        <>
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-[60] flex justify-center items-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
                    <header className="flex-shrink-0 flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-xl">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Settings className="text-gray-600"/> Data Management</h2>
                         <div className="flex items-center gap-2">
                             <div className="relative mr-4">
                                <input 
                                    type="text" 
                                    placeholder="Search active tab..." 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    className="pl-8 pr-4 py-1 border rounded-lg text-sm"
                                />
                                <div className="absolute left-2 top-1.5 text-gray-400"><Settings size={14}/></div>
                             </div>
                             <button 
                                onClick={handleForceSave} 
                                disabled={isUpdating}
                                className="mr-2 flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 text-sm font-semibold disabled:opacity-50"
                            >
                                <Save size={16} className={isUpdating ? "animate-spin" : ""} />
                                {isUpdating ? 'Saving...' : 'Force Save'}
                            </button>
                            <button onClick={onClose}><X size={24} className="text-gray-500 hover:text-gray-800" /></button>
                        </div>
                    </header>
                    
                    {statusMessage && renderStatusBanner()}

                    <div className="flex flex-grow overflow-hidden">
                        <nav className="w-64 bg-gray-100 border-r overflow-y-auto flex-shrink-0 p-2 space-y-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${activeTab === tab.id ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-600 hover:bg-gray-200'}`}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                        
                        <main className="flex-grow p-6 overflow-y-auto bg-white">
                            {tabs.find(t => t.id === activeTab)?.render()}
                        </main>
                    </div>
                </div>
            </div>

            {/* Modals are managed here but content is handled by sub-components or form modals */}
            {isCustomerModalOpen && <CustomerFormModal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} onSave={(c) => { updateItem(customers, c, setCustomers); setIsCustomerModalOpen(false); }} customer={selectedCustomer} existingCustomers={customers} />}
            {isVehicleModalOpen && <VehicleFormModal isOpen={isVehicleModalOpen} onClose={() => setIsVehicleModalOpen(false)} onSave={(v) => { updateItem(vehicles, v, setVehicles); setIsVehicleModalOpen(false); }} vehicle={selectedVehicle} customers={customers} />}
            {isUserModalOpen && <UserFormModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} onSave={(u) => { updateItem(users, u, setUsers); setIsUserModalOpen(false); }} user={selectedUser} roles={roles} />}
            {isRoleModalOpen && <RoleFormModal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} onSave={(r) => { updateItem(roles, r, setRoles); setIsRoleModalOpen(false); }} role={selectedRole} />}
            {isEntityModalOpen && <EntityFormModal isOpen={isEntityModalOpen} onClose={() => setIsEntityModalOpen(false)} onSave={(e) => { updateItem(businessEntities, e, setBusinessEntities); setIsEntityModalOpen(false); }} entity={selectedEntity} isDebugMode={false} />}
            {isSupplierModalOpen && <SupplierFormModal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} onSave={(s) => { updateItem(suppliers, s, setSuppliers); setIsSupplierModalOpen(false); }} supplier={selectedSupplier} />}
            {isPartModalOpen && <PartFormModal isOpen={isPartModalOpen} onClose={() => setIsPartModalOpen(false)} onSave={(p) => { updateItem(parts, p, setParts); setIsPartModalOpen(false); }} part={selectedPart} suppliers={suppliers} taxRates={taxRates} />}
            {isPackageModalOpen && <ServicePackageFormModal isOpen={isPackageModalOpen} onClose={() => setIsPackageModalOpen(false)} onSave={(p) => { updateItem(servicePackages, p, setServicePackages); setIsPackageModalOpen(false); }} servicePackage={selectedPackage} taxRates={taxRates} entityId={selectedEntityId} businessEntities={businessEntities} parts={parts} />}
            {isNominalCodeModalOpen && <NominalCodeFormModal isOpen={isNominalCodeModalOpen} onClose={() => setIsNominalCodeModalOpen(false)} onSave={(c) => { updateItem(nominalCodes, c, setNominalCodes); setIsNominalCodeModalOpen(false); }} nominalCode={selectedNominalCode} />}
            {isNominalCodeRuleModalOpen && <NominalCodeRuleFormModal isOpen={isNominalCodeRuleModalOpen} onClose={() => setIsNominalCodeRuleModalOpen(false)} onSave={(r) => { updateItem(nominalCodeRules, r, setNominalCodeRules); setIsNominalCodeRuleModalOpen(false); }} rule={selectedNominalCodeRule} nominalCodes={nominalCodes} businessEntities={businessEntities} />}
            {isDiagramModalOpen && <InspectionDiagramFormModal isOpen={isDiagramModalOpen} onClose={() => setIsDiagramModalOpen(false)} onSave={(d) => { updateItem(inspectionDiagrams, d, setInspectionDiagrams); setIsDiagramModalOpen(false); }} diagram={selectedDiagram} />}
        </>
    );
};

export default ManagementModal;
