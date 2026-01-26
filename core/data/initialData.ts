import {
    BusinessEntity, Customer, Vehicle, Job, JobSegment, Lift, Engineer, Invoice,
    Supplier, Estimate, TaxRate, ServicePackage, Part, SaleVehicle, SaleOverheadPackage,
    StorageBooking, RentalVehicle, RentalBooking, StorageLocation, BatteryCharger,
    User, NominalCode, NominalCodeRule, PurchaseOrder, Purchase, AbsenceRequest, Prospect, Inquiry,
    Reminder, AuditLogEntry, Role, InspectionDiagram
  } from '../../types'; // Ensure this points to your central types file
  import { getRelativeDate, formatDate, splitJobIntoSegments } from '../utils/dateUtils';
  import { generateCustomerId } from '../utils/customerUtils';
  import { generateJobId, generateEstimateNumber, generateInvoiceId } from '../utils/numberGenerators';
  import { calculateJobStatus } from '../utils/jobUtils';
  
  // --- Data Generation ---
  
  export const getInitialUsers = (): User[] => {
    const users: User[] = [
      { id: 'user_admin', name: 'Admin User', role: 'Admin', holidayApproverId: 'user_admin', holidayEntitlement: 26 },
      { id: 'user_sales', name: 'Sales User', role: 'Sales', holidayApproverId: 'user_admin', holidayEntitlement: 26 },
      { id: 'user_phil_f', name: 'Phil F', role: 'Dispatcher', holidayApproverId: 'user_admin', holidayEntitlement: 26 },
      { id: 'user_tim', name: 'Tim', role: 'Dispatcher', holidayApproverId: 'user_admin', holidayEntitlement: 26 },
      { id: 'user_phil', name: 'Phil', role: 'Dispatcher', holidayApproverId: 'user_admin', holidayEntitlement: 26 },
      { id: 'user_lewis', name: 'Lewis', role: 'Engineer', engineerId: 'eng_lewis', holidayApproverId: 'user_phil_f', holidayEntitlement: 26 },
      { id: 'user_emma', name: 'Emma', role: 'Engineer', engineerId: 'eng_emma', holidayApproverId: 'user_phil_f', holidayEntitlement: 26 },
      { id: 'user_gary', name: 'Gary', role: 'Engineer', engineerId: 'eng_gary', holidayApproverId: 'user_phil_f', holidayEntitlement: 26 },
      { id: 'user_olly', name: 'Olly', role: 'Engineer', engineerId: 'eng_olly', holidayApproverId: 'user_phil_f', holidayEntitlement: 26 },
      { id: 'user_mike_audi', name: 'Mike', role: 'Engineer', engineerId: 'eng_mike_audi', holidayApproverId: 'user_phil', holidayEntitlement: 26 },
      { id: 'user_dan', name: 'Dan', role: 'Engineer', engineerId: 'eng_dan', holidayApproverId: 'user_phil', holidayEntitlement: 26 },
      { id: 'user_sam', name: 'Sam', role: 'Engineer', engineerId: 'eng_sam', holidayApproverId: 'user_phil', holidayEntitlement: 26 },
      { id: 'user_vincent', name: 'Vincent', role: 'Engineer', engineerId: 'eng_vincent', holidayApproverId: 'user_tim', holidayEntitlement: 26 },
    ];
  
    return users
      .filter(u => u && typeof u.name === 'string') // FIX: Prevents .toLowerCase() crashes on undefined names
      .sort((a, b) => a.name.localeCompare(b.name));
  };
  
  export const getInitialBusinessEntities = (): BusinessEntity[] => ([
    {
      id: 'ent_porsche', name: 'Brookspeed Porsche & Performance', shortCode: 'BPP', color: 'blue',
      addressLine1: '14-15 Test Lane', city: 'Southampton', postcode: 'SO16 9JX',
      laborRate: 125, laborCostRate: 45, dailyCapacityHours: 40
    } as any,
    { id: 'ent_audi', name: 'Brookspeed Audi & VW', shortCode: 'BAV', color: 'gray' } as any,
    { id: 'ent_trimming', name: 'Brookspeed Trimming', shortCode: 'BTR', color: 'yellow' } as any,
    { id: 'ent_sales', name: 'Brookspeed Sales', shortCode: 'BSA', color: 'green' } as any,
    { id: 'ent_storage', name: 'Brookspeed Secure Storage', shortCode: 'BSS', color: 'purple' } as any,
    { id: 'ent_rentals', name: 'Brookspeed Rentals', shortCode: 'BRE', color: 'pink' } as any
  ]);
  
  export const getInitialTaxRates = (): TaxRate[] => ([
    { id: 'tax_1', code: 'T0', name: 'VAT Exempt', rate: 0 },
    { id: 'tax_2', code: 'T1', name: 'Standard VAT', rate: 20 },
  ]);
  
  export const getInitialCustomers = (): Customer[] => ([
    {
      id: 'OCON0001', title: 'Mr', forename: 'Liam', surname: "O'Connell", phone: '07700900101', mobile: '', email: 'liam.oc@example.com',
      addressLine1: '12 Porsche Drive', addressLine2: '', city: 'Southampton', county: 'Hampshire', postcode: 'SO15 1XX',
      createdDate: getRelativeDate(-120), marketingConsent: true, serviceReminderConsent: true, communicationPreference: 'Email',
      isBusinessCustomer: false, isCashCustomer: false, category: 'Retail'
    },
    {
      id: 'ROSS0001', title: 'Ms', forename: 'Sophia', surname: 'Rossi', phone: '07700900102', mobile: '07700900102', email: 'sophia.r@example.com',
      addressLine1: '8 Audi Avenue', addressLine2: '', city: 'Winchester', county: 'Hampshire', postcode: 'SO23 8YY',
      createdDate: getRelativeDate(-110), marketingConsent: false, serviceReminderConsent: true, communicationPreference: 'SMS',
      isBusinessCustomer: false, isCashCustomer: false, category: 'Retail'
    },
    { id: 'CART0001', forename: 'Ben', surname: 'Carter', isBusinessCustomer: true, companyName: 'Carter Couriers' } as any,
    { id: 'DUBO0001', forename: 'Chloe', surname: 'Dubois' } as any,
    { id: 'THOR0001', forename: 'Marcus', surname: 'Thorne' } as any,
    { id: 'RACI0001', isBusinessCustomer: true, companyName: 'The Racing Team', forename: 'Frank', surname: 'Williams' } as any,
    { id: 'CHEN0001', forename: 'Isabelle', surname: 'Chen' } as any,
    { id: 'VINT0001', isBusinessCustomer: true, companyName: 'Vintage Classics Ltd', forename: 'Eleanor', surname: 'Vance' } as any,
    { id: 'WRIG0001', forename: 'Ethan', surname: 'Wright' } as any,
    { id: 'PETR0001', forename: 'Olivia', surname: 'Petrova' } as any,
    { id: 'CASH0001', forename: 'Cash', surname: 'Sale', isCashCustomer: true } as any
  ]);
  
  export const getInitialVehicles = (): Vehicle[] => ([
    { id: 'veh_1', customerId: 'OCON0001', registration: 'GT3 RS', make: 'Porsche', model: '911 GT3 RS', nextMOTDue: getRelativeDate(28), nextServiceDue: getRelativeDate(50) } as any,
    { id: 'veh_2', customerId: 'ROSS0001', registration: 'RS6 V10', make: 'Audi', model: 'RS6 Avant', nextMOTDue: getRelativeDate(15) } as any,
    { id: 'veh_3', customerId: 'CART0001', registration: 'T6 BEN', make: 'Volkswagen', model: 'Transporter' } as any,
    { id: 'veh_4', customerId: 'DUBO0001', registration: 'GT4 CJD', make: 'Porsche', model: 'Cayman GT4' } as any,
    { id: 'veh_5', customerId: 'THOR0001', registration: 'M720 S', make: 'McLaren', model: '720S' } as any,
    { id: 'veh_6', customerId: 'RACI0001', registration: 'CUP 1', make: 'Porsche', model: '911 Cup Car' } as any,
    { id: 'veh_7', customerId: 'CHEN0001', registration: 'R56 HGF', make: 'Honda', model: 'Civic' } as any,
    { id: 'veh_8', customerId: 'VINT0001', registration: 'E TYPE', make: 'Jaguar', model: 'E-Type Series 1' } as any,
    { id: 'veh_9', customerId: 'WRIG0001', registration: 'WR16 HTE', make: 'Ford', model: 'Transit Custom' } as any,
    { id: 'veh_10', customerId: 'PETR0001', registration: 'M4 OLP', make: 'BMW', model: 'M4 Competition' } as any,
  ]);
  
  export const getInitialJobs = (): Job[] => ([
    {
      id: 'BPP99200001', entityId: 'ent_porsche', vehicleId: 'veh_1', customerId: 'OCON0001', description: 'Major Service & MOT',
      estimatedHours: 12, scheduledDate: getRelativeDate(0), status: 'Unallocated', createdAt: getRelativeDate(-2), segments: [],
      keyNumber: 1, mileage: 54321, notes: '', inspectionChecklist: [], purchaseOrderIds: [], damagePoints: []
    } as any
  ]);
  
  export const getInitialInvoices = (): Invoice[] => ([
    { 
      id: 'BPP91100001', entityId: 'ent_porsche', jobId: 'BPP99200001', customerId: 'OCON0001', 
      vehicleId: 'veh_1', issueDate: getRelativeDate(-5), dueDate: getRelativeDate(25), 
      status: 'Sent', lineItems: [], payments: [], versionHistory: [] 
    } as any // Use any here if payments/versionHistory aren't in your Invoice interface yet
  ]);
  
  // ... rest of your original functions follow here ...
  export const getInitialLifts = (): Lift[] => ([
    { id: 'lift_p1', entityId: 'ent_porsche', name: 'Lift 1', type: 'General', color: 'blue' },
    { id: 'lift_mot_p', entityId: 'ent_porsche', name: 'Lift 7 / MOT', type: 'MOT', color: 'orange' },
  ]);
  
  export const getInitialEngineers = (): Engineer[] => ([
    { id: 'eng_lewis', entityId: 'ent_porsche', name: 'Lewis', specialization: 'Porsche Specialist' },
    { id: 'eng_emma', entityId: 'ent_porsche', name: 'Emma', specialization: 'Porsche Specialist' },
  ]);
  
  export const getInitialEstimates = (): Estimate[] => ([
    { id: 'est_1', entityId: 'ent_porsche', estimateNumber: 'BPP99100001', customerId: 'OCON0001', vehicleId: 'veh_1', issueDate: getRelativeDate(-2), expiryDate: getRelativeDate(28), status: 'Approved', lineItems: [], createdByUserId: 'user_admin' },
  ]);
  
  export const getInitialSuppliers = (): Supplier[] => ([
    { id: 'sup_1', name: 'Euro Car Parts', contactName: 'John Doe', phone: '02380 111222', email: 'sales@ecp.com', addressLine1: 'Unit 1', city: 'Southampton', postcode: 'SO15 0AD' },
  ]);
  
  export const getInitialServicePackages = (): ServicePackage[] => ([
    {
      id: 'pkg_1', entityId: 'ent_porsche', name: 'Porsche Minor Service', totalPrice: 495, taxCodeId: 'tax_2',
      created: getRelativeDate(-30), lastUpdated: getRelativeDate(-30),
      costItems: [{ id: 'c1', description: 'Labor', isLabor: true, quantity: 4, unitPrice: 125, unitCost: 45, taxCodeId: 'tax_2' }]
    },
  ]);
  
  export const getInitialParts = (): Part[] => ([
    { id: 'part_1', partNumber: '99610722553', description: 'Oil Filter 996/997', salePrice: 35, costPrice: 22.50, defaultSupplierId: 'sup_3', alternateSupplierIds: [], taxCodeId: 'tax_2', stockQuantity: 10, isStockItem: true },
  ]);
  
  export const getInitialSaleVehicles = (): SaleVehicle[] => [];
  export const getInitialSaleOverheadPackages = (): SaleOverheadPackage[] => [];
  export const getInitialStorageBookings = (): StorageBooking[] => [];
  export const getInitialRentalVehicles = (): RentalVehicle[] => [];
  export const getInitialRentalBookings = (): RentalBooking[] => [];
  export const getInitialStorageLocations = (): StorageLocation[] => [];
  export const getInitialBatteryChargers = (): BatteryCharger[] => [];
  export const getInitialNominalCodes = (): NominalCode[] => [];
  export const getInitialNominalCodeRules = (): NominalCodeRule[] => [];
  export const getInitialPurchaseOrders = (): PurchaseOrder[] => [];
  export const getInitialPurchases = (): Purchase[] => [];
  export const getInitialAbsenceRequests = (): AbsenceRequest[] => [];
  export const getInitialProspects = (): Prospect[] => [];
  export const getInitialInquiries = (): Inquiry[] => [];
  export const getInitialReminders = (): Reminder[] => [];
  export const getInitialAuditLog = (): AuditLogEntry[] => [];
  export const getInitialRoles = (): Role[] => [];
  export const getInitialInspectionDiagrams = (): InspectionDiagram[] => [];