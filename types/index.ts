// --- Global Enums & Constants ---
export type ViewType = 
  | 'dashboard' | 'calendar' | 'list' | 'settings' | 'management' 
  | 'estimates' | 'invoices' | 'dispatch' | 'workflow' | 'jobs' 
  | 'purchaseOrders' | 'sales' | 'storage' | 'rentals' 
  | 'concierge' | 'communications' | 'absence' | 'inquiries';

export interface BackupSchedule {
    enabled: boolean;
    times: string[];
    frequency?: 'daily' | 'weekly' | 'monthly';
}

export type AppEnvironment = 'development' | 'production' | 'staging' | 'Development' | 'Production' | 'UAT' | 'uat';

// --- Core Data Models ---

export interface Customer {
    id: string;
    createdDate: string;
    title: string;
    forename: string;
    surname: string;
    phone: string;
    mobile: string;
    email: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    county: string;
    postcode: string;
    category: 'Retail' | 'Trade';
    isCashCustomer: boolean;
    marketingConsent: boolean;
    serviceReminderConsent: boolean;
    communicationPreference: 'None' | 'Email' | 'WhatsApp' | 'SMS';
    isBusinessCustomer: boolean;
    companyName?: string;
}

export interface Vehicle {
    id: string;
    customerId: string;
    owner?: string;
    registration: string;
    make: string;
    model: string;
    colour?: string;
    engineCC?: string;
    fuelType?: string;
    vin?: string;
    engineNo?: string;
    transmission?: string;
    nextServiceDue?: string;
    nextMOTDue?: string;
    winterCheck?: string;
    fleetNumber?: string;
    manufactureDate?: string;
    covid19MOTExemption?: boolean;
    // FIX: Ensure url is mandatory for diagram logic
    images?: { id: string, url: string, isPrimaryDiagram?: boolean }[];
    vehicleImages?: string[];
}

export interface Job {
    id: string;
    entityId: string;
    vehicleId: string;
    customerId: string;
    description: string;
    notes?: string;
    mileage: number;
    keyNumber?: number;
    scheduledDate: string;
    technicianObservations?: string[];
    estimateId?: string;
    invoiceId?: string;
    partsStatus?: 'Not Required' | 'Awaiting Order' | 'Ordered' | 'Partially Received' | 'Fully Received';
    estimatedHours: number;
    purchaseOrderIds?: string[];
    segments: JobSegment[];
    inspectionChecklist?: ChecklistSection[];
    tyreCheck?: TyreCheckData;
    damagePoints?: VehicleDamagePoint[];
    status: string; 
    vehicleStatus?: string;
    createdAt: string;
    isPaused?: boolean;
    pausedTimestamp?: string;
    totalPausedTime?: number;
}

export interface JobSegment {
    id: string;
    description: string;
    estimatedHours: number;
    assignedTo: string; 
    status: 'Pending' | 'In Progress' | 'Completed' | 'Paused' | 'Unallocated' | 'Engineer Complete';
    actualHours?: number;
    startTime?: string;
    endTime?: string;
    notes?: string;
    date?: string; 
    allocatedLift?: string;
    engineerId?: string;
    scheduledStartSegment?: number;
}

export interface Invoice {
    id: string;
    entityId: string;
    jobId?: string;
    customerId: string;
    vehicleId: string;
    issueDate: string;
    dueDate: string;
    status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Void' | 'Part Paid';
    lineItems: EstimateLineItem[];
    payments: Payment[];
    versionHistory: any[];
    total?: number;
    vatAmount?: number;
    subtotal?: number;
    notes?: string;
    createdByUserId?: string;
}

export interface Estimate {
    id: string;
    estimateNumber: string;
    entityId: string;
    customerId: string;
    vehicleId: string;
    issueDate: string;
    expiryDate: string;
    status: 'Draft' | 'Sent' | 'Approved' | 'Declined' | 'Converted' | 'Converted to Job' | 'Closed';
    lineItems: EstimateLineItem[];
    notes?: string;
    createdByUserId: string;
    jobId?: string;
    total?: number;
    vatAmount?: number;
    subtotal?: number;
}

