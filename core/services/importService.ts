import { 
    collection, 
    doc, 
    writeBatch, 
    getDocs, 
    query, 
    where, 
    deleteDoc,
    getDoc
  } from 'firebase/firestore';
  import { db, COLLECTION_NAME } from '../config/firebaseConfig';
  
  // --- INTERNAL INTERFACES (To prevent "Member Not Found" errors) ---
  export interface NominalRule {
    id: string;
    name: string;
    type: 'numeric' | 'boolean' | 'choice';
    min?: number;
    max?: number;
    unit?: string;
    options?: string[];
    defaultValue?: any;
    category?: string;
  }
  
  export interface InspectionDiagram {
    id: string;
    vehicleId: string;
    make: string;
    model: string;
    type: string;
    imageUrl: string;
    imageId: string;
    data: any;
    lastModified: string;
  }
  
  /**
   * Service to handle importing, synchronizing, and managing 
   * core vehicle data across Development, UAT, and Production.
   */
  export const importService = {
    
    /**
     * Syncs raw vehicle data into the structured Firestore collections
     * for the current active environment.
     */
    async syncVehicleData(rawData: any[]): Promise<{ success: boolean; count: number }> {
      try {
        const batch = writeBatch(db);
        const vehicleCollection = collection(db, COLLECTION_NAME);
        
        const diagrams: InspectionDiagram[] = rawData.map((item: any) => ({
          id: item.id?.toString() || Math.random().toString(36).substr(2, 9),
          vehicleId: item.vehicleId || 'unknown',
          make: item.make || '',
          model: item.model || '',
          type: item.type || 'general',
          imageUrl: item.imageUrl || '',
          imageId: item.imageId || item.id || '',
          data: item.data || {},
          lastModified: new Date().toISOString()
        }));
  
        diagrams.forEach((diagram) => {
          const docRef = doc(vehicleCollection, diagram.id);
          batch.set(docRef, diagram, { merge: true });
        });
  
        await batch.commit();
        console.log(`✅ [${COLLECTION_NAME}] synced ${diagrams.length} diagrams.`);
        return { success: true, count: diagrams.length };
      } catch (error) {
        console.error('❌ Error syncing vehicle data:', error);
        return { success: false, count: 0 };
      }
    },
  
    /**
     * Initializes or updates nominal rules for the current environment.
     */
    async initializeNominalRules(rules: NominalRule[]): Promise<void> {
      try {
        const rulesCollectionName = `${COLLECTION_NAME}_rules`;
        const rulesRef = collection(db, rulesCollectionName);
        const snapshot = await getDocs(rulesRef);
  
        if (snapshot.empty) {
          const batch = writeBatch(db);
          rules.forEach((rule) => {
            const docRef = doc(rulesRef, rule.id);
            batch.set(docRef, rule);
          });
          await batch.commit();
          console.log(`✅ [${rulesCollectionName}] rules initialized.`);
        }
      } catch (error) {
        console.error('❌ Error initializing nominal rules:', error);
      }
    },
  
    /**
     * Clears all data in the current environment's collection.
     */
    async clearEnvironmentData(): Promise<void> {
      try {
        const q = query(collection(db, COLLECTION_NAME));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        
        snapshot.docs.forEach((document) => {
          batch.delete(document.ref);
        });
        
        await batch.commit();
        console.log(`🗑️ Cleared all data from ${COLLECTION_NAME}`);
      } catch (error) {
        console.error('❌ Error clearing environment data:', error);
      }
    },
  
    /**
     * Fetches all diagrams for the current environment.
     */
    async getAllDiagrams(): Promise<InspectionDiagram[]> {
      try {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<InspectionDiagram, 'id'>)
        } as InspectionDiagram));
      } catch (error) {
        console.error('❌ Error fetching all diagrams:', error);
        return [];
      }
    },
  
    /**
     * Fetches nominal rules for the current environment.
     */
    async getNominalRules(): Promise<NominalRule[]> {
      try {
        const rulesRef = collection(db, `${COLLECTION_NAME}_rules`);
        const querySnapshot = await getDocs(rulesRef);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<NominalRule, 'id'>)
        } as NominalRule));
      } catch (error) {
        console.error('❌ Error fetching nominal rules:', error);
        return [];
      }
    }
  };