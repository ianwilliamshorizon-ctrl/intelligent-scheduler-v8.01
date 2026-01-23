
import { addDocumentInCollection, clearCollection, getCollectionDocs } from '../db';
import * as T from '../../types';
import {
    getInitialJobs, getInitialVehicles, getInitialCustomers, getInitialEngineers,
    getInitialEstimates, getInitialInvoices, getInitialPurchaseOrders,
    getInitialSuppliers, getInitialParts, getInitialServicePackages, getInitialTaxRates,
    getInitialBusinessEntities, getInitialLifts, getInitialSaleVehicles,
    getInitialSaleOverheadPackages, getInitialStorageBookings, getInitialRentalVehicles,
    getInitialRentalBookings, getInitialStorageLocations, getInitialBatteryChargers,
    getInitialNominalCodes, getInitialNominalCodeRules, getInitialPurchases,
    getInitialAbsenceRequests, getInitialProspects, getInitialInquiries,
    getInitialReminders, getInitialAuditLog, getInitialRoles, getInitialInspectionDiagrams,
    getInitialUsers
} from '../data/initialData';

const SEED_FLAG = 'hasSeededInitialData_v3';

/**
 * A generic function to seed a specific collection.
 */
const seedCollection = async <T extends { id: string }>(
    collectionName: T.CollectionName,
    initialDataFn: () => T[],
    force: boolean = false
) => {
    const collectionData = await getCollectionDocs(collectionName);
    
    if (collectionData.length > 0 && !force) {
        console.log(`Collection "${collectionName}" already has data. Skipping seed.`);
        return;
    }

    if (force) {
        console.log(`Forcing seed for "${collectionName}". Clearing existing data...`);
        await clearCollection(collectionName);
    }
    
    console.log(`Seeding ${collectionName}...`);
    const data = initialDataFn();
    // Use a batch write for efficiency
    for (const doc of data) {
        await addDocumentInCollection(collectionName, doc);
    }
    console.log(`Successfully seeded ${data.length} documents into ${collectionName}.`);
};

// --- Individual Seeding Functions ---

// Level 0: No dependencies
export const seedUsers = (force?: boolean) => seedCollection('brooks_users', getInitialUsers, force);
export const seedRoles = (force?: boolean) => seedCollection('brooks_roles', getInitialRoles, force);
export const seedBusinessEntities = (force?: boolean) => seedCollection('brooks_businessEntities', getInitialBusinessEntities, force);
export const seedTaxRates = (force?: boolean) => seedCollection('brooks_taxRates', getInitialTaxRates, force);
export const seedEngineers = (force?: boolean) => seedCollection('brooks_engineers', getInitialEngineers, force);
export const seedSuppliers = (force?: boolean) => seedCollection('brooks_suppliers', getInitialSuppliers, force);
export const seedNominalCodes = (force?: boolean) => seedCollection('brooks_nominalCodes', getInitialNominalCodes, force);
export const seedStorageLocations = (force?: boolean) => seedCollection('brooks_storageLocations', getInitialStorageLocations, force);
export const seedLifts = (force?: boolean) => seedCollection('brooks_lifts', getInitialLifts, force);
export const seedServicePackages = (force?: boolean) => seedCollection('brooks_servicePackages', getInitialServicePackages, force);
export const seedParts = (force?: boolean) => seedCollection('brooks_parts', getInitialParts, force);
export const seedInspectionDiagrams = (force?: boolean) => seedCollection('brooks_inspectionDiagrams', getInitialInspectionDiagrams, force);
export const seedSaleOverheadPackages = (force?: boolean) => seedCollection('brooks_saleOverheadPackages', getInitialSaleOverheadPackages, force);

// Level 1: Dependencies on Level 0
export const seedCustomers = (force?: boolean) => seedCollection('brooks_customers', getInitialCustomers, force);
export const seedNominalCodeRules = (force?: boolean) => seedCollection('brooks_nominalCodeRules', getInitialNominalCodeRules, force);
export const seedAbsenceRequests = (force?: boolean) => seedCollection('brooks_absenceRequests', getInitialAbsenceRequests, force);

// Level 2: Dependencies on Level 1
export const seedVehicles = (force?: boolean) => seedCollection('brooks_vehicles', getInitialVehicles, force);
export const seedRentalVehicles = (force?: boolean) => seedCollection('brooks_rentalVehicles', getInitialRentalVehicles, force);
export const seedSaleVehicles = (force?: boolean) => seedCollection('brooks_saleVehicles', getInitialSaleVehicles, force);
export const seedProspects = (force?: boolean) => seedCollection('brooks_prospects', getInitialProspects, force);
export const seedBatteryChargers = (force?: boolean) => seedCollection('brooks_batteryChargers', getInitialBatteryChargers, force);
export const seedStorageBookings = (force?: boolean) => seedCollection('brooks_storageBookings', getInitialStorageBookings, force);