export interface EstimateLineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    unitCost: number;
    isLabor: boolean;
    taxCodeId: string;
    servicePackageId?: string;
    servicePackageName?: string;
    isPackageComponent?: boolean;
    partNumber?: string;
    partId?: string;
    fromStock?: boolean;
    isOptional?: boolean;
}

export interface Part {
    id: string;
    partNumber: string;
    description: string;
    salePrice: number;
    costPrice: number;
    stockQuantity: number;
    isStockItem: boolean;
    defaultSupplierId?: string;
    taxCodeId: string;
    alternateSupplierIds?: string[];
    location?: string;
    supplierPartNumber?: string;
    notes?: string;
}

export interface PurchaseOrder {
    id: string;
    entityId: string;
    supplierId: string;
    jobId?: string;
    inquiryId?: string;
    createdByUserId: string;
    status: 'Draft' | 'Ordered' | 'Partially Received' | 'Received' | 'Cancelled';
    orderDate?: string;
    expectedDate?: string;
    lineItems: PurchaseOrderLineItem[];
    notes?: string;
    shippingCost?: number;
    supplierInvoiceRef?: string;
    vehicleRegistrationRef?: string;
}

export interface PurchaseOrderLineItem {
    id: string;
    partId?: string;
    partNumber: string;
    description: string;
    quantity: number;
    unitPrice: number;
    receivedQuantity: number;
}

export interface Purchase {
    id: string;
    entityId: string;
    supplierId: string;
    purchaseOrderId?: string;
    date: string;
    total: number;
    notes?: string;
    isPaid: boolean;
    paymentDate?: string;
}

export interface ServicePackage {
    id: string;
    entityId: string;
    name: string;
    description?: string;
    totalPrice: number;
    costItems: EstimateLineItem[];
    // FIX: Added laborItems if referenced in UI components
    laborItems?: any[]; 
    taxCodeId: string;
    created: string;
    lastUpdated: string;
    applicableMake?: string;
    applicableModel?: string;
}

export interface Supplier {
    id: string;
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    county?: string;
    postcode?: string;
    website?: string;
    notes?: string;
}

export interface Inquiry {
    id: string;
    entityId: string;
    createdAt: string;
    source: 'Phone' | 'Email' | 'Website' | 'In-Person' | string;
    fromName: string;
    fromContact: string;
    message: string;
    takenByUserId: string;
    assignedToUserId?: string;
    status: 'Open' | 'In Progress' | 'Sent' | 'Approved' | 'Rejected' | 'Closed';
    linkedCustomerId?: string;
    linkedVehicleId?: string;
    linkedEstimateId?: string;
    linkedJobId?: string;
    linkedPurchaseOrderIds?: string[];
    actionNotes?: string;
}

export interface Prospect {
    id: string;
    createdAt: string;
    name: string;
    contactInfo: string;
    source: string;
    notes: string;
    status: 'New' | 'Contacted' | 'Qualified' | 'Lost';
}

// --- System & Configuration Models ---

export interface User {
    id: string;
    name: string;
    role: 'Admin' | 'Dispatcher' | 'Engineer' | 'Sales' | 'User' | string;
    email?: string;
    password?: string;
    engineerId?: string;
    holidayApproverId?: string;
    holidayEntitlement?: number;
    allowedViews?: ViewType[];
}

export interface Role {
    id: string;
    name: string;
    permissions: string[];
    baseRole?: string;
    defaultAllowedViews?: ViewType[];
}

export interface BusinessEntity {
    id: string;
    name: string;
    shortCode: string;
    type?: string;
    color?: string;
    addressLine1?: string;
    city?: string;
    postcode?: string;
    phone?: string;
    email?: string;
    laborRate: number;
    laborCostRate: number;
    dailyCapacityHours?: number;
}

export interface TaxRate {
    id: string;
    code: string;
    name: string;
    rate: number;
}

export interface NominalCode {
    id: string;
    code: string;
    name: string;
    description?: string;
    secondaryCode?: string;
}

