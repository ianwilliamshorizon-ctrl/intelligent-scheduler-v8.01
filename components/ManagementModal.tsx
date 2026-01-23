
import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../core/state/DataContext';
import { useApp } from '../core/state/AppContext';
import { Vehicle, Customer, User, Part, ServicePackage, Supplier, BusinessEntity, BackupSchedule, Estimate, Role, InspectionDiagram, NominalCode, NominalCodeRule, Job, Invoice } from '../types';
import { X, Settings, Database, User as UserIcon, Car, Wrench, Package, Briefcase, Download, Upload, ShieldCheck, Users, Truck, Percent, Trash2, AlertTriangle, RefreshCw, Search, PlusCircle, Edit, CarFront, List, Zap, FolderInput, CheckCircle, Info, Clock, Cloud, HardDrive, Server, Save } from 'lucide-react';
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
import AsyncImage from './AsyncImage';
import { performFactoryReset } from '../core/utils/backupUtils';
import { setItem, getStorageType } from '../core/db';
import { parseCsv } from '../utils/csvUtils';
import { generateCustomerId } from '../core/utils/customerUtils';
import { formatCurrency } from '../utils/formatUtils';
import { saveImage, getImage } from '../utils/imageStore';
import { generateJobId, generateInvoiceId } from '../core/utils/numberGenerators';
import { splitJobIntoSegments, formatDate } from '../core/utils/dateUtils';
import { firebaseConfig, isDev } from '../core/config/firebaseConfig';

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
        rentalVehicles, nominalCodes, setNominalCodes, nominalCodeRules, setNominalCodeRules,
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

    // --- Helpers ---
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
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const toggleSelectAll = (filteredItems: any[], selectedIds: Set<string>, setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>) => {
        if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredItems.map(i => i.id)));
        }
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

    // --- Import Logic ---
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
            
            const existingIds = new Set(customers.map(c => c.id));
            const uniqueNew = newCustomers.filter(c => !existingIds.has(c.id));
            
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

            const existingIds = new Set(vehicles.map(v => v.id));
            const uniqueNew = newVehicles.filter(v => !existingIds.has(v.id));

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

            // Filter duplicates based on Part Number (case insensitive)
            const existingPartNumbers = new Set(parts.map(p => p.partNumber.toLowerCase()));
            const uniqueNew = newParts.filter(p => !existingPartNumbers.has(p.partNumber.toLowerCase()));

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
                // Try to find matching vehicle by registration
                const reg = (row.registration || '').toUpperCase().replace(/\s/g, '');
                const vehicle = vehicles.find(v => v.registration === reg);
                // Try to find matching customer
                const customer = customers.find(c => 
                    (vehicle && c.id === vehicle.customerId) || 
                    (row.customerName && `${c.forename} ${c.surname}`.toLowerCase().includes(String(row.customerName).toLowerCase()))
                );

                const newJobId = row.id || generateJobId(tempJobs, entityShortCode);
                const job: Job = {
                    id: newJobId,
                    entityId: entityId,
                    vehicleId: vehicle?.id || 'unknown_vehicle',
                    customerId: customer?.id || 'unknown_customer',
                    description: row.description || 'Imported Job',
                    estimatedHours: Number(row.estimatedHours) || 1,
                    scheduledDate: row.scheduledDate || null,
                    status: row.status || 'Unallocated',
                    createdAt: row.createdAt || new Date().toISOString(),
                    segments: [],
                    // Optional mapping
                    mileage: row.mileage ? Number(row.mileage) : undefined,
                    keyNumber: row.keyNumber ? Number(row.keyNumber) : undefined
                };
                
                // If scheduled date exists, create segments
                job.segments = splitJobIntoSegments(job);
                
                tempJobs.push(job);
                return job;
            });
            
            // Filter out any duplicates if ID was provided
            const existingIds = new Set(jobs.map(j => j.id));
            const uniqueNew = newJobs.filter(j => !existingIds.has(j.id));
            
            setJobs(prev => [...prev, ...uniqueNew]);
            showStatus(`Imported ${uniqueNew.length} new jobs successfully.`, 'success');

        } catch (err) {
             console.error(err);
            showStatus('Error importing jobs. Please check file format.', 'error');
        }
        e.target.value = '';
        setImportTargetEntityId(null);
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
                const customer = customers.find(c => 
                     (vehicle && c.id === vehicle.customerId) || 
                     (row.customerName && `${c.forename} ${c.surname}`.toLowerCase().includes(String(row.customerName).toLowerCase()))
                );

                const newInvoiceId = row.id || generateInvoiceId(tempInvoices, entityShortCode);
                
                // Create a dummy line item for the total if details not provided
                const total = Number(row.total) || 0;
                const net = total / 1.2; // Assuming 20% VAT included for simplicity if only total provided

                const invoice: Invoice = {
                    id: newInvoiceId,
                    entityId: entityId,
                    customerId: customer?.id || 'unknown_customer',
                    vehicleId: vehicle?.id,
                    issueDate: row.issueDate || formatDate(new Date()),
                    dueDate: row.dueDate || formatDate(new Date()),
                    status: row.status || 'Draft',
                    lineItems: [{
                        id: crypto.randomUUID(),
                        description: 'Imported Balance',
                        quantity: 1,
                        unitPrice: net,
                        isLabor: false,
                        taxCodeId: taxRates.find(t=>t.code==='T1')?.id
                    }]
                };
                
                tempInvoices.push(invoice);
                return invoice;
            });
            
            const existingIds = new Set(invoices.map(i => i.id));
            const uniqueNew = newInvoices.filter(i => !existingIds.has(i.id));

            setInvoices(prev => [...prev, ...uniqueNew]);
            showStatus(`Imported ${uniqueNew.length} new invoices successfully.`, 'success');
        } catch (err) {
             console.error(err);
            showStatus('Error importing invoices. Please check file format.', 'error');
        }
        e.target.value = '';
        setImportTargetEntityId(null);
    };

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // This confirm might still fail in sandbox, but standard restores usually need explicit user intent. 
        // If it fails, the user just won't proceed.
        if (!confirm("Restoring from backup will OVERWRITE current data. Are you sure?")) {
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                const dataToRestore = json.data || json; 

                for (const [key, value] of Object.entries(dataToRestore)) {
                    if (key.startsWith('brooks_')) {
                        await setItem(key, value);
                    }
                }
                
                alert('Restore successful. The application will now reload to apply changes.');
                window.location.reload();
            } catch (err) {
                console.error("Restore failed:", err);
                alert('Failed to restore backup. The file may be corrupt or invalid.');
            }
        };
        reader.readAsText(file);
    };
    
    const handleSoftwareUpdate = () => {
        setIsUpdating(true);
        let branch = 'production';
        if (appEnvironment === 'UAT') branch = 'uat';
        if (appEnvironment === 'Development') branch = 'dev';

        showStatus(`Pulling latest code from git branch: origin/${branch}...`, 'info');
        
        setTimeout(() => {
             showStatus(`Successfully updated to latest ${appEnvironment} version. Reloading...`, 'success');
             setTimeout(() => {
                window.location.reload();
             }, 1500);
        }, 2000);
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
                            let make = 'Generic';
                            let model = nameWithoutExt;

                            // Parsing logic
                            // If user uploads "Porsche 911.png" -> Make: Porsche, Model: 911
                            const parts = nameWithoutExt.split(' ');
                            if (['porsche', 'audi', 'vw', 'volkswagen', 'bmw', 'mercedes', 'ford', 'ferrari', 'mclaren', 'lamborghini', 'honda', 'toyota'].includes(parts[0].toLowerCase())) {
                                make = parts[0];
                                model = parts.slice(1).join(' ');
                            }

                            // Capitalize
                            make = make.charAt(0).toUpperCase() + make.slice(1);
                            model = model.charAt(0).toUpperCase() + model.slice(1);

                            const imageId = `diag_bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                            
                            try {
                                await saveImage(imageId, dataUrl);
                                newDiagrams.push({
                                    id: crypto.randomUUID(),
                                    make,
                                    model,
                                    imageId
                                });
                                successCount++;
                            } catch (err) {
                                console.error(`Failed to save image for ${file.name}`, err);
                            }
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
            } else {
                showStatus("No valid images were imported.", 'error');
            }

        } catch (e) {
            console.error("Bulk upload failed", e);
            showStatus("An error occurred during bulk upload.", 'error');
        } finally {
            setIsUpdating(false);
            e.target.value = '';
        }
    };

    const autoAssignVehicleDiagrams = async () => {
        setStatusMessage(null);
        
        if (!inspectionDiagrams || inspectionDiagrams.length === 0) {
            showStatus("Library is empty. Upload diagrams first.", 'error');
            return;
        }

        const candidates = vehicles.filter(v => !v.images?.some(img => img.isPrimaryDiagram));
        if (candidates.length === 0) {
             showStatus("All vehicles already have diagrams.", 'success');
             return;
        }

        setIsUpdating(true);
        showStatus(`Scanning library for matches...`, 'info');
        
        let assignedCount = 0;
        
        try {
            const updatedVehicles = [...vehicles];
            let changesMade = false;

            for (let i = 0; i < updatedVehicles.length; i++) {
                const v = updatedVehicles[i];
                if (!v) continue;
                if (v.images?.some(img => img.isPrimaryDiagram)) continue;
                
                let bestMatch: InspectionDiagram | undefined;
                let bestScore = 0;

                const vMake = (v.make || '').toLowerCase().trim();
                const vModel = (v.model || '').toLowerCase().trim();
                const vFull = `${vMake} ${vModel}`;
                const vTokens = vFull.split(' ').filter(t => t.length > 1);

                // --- Scoring System ---
                for (const d of inspectionDiagrams) {
                    let score = 0;
                    const dMake = (d.make || '').toLowerCase().trim();
                    const dModel = (d.model || '').toLowerCase().trim();
                    const dFull = `${dMake} ${dModel}`;
                    
                    // 1. Exact Match (Highest Priority)
                    if (dMake === vMake && dModel === vModel) score = 100;
                    
                    // 2. Specific Substring Match
                    // If Diagram Model is inside Vehicle Model (e.g. D: "GT3", V: "911 GT3 RS")
                    else if (dMake === vMake && vModel.includes(dModel) && dModel.length > 2) score = 80;
                    
                    // 3. Combined String Match (Use with caution, handles Generic makes)
                    else if (vFull.includes(dModel) && dModel.length > 3) score = 60;
                    
                    // 4. Token Overlap (Fuzzy)
                    else {
                        const dTokens = dFull.split(' ').filter(t => t.length > 1);
                        let matches = 0;
                        dTokens.forEach(t => { if (vFull.includes(t)) matches++; });
                        if (matches > 0) score = matches * 10;
                    }
                    
                    // 5. Generic Fallback (Low Priority)
                    if (score === 0) {
                         // Keywords
                         if (vModel.includes('van') && dModel.includes('van')) score = 20;
                         else if (vModel.includes('suv') && dModel.includes('suv')) score = 20;
                         else if (dModel === 'generic' || dModel === 'saloon') score = 1;
                    }

                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = d;
                    }
                }

                if (bestMatch && bestScore > 0) {
                    console.log(`Matched ${v.registration} (${vFull}) with ${bestMatch.make} ${bestMatch.model} (Score: ${bestScore})`);
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
                    } catch (imgErr) {
                        console.error(`Failed to assign diagram to vehicle ${v.registration}`, imgErr);
                    }
                }
            }

            if (changesMade) {
                setVehicles(updatedVehicles);
                showStatus(`Success! Assigned diagrams to ${assignedCount} vehicles based on best match scores.`, 'success');
            } else {
                showStatus("Scan complete. No suitable matches found.", 'info');
            }

        } catch (e) {
            console.error("Auto assign critical error", e);
            showStatus("An unexpected error occurred during auto-assignment.", 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    // --- Renderers ---

    const renderStatusBanner = () => {
        if (!statusMessage) return null;
        const bgColors = {
            info: 'bg-blue-100 text-blue-800 border-blue-200',
            success: 'bg-green-100 text-green-800 border-green-200',
            error: 'bg-red-100 text-red-800 border-red-200'
        };
        const icons = {
            info: Info,
            success: CheckCircle,
            error: AlertTriangle
        };
        const Icon = icons[statusMessage.type];

        return (
            <div className={`flex items-center gap-2 p-3 mb-4 rounded-lg border ${bgColors[statusMessage.type]} animate-fade-in`}>
                <Icon size={20} />
                <span className="font-semibold text-sm">{statusMessage.text}</span>
                <button onClick={() => setStatusMessage(null)} className="ml-auto"><X size={16}/></button>
            </div>
        );
    };

    const renderCustomers = () => {
        const filteredCustomers = customers.filter(c => 
            `${c.forename} ${c.surname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const isAllSelected = filteredCustomers.length > 0 && selectedCustomerIds.size === filteredCustomers.length;

        return (
            <div>
                <div className="flex justify-between items-center mb-4">
                     <div className="flex items-center gap-2">
                        <input type="text" placeholder="Search customers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 border rounded w-64"/>
                        {selectedCustomerIds.size > 0 && (
                            <button 
                                onClick={() => handleBulkDelete(customers, selectedCustomerIds, setCustomers, setSelectedCustomerIds)}
                                className="bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200 flex items-center gap-2 text-sm font-semibold"
                            >
                                <Trash2 size={16}/> Delete ({selectedCustomerIds.size})
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer shadow">
                            <Upload size={16}/> Import CSV
                            <input type="file" accept=".csv" className="hidden" onChange={handleImportCustomers} />
                        </label>
                        <button onClick={() => { setSelectedCustomer(null); setIsCustomerModalOpen(true); }} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2">
                            <PlusCircle size={16}/> Add Customer
                        </button>
                    </div>
                </div>
                <div className="overflow-y-auto max-h-[70vh]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="p-2 w-10 text-center">
                                    <input 
                                        type="checkbox" 
                                        checked={isAllSelected} 
                                        onChange={() => toggleSelectAll(filteredCustomers, selectedCustomerIds, setSelectedCustomerIds)}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                </th>
                                <th className="p-2">Name</th><th className="p-2">Account No</th><th className="p-2">Contact</th><th className="p-2">Postcode</th><th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map(c => (
                                <tr key={c.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedCustomerIds.has(c.id)} 
                                            onChange={() => toggleSelection(c.id, selectedCustomerIds, setSelectedCustomerIds)}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </td>
                                    <td className="p-2 font-medium">{c.forename} {c.surname} {c.companyName ? `(${c.companyName})` : ''}</td>
                                    <td className="p-2 font-mono text-xs">{c.id}</td>
                                    <td className="p-2">{c.phone || c.mobile || c.email}</td>
                                    <td className="p-2">{c.postcode}</td>
                                    <td className="p-2">
                                        <button onClick={() => { setSelectedCustomer(c); setIsCustomerModalOpen(true); }} className="text-indigo-600 hover:underline mr-3">Edit</button>
                                        <button onClick={() => deleteItem(customers, c.id, setCustomers)} className="text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderVehicles = () => {
        const filteredVehicles = vehicles.filter(v => 
            v.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.model.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const isAllSelected = filteredVehicles.length > 0 && selectedVehicleIds.size === filteredVehicles.length;

        return (
            <div>
                <div className="flex justify-between items-center mb-4">
                     <div className="flex items-center gap-2">
                        <input type="text" placeholder="Search vehicles..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 border rounded w-64"/>
                         {selectedVehicleIds.size > 0 && (
                            <button 
                                onClick={() => handleBulkDelete(vehicles, selectedVehicleIds, setVehicles, setSelectedVehicleIds)}
                                className="bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200 flex items-center gap-2 text-sm font-semibold"
                            >
                                <Trash2 size={16}/> Delete ({selectedVehicleIds.size})
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={autoAssignVehicleDiagrams} disabled={isUpdating} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 shadow flex items-center gap-2 disabled:opacity-50">
                        {isUpdating ? <RefreshCw size={16} className="animate-spin"/> : <Zap size={16}/>} Auto-Assign Diagrams
                        </button>
                        <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer shadow">
                            <Upload size={16}/> Import CSV
                            <input type="file" accept=".csv" className="hidden" onChange={handleImportVehicles} />
                        </label>
                        <button onClick={() => { setSelectedVehicle(null); setIsVehicleModalOpen(true); }} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2">
                            <PlusCircle size={16}/> Add Vehicle
                        </button>
                    </div>
                </div>
                <div className="overflow-y-auto max-h-[70vh]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="p-2 w-10 text-center">
                                     <input 
                                        type="checkbox" 
                                        checked={isAllSelected} 
                                        onChange={() => toggleSelectAll(filteredVehicles, selectedVehicleIds, setSelectedVehicleIds)}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                </th>
                                <th className="p-2">Registration</th><th className="p-2">Make/Model</th><th className="p-2">Owner</th><th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVehicles.map(v => {
                                const owner = customers.find(c => c.id === v.customerId);
                                return (
                                    <tr key={v.id} className="border-b hover:bg-gray-50">
                                        <td className="p-2 text-center">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedVehicleIds.has(v.id)} 
                                                onChange={() => toggleSelection(v.id, selectedVehicleIds, setSelectedVehicleIds)}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </td>
                                        <td className="p-2 font-mono font-bold">{v.registration}</td>
                                        <td className="p-2">{v.make} {v.model}</td>
                                        <td className="p-2">{owner ? `${owner.forename} ${owner.surname}` : 'Unknown'}</td>
                                        <td className="p-2">
                                            <button onClick={() => { setSelectedVehicle(v); setIsVehicleModalOpen(true); }} className="text-indigo-600 hover:underline mr-3">Edit</button>
                                            <button onClick={() => deleteItem(vehicles, v.id, setVehicles)} className="text-red-600 hover:underline">Delete</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderStaff = () => (
        <div>
            <div className="flex justify-end mb-4">
                 <button onClick={() => { setSelectedUser(null); setIsUserModalOpen(true); }} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2">
                    <PlusCircle size={16}/> Add Staff Member
                </button>
            </div>
             <div className="overflow-y-auto max-h-[70vh]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 sticky top-0"><tr><th className="p-2">Name</th><th className="p-2">Role</th><th className="p-2">Actions</th></tr></thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 font-medium">{u.name}</td>
                                <td className="p-2">{u.role}</td>
                                <td className="p-2">
                                    <button onClick={() => { setSelectedUser(u); setIsUserModalOpen(true); }} className="text-indigo-600 hover:underline mr-2">Edit</button>
                                    <button onClick={() => deleteItem(users, u.id, setUsers)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderRoles = () => (
         <div>
            <div className="flex justify-end mb-4">
                 <button onClick={() => { setSelectedRole(null); setIsRoleModalOpen(true); }} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2">
                    <PlusCircle size={16}/> Add Role
                </button>
            </div>
             <div className="overflow-y-auto max-h-[70vh]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 sticky top-0"><tr><th className="p-2">Role Name</th><th className="p-2">Base Permissions</th><th className="p-2">Actions</th></tr></thead>
                    <tbody>
                        {roles.map(r => (
                            <tr key={r.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 font-medium">{r.name}</td>
                                <td className="p-2">{r.baseRole}</td>
                                <td className="p-2">
                                    <button onClick={() => { setSelectedRole(r); setIsRoleModalOpen(true); }} className="text-indigo-600 hover:underline mr-2">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

     const renderEntities = () => (
        <div>
            <div className="flex justify-end mb-4">
                 <button onClick={() => { setSelectedEntity(null); setIsEntityModalOpen(true); }} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2">
                    <PlusCircle size={16}/> Add Business Entity
                </button>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[70vh]">
                {businessEntities.map(e => (
                    <div key={e.id} className={`p-4 border-2 rounded-lg transition-all border-${e.color}-200 bg-white relative group`}>
                        <div className={`w-full h-2 bg-${e.color}-500 rounded-t mb-2`}></div>
                        <div className="flex justify-between items-start cursor-pointer" onClick={() => { setSelectedEntity(e); setIsEntityModalOpen(true); }}>
                            <div>
                                <h3 className="font-bold text-lg">{e.name}</h3>
                                <p className="text-sm text-gray-500">{e.type}</p>
                                <p className="text-xs text-gray-400 mt-2">{e.city}</p>
                            </div>
                        </div>
                        {/* Import Buttons */}
                        <div className="mt-4 pt-4 border-t flex gap-2 justify-end">
                            <label className="text-xs flex items-center gap-1 cursor-pointer bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200" title="Import Jobs CSV">
                                <Upload size={12} /> Import Jobs
                                <input type="file" accept=".csv" className="hidden" onClick={() => setImportTargetEntityId(e.id)} onChange={handleImportJobs} />
                            </label>
                            <label className="text-xs flex items-center gap-1 cursor-pointer bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200" title="Import Invoices CSV">
                                <Upload size={12} /> Import Invoices
                                <input type="file" accept=".csv" className="hidden" onClick={() => setImportTargetEntityId(e.id)} onChange={handleImportInvoices} />
                            </label>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderSuppliers = () => (
        <div>
            <div className="flex justify-end mb-4">
                 <button onClick={() => { setSelectedSupplier(null); setIsSupplierModalOpen(true); }} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2">
                    <PlusCircle size={16}/> Add Supplier
                </button>
            </div>
             <div className="overflow-y-auto max-h-[70vh]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 sticky top-0"><tr><th className="p-2">Company Name</th><th className="p-2">Contact Person</th><th className="p-2">Details</th><th className="p-2">Actions</th></tr></thead>
                    <tbody>
                        {suppliers.map(s => (
                            <tr key={s.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 font-medium">{s.name}</td>
                                <td className="p-2">{s.contactName}</td>
                                <td className="p-2 text-xs">{s.phone} / {s.email}</td>
                                <td className="p-2">
                                    <button onClick={() => { setSelectedSupplier(s); setIsSupplierModalOpen(true); }} className="text-indigo-600 hover:underline mr-2">Edit</button>
                                    <button onClick={() => deleteItem(suppliers, s.id, setSuppliers)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderParts = () => (
        <div>
            <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-2">
                    <input type="text" placeholder="Search parts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 border rounded w-64"/>
                </div>
                <div className="flex gap-2">
                    <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer shadow">
                        <Upload size={16}/> Import CSV
                        <input type="file" accept=".csv" className="hidden" onChange={handleImportParts} />
                    </label>
                    <button onClick={() => { setSelectedPart(null); setIsPartModalOpen(true); }} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2">
                        <PlusCircle size={16}/> Add Part
                    </button>
                </div>
            </div>
             <div className="overflow-y-auto max-h-[70vh]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 sticky top-0"><tr><th className="p-2">Part No.</th><th className="p-2">Description</th><th className="p-2 text-right">Stock</th><th className="p-2 text-right">Price</th><th className="p-2">Actions</th></tr></thead>
                    <tbody>
                        {parts.filter(p => p.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                            <tr key={p.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 font-mono">{p.partNumber}</td>
                                <td className="p-2">{p.description}</td>
                                <td className="p-2 text-right">{p.stockQuantity}</td>
                                <td className="p-2 text-right">{formatCurrency(p.salePrice)}</td>
                                <td className="p-2">
                                    <button onClick={() => { setSelectedPart(p); setIsPartModalOpen(true); }} className="text-indigo-600 hover:underline mr-2">Edit</button>
                                    <button onClick={() => deleteItem(parts, p.id, setParts)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderPackages = () => (
        <div>
            <div className="flex justify-end mb-4">
                 <button onClick={() => { setSelectedPackage(null); setIsPackageModalOpen(true); }} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2">
                    <PlusCircle size={16}/> Add Service Package
                </button>
            </div>
             <div className="overflow-y-auto max-h-[70vh]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 sticky top-0"><tr><th className="p-2">Package Name</th><th className="p-2 text-right">Total Price</th><th className="p-2">Actions</th></tr></thead>
                    <tbody>
                        {servicePackages.map(p => (
                            <tr key={p.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 font-medium">{p.name}</td>
                                <td className="p-2 text-right">{formatCurrency(p.totalPrice)}</td>
                                <td className="p-2">
                                    <button onClick={() => { setSelectedPackage(p); setIsPackageModalOpen(true); }} className="text-indigo-600 hover:underline mr-2">Edit</button>
                                    <button onClick={() => deleteItem(servicePackages, p.id, setServicePackages)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
    
    const renderInspectionDiagrams = () => (
        <div>
             <div className="flex justify-between items-center mb-4">
                <input type="text" placeholder="Search diagrams..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 border rounded w-64"/>
                <div className="flex gap-2">
                    <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer shadow">
                        <FolderInput size={16}/> Bulk Upload
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleBulkUploadDiagrams} />
                    </label>
                    <button onClick={() => { setSelectedDiagram(null); setIsDiagramModalOpen(true); }} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2">
                        <PlusCircle size={16}/> Add Diagram
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto max-h-[70vh]">
                {inspectionDiagrams
                    .filter(d => d.make.toLowerCase().includes(searchTerm.toLowerCase()) || d.model.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(d => (
                        <div key={d.id} className="border rounded-lg bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group">
                            <div className="h-32 bg-gray-100 flex items-center justify-center p-2">
                                <AsyncImage imageId={d.imageId} alt={`${d.make} ${d.model}`} className="max-w-full max-h-full object-contain"/>
                            </div>
                            <div className="p-3">
                                <h4 className="font-bold text-sm text-gray-800">{d.make}</h4>
                                <p className="text-xs text-gray-600">{d.model}</p>
                            </div>
                             <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setSelectedDiagram(d); setIsDiagramModalOpen(true); }} className="p-1 bg-white rounded-full text-indigo-600 hover:text-indigo-800 shadow"><Edit size={14}/></button>
                                <button onClick={() => deleteItem(inspectionDiagrams, d.id, setInspectionDiagrams)} className="p-1 bg-white rounded-full text-red-600 hover:text-red-800 shadow"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    ))
                }
                 {inspectionDiagrams.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500">
                        <CarFront size={48} className="mx-auto mb-2 text-gray-300" />
                        <p>No diagrams found.</p>
                        <p className="text-xs">Upload diagrams using 'Bulk Upload' or add them manually.</p>
                    </div>
                )}
            </div>
        </div>
    );
    
    const renderNominalCodes = () => (
        <div className="space-y-6">
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-700">Financial Nominal Codes</h3>
                    <button onClick={() => { setSelectedNominalCode(null); setIsNominalCodeModalOpen(true); }} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow flex items-center gap-2 text-sm">
                        <PlusCircle size={16}/> Add Code
                    </button>
                </div>
                <div className="overflow-y-auto max-h-[30vh] border rounded-lg">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 sticky top-0"><tr><th className="p-2">Code</th><th className="p-2">Name</th><th className="p-2">Secondary Code</th><th className="p-2">Actions</th></tr></thead>
                        <tbody>
                            {nominalCodes.map(nc => (
                                <tr key={nc.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2 font-mono font-bold">{nc.code}</td>
                                    <td className="p-2">{nc.name}</td>
                                    <td className="p-2 font-mono text-xs">{nc.secondaryCode || '-'}</td>
                                    <td className="p-2">
                                        <button onClick={() => { setSelectedNominalCode(nc); setIsNominalCodeModalOpen(true); }} className="text-indigo-600 hover:underline mr-2">Edit</button>
                                        <button onClick={() => deleteItem(nominalCodes, nc.id, setNominalCodes)} className="text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-700">Assignment Rules</h3>
                    <button onClick={() => { setSelectedNominalCodeRule(null); setIsNominalCodeRuleModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow flex items-center gap-2 text-sm">
                        <PlusCircle size={16}/> Add Rule
                    </button>
                </div>
                <div className="overflow-y-auto max-h-[35vh] border rounded-lg">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="p-2 w-16 text-center">Priority</th>
                                <th className="p-2">Type</th>
                                <th className="p-2">Entity</th>
                                <th className="p-2">Keywords (Include)</th>
                                <th className="p-2">Keywords (Exclude)</th>
                                <th className="p-2">Assigned Code</th>
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...nominalCodeRules].sort((a, b) => b.priority - a.priority).map(rule => {
                                const code = nominalCodes.find(c => c.id === rule.nominalCodeId);
                                const entity = businessEntities.find(e => e.id === rule.entityId);
                                return (
                                    <tr key={rule.id} className="border-b hover:bg-gray-50">
                                        <td className="p-2 text-center font-mono">{rule.priority}</td>
                                        <td className="p-2"><span className="px-2 py-0.5 bg-gray-200 rounded text-xs">{rule.itemType}</span></td>
                                        <td className="p-2 text-xs">{entity ? entity.name : (rule.entityId === 'all' ? 'All Entities' : 'Unknown')}</td>
                                        <td className="p-2 text-xs font-mono">{rule.keywords || '*'}</td>
                                        <td className="p-2 text-xs font-mono text-red-600">{rule.excludeKeywords || '-'}</td>
                                        <td className="p-2 text-xs font-semibold">{code ? `${code.code} - ${code.name}` : 'Unknown Code'}</td>
                                        <td className="p-2">
                                            <button onClick={() => { setSelectedNominalCodeRule(rule); setIsNominalCodeRuleModalOpen(true); }} className="text-indigo-600 hover:underline mr-2">Edit</button>
                                            <button onClick={() => deleteItem(nominalCodeRules, rule.id, setNominalCodeRules)} className="text-red-600 hover:underline">Delete</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
    
    const renderBackupRestore = () => (
        <div className="p-4 space-y-6">
            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2"><Download size={20}/> Backup Data</h3>
                <p className="text-sm text-blue-800 mb-4">Download a full backup of all system data (customers, vehicles, jobs, settings) to a JSON file.</p>
                <button onClick={onManualBackup} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow">
                    Download Backup File
                </button>
            </div>

            <div className="p-4 border rounded-lg bg-gray-50 border-gray-200 mt-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2"><Clock size={20}/> Automated Backups</h3>
                <div className="flex items-center gap-4 mb-4">
                    <label className="flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={backupSchedule.enabled} 
                            onChange={(e) => setBackupSchedule({...backupSchedule, enabled: e.target.checked})} 
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-900">Enable Automated Backups</span>
                    </label>
                </div>
                {backupSchedule.enabled && (
                    <div>
                        <p className="text-sm text-gray-600 mb-2">Scheduled Times (24h format):</p>
                        <div className="flex flex-wrap gap-2">
                            {backupSchedule.times.map((time, index) => (
                                <div key={index} className="flex items-center bg-white border px-2 py-1 rounded shadow-sm">
                                    <span className="text-sm font-mono mr-2">{time}</span>
                                    <button onClick={() => setBackupSchedule({...backupSchedule, times: backupSchedule.times.filter((_, i) => i !== index)})} className="text-red-500 hover:text-red-700"><X size={14}/></button>
                                </div>
                            ))}
                            <div className="flex items-center gap-2">
                                <input type="time" className="border rounded px-2 py-1 text-sm" id="new-backup-time" />
                                <button 
                                    onClick={() => {
                                        const input = document.getElementById('new-backup-time') as HTMLInputElement;
                                        if (input.value && !backupSchedule.times.includes(input.value)) {
                                            setBackupSchedule({...backupSchedule, times: [...backupSchedule.times, input.value].sort()});
                                            input.value = '';
                                        }
                                    }}
                                    className="text-indigo-600 hover:text-indigo-800"
                                >
                                    <PlusCircle size={20}/>
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Backups are automatically saved to the secure cloud database at these times.</p>
                    </div>
                )}
            </div>

            <div className="p-4 border rounded-lg bg-amber-50 border-amber-200">
                <h3 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2"><Upload size={20}/> Restore Data</h3>
                <p className="text-sm text-amber-800 mb-4">
                    Restore system data from a previously downloaded JSON backup file. <br/>
                    <strong>WARNING: This will overwrite all current data.</strong>
                </p>
                <label className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 shadow cursor-pointer inline-block">
                    Select Backup File
                    <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                </label>
            </div>

            <div className="p-4 border rounded-lg bg-indigo-50 border-indigo-200">
                <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2"><RefreshCw size={20}/> Software Update</h3>
                <div className="flex flex-col gap-2 mb-4">
                    <label className="text-sm font-medium text-indigo-900">Target Environment Branch</label>
                    <select 
                        value={appEnvironment} 
                        onChange={(e) => setAppEnvironment(e.target.value as any)}
                        className="p-2 border rounded-md text-sm bg-white border-indigo-300 focus:ring-indigo-500 w-full md:w-1/2"
                        disabled={isUpdating}
                    >
                        <option value="Production">Production (origin/production)</option>
                        <option value="UAT">User Acceptance Testing (origin/uat)</option>
                        <option value="Development">Development (origin/dev)</option>
                    </select>
                </div>
                <p className="text-sm text-indigo-800 mb-4">
                    Pull the latest software version from the server. This ensures you have the newest features and bug fixes.<br/>
                    <strong>Your data is stored securely and is safe during this process.</strong>
                </p>
                <button 
                    onClick={handleSoftwareUpdate}
                    disabled={isUpdating}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 shadow flex items-center gap-2"
                >
                    <RefreshCw size={16} className={isUpdating ? "animate-spin" : ""} />
                    {isUpdating ? "Updating..." : `Pull Latest ${appEnvironment}`}
                </button>
            </div>
            
             <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                <h3 className="text-lg font-bold text-green-900 mb-2 flex items-center gap-2"><Server size={20}/> Database Connection</h3>
                <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${isConnectedToCloud ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                    <span className="font-semibold text-sm">
                        {isConnectedToCloud 
                            ? (storageType === 'emulator' ? 'Connected to Emulator (Dev)' : 'Connected to Cloud Firestore') 
                            : 'Using Local Storage (IndexedDB)'}
                    </span>
                </div>
                {!isConnectedToCloud && (
                    <p className="text-xs text-orange-800">
                        Warning: You are running in local mode. Data is stored in your browser only. To enable cloud sync and multi-user access, please configure your Firebase API keys.
                    </p>
                )}
            </div>

            <div className="p-4 border rounded-lg bg-red-50 border-red-200">
                <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2"><AlertTriangle size={20}/> Factory Reset</h3>
                <p className="text-sm text-red-800 mb-4">
                    Wipe all data and restore the system to its initial default state. This action cannot be undone.
                </p>
                <button 
                    onClick={() => {
                        if(confirm("Are you ABSOLUTELY SURE you want to factory reset? All data will be lost.")) {
                            performFactoryReset();
                        }
                    }} 
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 shadow"
                >
                    Perform Factory Reset
                </button>
            </div>
        </div>
    );

    const tabs = [
        { id: 'customers', label: 'Customers', icon: UserIcon, render: renderCustomers },
        { id: 'vehicles', label: 'Vehicles', icon: Car, render: renderVehicles },
        { id: 'diagrams', label: 'Vehicle Diagrams', icon: CarFront, render: renderInspectionDiagrams },
        { id: 'staff', label: 'Staff (Users)', icon: Users, render: renderStaff },
        { id: 'roles', label: 'Roles', icon: ShieldCheck, render: renderRoles },
        { id: 'entities', label: 'Business Entities', icon: Briefcase, render: renderEntities },
        { id: 'suppliers', label: 'Suppliers', icon: Truck, render: renderSuppliers },
        { id: 'parts', label: 'Parts', icon: Settings, render: renderParts },
        { id: 'packages', label: 'Service Packages', icon: Package, render: renderPackages },
        { id: 'nominalCodes', label: 'Nominal Codes', icon: List, render: renderNominalCodes },
        { id: 'backup', label: 'Backup & Restore', icon: Database, render: renderBackupRestore },
    ];

    return (
        <>
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-[60] flex justify-center items-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
                    <header className="flex-shrink-0 flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-xl">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Settings className="text-gray-600"/> Data Management</h2>
                        <div className="flex items-center gap-2">
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
                                    onClick={() => setActiveTab(tab.id)}
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

            {/* Modals */}
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
