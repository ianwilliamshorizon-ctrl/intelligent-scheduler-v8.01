import { setItem, getItem } from '../db';

const BACKUP_INTERVAL = 30 * 60 * 1000; // 30 minutes

export const persistenceService = {
    /**
     * Maps all DataContext collections to their unique storage keys.
     * Note: inspectionDiagrams is a global collection used across the app.
     */
    mapping: {
        jobs: 'brooks_jobs',
        vehicles: 'brooks_vehicles',
        customers: 'brooks_customers',
        estimates: 'brooks_estimates',
        invoices: 'brooks_invoices',
        purchaseOrders: 'brooks_purchaseOrders',
        purchases: 'brooks_purchases',
        parts: 'brooks_parts',
        servicePackages: 'brooks_servicePackages',
        suppliers: 'brooks_suppliers',
        engineers: 'brooks_engineers',
        lifts: 'brooks_lifts',
        rentalVehicles: 'brooks_rentalVehicles',
        rentalBookings: 'brooks_rentalBookings',
        saleVehicles: 'brooks_saleVehicles',
        saleOverheadPackages: 'brooks_saleOverheadPackages',
        prospects: 'brooks_prospects',
        storageBookings: 'brooks_storageBookings',
        storageLocations: 'brooks_storageLocations',
        batteryChargers: 'brooks_batteryChargers',
        nominalCodes: 'brooks_nominalCodes',
        nominalCodeRules: 'brooks_nominalCodeRules',
        absenceRequests: 'brooks_absenceRequests',
        inquiries: 'brooks_inquiries',
        reminders: 'brooks_reminders',
        auditLog: 'brooks_auditLog',
        businessEntities: 'brooks_businessEntities',
        taxRates: 'brooks_taxRates',
        roles: 'brooks_roles',
        inspectionDiagrams: 'brooks_inspectionDiagrams' // Global diagram storage
    } as Record<string, string>,

    /**
     * Starts the automated background sync heartbeat.
     */
    initAutoBackup: (dataContext: any, users: any[]) => {
        console.log('[System] Persistence heartbeat active.');
        return setInterval(() => {
            persistenceService.saveAll(dataContext, users)
                .then(() => console.log(`[Backup] Automatic sync completed: ${new Date().toLocaleTimeString()}`));
        }, BACKUP_INTERVAL);
    },

    /**
     * Code Pull: Specifically retrieves configuration and rule sets.
     */
    pullSystemConfig: async () => {
        const codes = await getItem('brooks_nominalCodes') || [];
        const rules = await getItem('brooks_nominalCodeRules') || [];
        const entities = await getItem('brooks_businessEntities') || [];
        return { codes, rules, entities };
    },

    /**
     * Full Sync: Performs a manual override save of the entire state.
     */
    fullSync: async (dataContext: any, users: any[]): Promise<void> => {
        console.warn('[Persistence] Initiating Full System State Sync...');
        await persistenceService.saveAll(dataContext, users);
    },

    /**
     * Core Save Logic: Iterates through the context and persists to DB.
     */
    saveAll: async (dataContext: any, users: any[]): Promise<boolean> => {
        try {
            const savePromises = Object.entries(persistenceService.mapping).map(([contextKey, storageKey]) => {
                const data = dataContext[contextKey];
                // Persist if data exists, otherwise resolve to keep the chain moving
                return data ? setItem(storageKey, data) : Promise.resolve();
            });

            // Users are handled outside the standard context mapping
            savePromises.push(setItem('brooks_users', users));

            await Promise.all(savePromises);
            return true;
        } catch (error) {
            console.error('[Persistence Error]: Failed to save system state.', error);
            return false;
        }
    }
};

export default persistenceService;