
export interface Note {
    id: string;
    jobId: string;
    text: string;
    userId: string;
    timestamp: string;
}

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
    companyName: string;
}

export interface Vehicle {
    id: string;
    customerId: string;
    owner: string;
    registration: string;
    make: string;
    model: string;
    colour: string;
    engineCC: string;
    fuelType: string;
    vin: string;
    engineNo: string;
    transmission: string;
    nextServiceDue: string;
    nextMOTDue: string;
    winterCheck: string;
    fleetNumber: string;
    manufactureDate: string;
    covid19MOTExemption: boolean;
    vehicleImages: string[];
    images?: { id: string, url: string, isPrimaryDiagram?: boolean }[];
}

export interface Job {
    id: string;
    vehicleId: string;
    customerId: string;
    description: string;
    notes: string;
    mileage: number;
    keyNumber: number;
    scheduledDate: string;
    technicianObservations: string[];
    estimateId: string;
    invoiceId: string;
    partsStatus: 'Not Required' | 'Awaiting Order' | 'Ordered' | 'Partially Received' | 'Fully Received';
    estimatedHours: number;
    purchaseOrderIds: string[];
    segments: JobSegment[];
    inspectionChecklist: ChecklistSection[];
    tyreCheck: TyreCheckData;
    damagePoints: VehicleDamagePoint[];
    status: string;
    entityId: string;
    createdAt: string;
}

export interface JobSegment {
    id: string;
    description: string;
    estimatedHours: number;
    assignedTo: string;
    status: 'Pending' | 'In Progress' | 'Completed';
}

export interface Part {
    id: string;
    partNumber: string;
    description: string;
    salePrice: number;
    costPrice: number;
    stockQuantity: number;
    isStockItem: boolean;
    defaultSupplierId: string;
    taxCodeId: string;
    alternateSupplierIds: string[];
}

export interface ServicePackage {
    id: string;
    entityId: string;
    name: string;
    description: string;
    totalPrice: number;
    costItems: EstimateLineItem[];
    taxCodeId: string;
}

export interface Invoice {
    id: string;
    jobId: string;
    customerId: string;
    vehicleId: string;
    entityId: string;
    issueDate: string;
    dueDate: string;
    status: 'Draft' | 'Sent' | 'Part Paid' | 'Paid' | 'Overdue';
    lineItems: EstimateLineItem[];
    notes?: string;
    payments: Payment[];
    versionHistory: Invoice[];
}

export interface Estimate {
    id: string;
    estimateNumber: string;
    entityId: string;
    customerId: string;
    vehicleId: string;
    issueDate: string;
    expiryDate: string;
    status: 'Draft' | 'Sent' | 'Approved' | 'Declined';
    lineItems: EstimateLineItem[];
    notes?: string;
    createdByUserId: string;
    jobId?: string;
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

export interface Payment {
    id: string;
    date: string;
    amount: number;
    method: 'Card' | 'Cash' | 'Bank Transfer';
}

// Placeholder interfaces
export interface Engineer {}
export interface Lift {}
export interface TaxRate { id: string; code: string; name: string; rate: number; }
export interface BusinessEntity { id: string; name: string; shortCode: string; laborRate: number; laborCostRate: number;}
export interface RentalBooking {}
export interface User {}
export interface PurchaseOrder {}
export interface Supplier {}
export interface UnbillableTimeEvent {}
export interface EngineerChangeEvent {}
export interface PurchaseOrderLineItem {}
export interface ChecklistSection {}
export interface TyreCheckData {}
export interface VehicleDamagePoint {}