// Level 3: Dependencies on Level 2
export const seedInquiries = (force?: boolean) => seedCollection('brooks_inquiries', getInitialInquiries, force);
export const seedJobs = (force?: boolean) => seedCollection('brooks_jobs', getInitialJobs, force);
export const seedEstimates = (force?: boolean) => seedCollection('brooks_estimates', getInitialEstimates, force);
export const seedRentalBookings = (force?: boolean) => seedCollection('brooks_rentalBookings', getInitialRentalBookings, force);

// Level 4: Dependencies on Level 3
export const seedInvoices = (force?: boolean) => seedCollection('brooks_invoices', getInitialInvoices, force);
export const seedPurchaseOrders = (force?: boolean) => seedCollection('brooks_purchaseOrders', getInitialPurchaseOrders, force);

// Level 5: Dependencies on Level 4
export const seedPurchases = (force?: boolean) => seedCollection('brooks_purchases', getInitialPurchases, force);

// Miscellaneous & Logging
export const seedReminders = (force?: boolean) => seedCollection('brooks_reminders', getInitialReminders, force);
export const seedAuditLog = (force?: boolean) => seedCollection('brooks_auditLog', getInitialAuditLog, force);


/**
 * Clears all data from all collections.
 */
export const clearAllData = async () => {
    console.warn("CLEARING ALL DATA...");
    const collections: T.CollectionName[] = [
        'brooks_jobs', 'brooks_vehicles', 'brooks_customers', 'brooks_estimates',
        'brooks_invoices', 'brooks_purchaseOrders', 'brooks_purchases', 'brooks_parts',
        'brooks_servicePackages', 'brooks_suppliers', 'brooks_engineers', 'brooks_lifts',
        'brooks_rentalVehicles', 'brooks_rentalBookings', 'brooks_saleVehicles',
        'brooks_saleOverheadPackages', 'brooks_prospects', 'brooks_storageBookings',
        'brooks_storageLocations', 'brooks_batteryChargers', 'brooks_nominalCodes',
        'brooks_nominalCodeRules', 'brooks_absenceRequests', 'brooks_inquiries',
        'brooks_reminders', 'brooks_auditLog', 'brooks_businessEntities',
        'brooks_taxRates', 'brooks_roles', 'brooks_inspectionDiagrams', 'brooks_users'
    ];
    for (const name of collections) {
        await clearCollection(name);
        console.log(`Collection "${name}" cleared.`);
    }
    console.warn("ALL DATA CLEARED.");
    localStorage.removeItem(SEED_FLAG);
};


/**
 * Seeds all collections with initial data in the correct sequential order.
 */
export const seedAllDataSequentially = async (force: boolean = false) => {
    console.log("Starting sequential data seeding...");
    
    if (force) {
        await clearAllData();
    } else {
        const hasSeeded = localStorage.getItem(SEED_FLAG);
        if (hasSeeded) {
            console.log("Initial data has already been seeded. Skipping.");
            return;
        }
    }

    try {
        // Level 0
        await seedUsers(force);
        await seedRoles(force);
        await seedBusinessEntities(force);
        await seedTaxRates(force);
        await seedEngineers(force);
        await seedSuppliers(force);
        await seedNominalCodes(force);
        await seedStorageLocations(force);
        await seedLifts(force);
        await seedServicePackages(force);
        await seedParts(force);
        await seedInspectionDiagrams(force);
        await seedSaleOverheadPackages(force);

        // Level 1
        await seedCustomers(force);
        await seedNominalCodeRules(force);
        await seedAbsenceRequests(force);

        // Level 2
        await seedVehicles(force);
        await seedRentalVehicles(force);
        await seedSaleVehicles(force);
        await seedProspects(force);
        await seedBatteryChargers(force);
        await seedStorageBookings(force);

        // Level 3
        await seedInquiries(force);
        await seedJobs(force);
        await seedEstimates(force);
        await seedRentalBookings(force);

        // Level 4
        await seedInvoices(force);
        await seedPurchaseOrders(force);

        // Level 5
        await seedPurchases(force);

        // Misc
        await seedReminders(force);
        await seedAuditLog(force);

        localStorage.setItem(SEED_FLAG, 'true');
        console.log("All initial data has been seeded successfully in sequential order.");

    } catch (error) {
        console.error("A critical error occurred during sequential data seeding:", error);
    }
};

/**
 * The main entry point for seeding, designed to be called once when the app loads.
 */
export const seedInitialData = async () => {
    if (!localStorage.getItem(SEED_FLAG)) {
        await seedAllDataSequentially();
    }
};
