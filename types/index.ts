
// types/index.ts

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
    companyName?: string; // Made optional as not all customers are businesses
}

export interface Vehicle {
    id: string;
    customerId: string;
    owner?: string; // Optional
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
    images?: { id: string, url: string, isPrimaryDiagram?: boolean }[];
    // Deprecated vehicleImages, kept for data migration if needed
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
    status: string; // Could be more specific, e.g., 'Unallocated', 'Allocated', 'In Progress'
    createdAt: string;
    isPaused?: boolean;
    pausedTimestamp?: string;
    totalPausedTime?: number;
}

export interface JobSegment {
    id: string;
    description: string;
    estimatedHours: number;
    assignedTo: string; // Engineer ID
    status: 'Pending' | 'In Progress' | 'Completed' | 'Paused';
    actualHours?: number;
    startTime?: string;
    endTime?: string;
    notes?: string;
}

export interface Invoice {
    id: string;
    entityId: string;
    jobId?: string;
    customerId: string;
    vehicleId: string;
    issueDate: string;
    dueDate: string;
    status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Void';
    lineItems: EstimateLineItem[];
    payments: Payment[];
    versionHistory: any[]; // Or a more specific type
    total?: number;
    vatAmount?: number;
    subtotal?: number;
    notes?: string;
}

export interface Estimate {
    id: string;
    estimateNumber: string;
    entityId: string;
    customerId: string;
    vehicleId: string;
    issueDate: string;
    expiryDate: string;
    status: 'Draft' | 'Sent' | 'Approved' | 'Declined' | 'Converted';
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
    totalPrice: number; // This might be calculated from items, or a fixed price
    costItems: EstimateLineItem[];
    taxCodeId: string;
    created: string;
    lastUpdated: string;
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
    source: 'Phone' | 'Email' | 'Website' | 'In-Person';
    fromName: string;
    fromContact: string; // e.g. email or phone
    message: string;
    takenByUserId: string;
    assignedToUserId?: string;
    status: 'Open' | 'In Progress' | 'Sent' | 'Approved' | 'Rejected' | 'Closed';
    linkedCustomerId?: string;
    linkedVehicleId?: string;
    linkedEstimateId?: string;
    linkedJobId?: string;
    linkedPurchaseOrderIds?: string[];
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
    role: 'Admin' | 'Dispatcher' | 'Engineer' | 'Sales' | 'User'; // Example roles
    email?: string;
    engineerId?: string; // If role is Engineer
    holidayApproverId?: string;
    holidayEntitlement?: number;
}

export interface Role {
    id: string;
    name: string;
    permissions: string[]; // List of permission keys
}

export interface BusinessEntity {
    id: string;
    name: string;
    shortCode: string;
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
}

export interface NominalCodeRule {
    id: string;
    description: string;
    criteria: any; // Simplified, should be a structured query
    nominalCodeId: string;
}

// --- Workshop & Scheduling ---

export interface Engineer {
    id: string;
    entityId: string;
    name: string;
    specialization?: string;
    color?: string; // For calendar display
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
    relatedToId: string; // e.g. Job ID, Inquiry ID
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
    treadDepth: number[]; // e.g. [inner, middle, outer]
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

// --- Sales, Storage & Rentals (Less defined, but placeholders for the errors) ---

export interface SaleVehicle {
    id: string;
    registration: string;
    make: string;
    model: string;
    purchasePrice: number;
    salePrice: number;
    status: 'For Sale' | 'Sold' | 'Under Offer';
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
    assignedToBookingId?: string; // StorageBooking ID
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
    action: string; // e.g. 'job.create', 'customer.update'
    details: any;
}

// These were placeholders before, giving them minimal structure.
export interface UnbillableTimeEvent {}
export interface EngineerChangeEvent {}
''