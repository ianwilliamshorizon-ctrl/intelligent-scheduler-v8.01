import { InspectionDiagram, Vehicle } from '../../types';
import { saveImage } from '../../utils/imageStore';

/**
 * Creates a new inspection diagram with all required properties
 */
export const createInspectionDiagram = (
    make: string, 
    model: string, 
    imageId: string, 
    dataUrl: string
): InspectionDiagram => {
    return {
        id: crypto.randomUUID(),
        make,
        model,
        imageId,
        name: `${make} ${model}`,
        imageUrl: dataUrl
    };
};

/**
 * Assigns a diagram image to a vehicle's image array
 */
export const assignDiagramToVehicle = (
    vehicle: Vehicle, 
    imageData: string
): Vehicle => {
    const newImages = [...(vehicle.images || [])];
    
    newImages.push({
        id: `diag_${Date.now()}`,
        url: imageData, 
        isPrimaryDiagram: true
    });

    return {
        ...vehicle,
        images: newImages
    };
};

/**
 * Helper to process bulk uploaded files into InspectionDiagram objects
 */
export const processBulkDiagramUpload = async (
    files: FileList
): Promise<InspectionDiagram[]> => {
    const newDiagrams: InspectionDiagram[] = [];

    for (const file of Array.from(files)) {
        const nameParts = file.name.split('.')[0].split('_');
        const make = nameParts[0] || 'Unknown';
        const model = nameParts[1] || 'Unknown';

        // Convert file to DataURL
        const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });

        // FIX: saveImage expects (id, dataUrl). 
        // We generate an ID first to satisfy the 2-argument requirement.
        const newImageId = crypto.randomUUID();
        await saveImage(newImageId, dataUrl); 

        // FIX: Ensure imageId is assigned the string ID, not the result of the save call
        newDiagrams.push({
            id: crypto.randomUUID(),
            make,
            model,
            imageId: newImageId, 
            name: `${make} ${model}`,
            imageUrl: dataUrl
        });
    }

    return newDiagrams;
};