export interface NominalCodeRule {
    id: string;
    description: string;
    criteria: any;
    nominalCodeId: string;
    priority?: number;
    entityId?: string;
    itemType?: string;
    keywords?: string[];
    excludeKeywords?: string[];
}

// --- Workshop & Scheduling ---

export interface Engineer {
    id: string;
    entityId: string;
    name: string;
    specialization?: string;
    color?: string;
}

export interface Lift {
    id:string;
    entityId: string;
    name: string;
    type: 'General' | 'MOT' | 'Alignment';
    color?: string;
}

export interface AbsenceRequest {
    id: string;
    userId: string;
    type: 'Holiday' | 'Sickness' | 'Appointment';
    startDate: string;
    endDate: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    notes?: string;
    approverId?: string;
}

export interface Reminder {
    id: string;
    userId: string;
    relatedToId: string;
    relatedToType: 'Job' | 'Inquiry' | 'Customer';
    dueDate: string;
    message: string;
    isCompleted: boolean;
}

// --- Vehicle Inspection ---

export interface ChecklistSection {
    id: string;
    title: string;
    items: ChecklistItem[];
}

export interface ChecklistItem {
    id: string;
    text: string;
    status: 'OK' | 'Needs Attention' | 'Not Applicable';
    notes?: string;
    image?: string;
}

export interface TyreCheckData {
    frontLeft: TyreReading;
    frontRight: TyreReading;
    rearLeft: TyreReading;
    rearRight: TyreReading;
    spare?: TyreReading;
}

export interface TyreReading {
    pressure: number;
    treadDepth: number[];
    notes?: string;
}

export interface VehicleDamagePoint {
    id: string;
    x: number;
    y: number;
    diagramId: string;
    description: string;
}

export interface InspectionDiagram {
    id: string;
    name: string;
    imageUrl: string;
    make?: string;
    model?: string;
    imageId?: string;
}

// --- Financial & Payments ---

export interface Payment {
    id: string;
    date: string;
    amount: number;
    method: 'Card' | 'Cash' | 'Bank Transfer' | 'Other';
    invoiceId: string;
    notes?: string;
}

// --- Sales, Storage & Rentals ---

export interface SaleVehicle {
    id: string;
    registration: string;
    make: string;
    model: string;
    purchasePrice: number;
    salePrice: number;
    status: 'For Sale' | 'Sold' | 'Under Offer';
}

// FIX: ADDED MISSING SALES TYPES
export interface SaleUpsell {
    id: string;
    description: string;
    cost: number;
    price: number;
}

export interface SalePrepCost {
    id: string;
    description: string;
    amount: number;
    date: string;
}

export interface SaleOverhead {
    id: string;
    name: string;
    amount: number;
}

export interface ChargingEvent {
    id: string;
    date: string;
    kwh: number;
    cost: number;
}

export interface SaleNonRecoverableCost {
    id: string;
    description: string;
    amount: number;
}

export interface SaleVersion {
    id: string;
    timestamp: string;
    changes: string;
    userId: string;
}

export interface SaleOverheadPackage {
    id: string;
    name: string;
    cost: number;
}

export interface StorageBooking {
    id: string;
    vehicleId: string;
    customerId: string;
    locationId: string;
    startDate: string;
    endDate?: string;
    monthlyRate: number;
}

export interface StorageLocation {
    id: string;
    name: string;
    capacity: number;
}

export interface RentalVehicle {
    id: string;
    registration: string;
    make: string;
    model: string;
    dailyRate: number;
    isAvailable: boolean;
}

export interface RentalBooking {
    id: string;
    vehicleId: string;
    customerId: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
}

export interface BatteryCharger {
    id: string;
    name: string;
    location: string;
    assignedToBookingId?: string;
}

// --- Miscellaneous ---

export interface Note {
    id: string;
    jobId: string;
    text: string;
    userId: string;
    timestamp: string;
}

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    userId: string;
    action: string;
    details: any;
}

export interface UnbillableTimeEvent {}
export interface EngineerChangeEvent {}