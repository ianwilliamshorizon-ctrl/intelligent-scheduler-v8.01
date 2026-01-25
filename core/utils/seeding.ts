
import '../env'; // Load environment variables FIRST

import { getDb, isDev } from '../db';
import {
    // Foundational Data
    getInitialUsers, getInitialRoles, getInitialBusinessEntities, getInitialTaxRates,
    getInitialEngineers, getInitialLifts, getInitialNominalCodes, getInitialNominalCodeRules,
    getInitialSaleOverheadPackages, getInitialStorageLocations, getInitialBatteryChargers,
    getInitialInspectionDiagrams,

    // Sample/Transactional Data (for Dev only)
    getInitialJobs, getInitialVehicles, getInitialCustomers, getInitialEstimates, 
    getInitialInvoices, getInitialPurchaseOrders, getInitialSuppliers, getInitialParts, 
    getInitialServicePackages, getInitialSaleVehicles, getInitialStorageBookings, 
    getInitialRentalVehicles, getInitialRentalBookings, getInitialPurchases,
    getInitialAbsenceRequests, getInitialProspects, getInitialInquiries,
    getInitialReminders, getInitialAuditLog
} from '../data/initialData';
import { setDoc, doc, getDoc } from 'firebase/firestore';

// This function safely seeds a collection in production, only adding new documents.
const safeSeedCollection = async (collectionName: string, data: any[]) => {
    const db = getDb();
    console.log(`Safely seeding ${collectionName}...`);
    let newItemsCount = 0;
    for (const item of data) {
        if (!item.id) {
            console.warn(`Item in ${collectionName} is missing an id`, item);
            continue;
        }
        const docRef = doc(db, collectionName, item.id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            await setDoc(docRef, item);
            newItemsCount++;
        }
    }
    console.log(`Seeded ${newItemsCount} new items into ${collectionName}. ${data.length - newItemsCount} items already existed.`);
};

// This function overwrites a collection, intended for development/emulator use only.
const destructiveSeedCollection = async (collectionName: string, data: any[]) => {
    const db = getDb();
    console.log(`DESTUCTIVELY seeding ${collectionName}...`);
    for (const item of data) {
        if (item.id) {
            await setDoc(doc(db, collectionName, item.id), item);
        } else {
            console.warn(`Item in ${collectionName} is missing an id`, item);
        }
    }
    console.log(`Seeded ${data.length} items into ${collectionName}.`);
};

const seedDatabase = async () => {
    const isDevelopment = isDev();

    if (isDevelopment) {
        console.log('--- Running in DEV mode. Seeding with full sample data. THIS IS DESTRUCTIVE. ---');
        // In dev, we seed everything to have a rich test environment.
        await destructiveSeedCollection('brooks_users', getInitialUsers());
        await destructiveSeedCollection('brooks_roles', getInitialRoles());
        await destructiveSeedCollection('brooks_customers', getInitialCustomers());
        await destructiveSeedCollection('brooks_vehicles', getInitialVehicles());
        await destructiveSeedCollection('brooks_jobs', getInitialJobs());
        await destructiveSeedCollection('brooks_estimates', getInitialEstimates());
        await destructiveSeedCollection('brooks_invoices', getInitialInvoices());
        await destructiveSeedCollection('brooks_purchaseOrders', getInitialPurchaseOrders());
        await destructiveSeedCollection('brooks_purchases', getInitialPurchases());
        await destructiveSeedCollection('brooks_parts', getInitialParts());
        await destructiveSeedCollection('brooks_servicePackages', getInitialServicePackages());
        await destructiveSeedCollection('brooks_suppliers', getInitialSuppliers());
        await destructiveSeedCollection('brooks_engineers', getInitialEngineers());
        await destructiveSeedCollection('brooks_lifts', getInitialLifts());
        await destructiveSeedCollection('brooks_rentalVehicles', getInitialRentalVehicles());
        await destructiveSeedCollection('brooks_rentalBookings', getInitialRentalBookings());
        await destructiveSeedCollection('brooks_saleVehicles', getInitialSaleVehicles());
        await destructiveSeedCollection('brooks_saleOverheadPackages', getInitialSaleOverheadPackages());
        await destructiveSeedCollection('brooks_prospects', getInitialProspects());
        await destructiveSeedCollection('brooks_storageBookings', getInitialStorageBookings());
        await destructiveSeedCollection('brooks_storageLocations', getInitialStorageLocations());
        await destructiveSeedCollection('brooks_batteryChargers', getInitialBatteryChargers());
        await destructiveSeedCollection('brooks_nominalCodes', getInitialNominalCodes());
        await destructiveSeedCollection('brooks_nominalCodeRules', getInitialNominalCodeRules());
        await destructiveSeedCollection('brooks_absenceRequests', getInitialAbsenceRequests());
        await destructiveSeedCollection('brooks_inquiries', getInitialInquiries());
        await destructiveSeedCollection('brooks_reminders', getInitialReminders());
        await destructiveSeedCollection('brooks_auditLog', getInitialAuditLog());
        await destructiveSeedCollection('brooks_businessEntities', getInitialBusinessEntities());
        await destructiveSeedCollection('brooks_taxRates', getInitialTaxRates());
        await destructiveSeedCollection('brooks_inspectionDiagrams', getInitialInspectionDiagrams());
        console.log('--- DEV SEEDING COMPLETE ---');
    } else {
        console.log('--- Running in PROD mode. Seeding foundational data only. THIS IS NON-DESTRUCTIVE. ---');
        // In prod, we ONLY seed foundational data and we NEVER overwrite.
        await safeSeedCollection('brooks_users', getInitialUsers());
        await safeSeedCollection('brooks_roles', getInitialRoles());
        await safeSeedCollection('brooks_businessEntities', getInitialBusinessEntities());
        await safeSeedCollection('brooks_taxRates', getInitialTaxRates());
        await safeSeedCollection('brooks_engineers', getInitialEngineers());
        await safeSeedCollection('brooks_lifts', getInitialLifts());
        await safeSeedCollection('brooks_nominalCodes', getInitialNominalCodes());
        await safeSeedCollection('brooks_nominalCodeRules', getInitialNominalCodeRules());
        await safeSeedCollection('brooks_saleOverheadPackages', getInitialSaleOverheadPackages());
        await safeSeedCollection('brooks_storageLocations', getInitialStorageLocations());
        await safeSeedCollection('brooks_batteryChargers', getInitialBatteryChargers());
        await safeSeedCollection('brooks_inspectionDiagrams', getInitialInspectionDiagrams());

        // SEED THE VEHICLES (This was missing for PROD)
        await safeSeedCollection('brooks_vehicles', getInitialVehicles());
        
        console.log('--- PROD SEEDING COMPLETE ---');
    }
};

seedDatabase().catch(error => {
    console.error("Seeding failed:", error);
    process.exit(1);
});
