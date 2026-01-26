
import { GoogleGenAI, Type } from "@google/genai";
import { ServicePackage, EstimateLineItem, Part } from '../../types';
import { getDb } from '../db';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Fuse from 'fuse.js';

const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
    console.warn("API_KEY environment variable not set. Gemini features will not work.");
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const saveNewPackageToDb = async (packageData: Partial<ServicePackage>) => {
    const db = getDb();
    try {
        const docRef = await addDoc(collection(db, 'brooks_servicePackages'), {
            ...packageData,
            active: true,
            created: serverTimestamp(),
            lastUpdated: serverTimestamp(),
            source: 'AI-Generated'
        });
        
        console.log("✅ Package saved to list:", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("❌ Firestore Save Error:", e);
        throw e;
    }
};

export const createAssistantChat = () => {
    if (!ai) {
        throw new Error("Gemini API is not configured.");
    }

    return ai.chats.create({
        model: 'gemini-2.0-flash',
        config: {
            systemInstruction: `You are an expert automotive technician assistant at Brookspeed, a high-performance garage specializing in Porsche, Audi, and other performance vehicles.
            
            Your role is to assist Service Advisors and Technicians with:
            1. Technical data (e.g., torque settings, fluid capacities, service intervals).
            2. Drafting customer communications.
            3. Diagnosing symptoms based on descriptions.
            
            IMPORTANT SAFETY NOTICE: When providing specific technical figures like torque settings or clearances, ALWAYS add a disclaimer: "Please verify with the official manufacturer workshop manual before application."
            
            Format your responses clearly using Markdown (bolding key figures, using lists). Keep responses concise and professional.`,
        },
    });
};

export const parseJobRequest = async (prompt: string, servicePackages: ServicePackage[], contextDate: string, vehicleInfo?: { make: string; model: string; }): Promise<any> => {
    if (!ai) {
        throw new Error("Gemini API is not configured. Please check your API key settings.");
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        vehicleRegistration: {
          type: Type.STRING,
          description: 'The registration plate of the vehicle mentioned in the request. Extract it as accurately as possible, preserving spaces if present.',
        },
        description: {
          type: Type.STRING,
          description: 'A concise description of the job. If service packages are identified, combine their names (e.g., "MOT & Minor Service").',
        },
        servicePackageNames: {
          type: Type.ARRAY,
          description: 'A list of service package names. If a new service is needed, provide a concise name for it.',
          items: { 
            type: Type.STRING
          },
        }
      },
      required: ['vehicleRegistration', 'description'],
    };
    
    const knownPackages = (servicePackages || []).map(p => `- ${p.name}: ${p.description || p.name}`).join('\n');

    let vehicleContextPrompt = '';
    if (vehicleInfo) {
        vehicleContextPrompt = `
      VEHICLE CONTEXT: The request is for a ${vehicleInfo.make} ${vehicleInfo.model}.
      Use this to select the correct package. For example, if the list has "Porsche 911 Major Service" and the user asks for "major service" for a 911, you must select "Porsche 911 Major Service".
      `;
    }

    const fullPrompt = `
      You are a garage service advisor. Parse the following request to identify the vehicle and any requested service packages.

      Context Date: ${contextDate}
      ${vehicleContextPrompt}

      Available Service Packages:
      ${knownPackages}
      
      User Request: "${prompt}"

      **Instructions**:
      1.  **Find Vehicle Registration**: Extract the vehicle registration plate.
      2.  **Match Service Packages**: Review the user request. If it mentions a service that closely matches one of the "Available Service Packages", return the package's full name in the 'servicePackageNames' array.
          - The match should be intelligent. "major service" should match "Porsche 911 Major Service" if the vehicle is a 911.
      3.  **Create Description**: The 'description' should be a summary of the job.

      Return a JSON object conforming to the schema.
    `;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: fullPrompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            },
        });
        
        const parsedData = JSON.parse(result.text);

        // If AI identified packages, save them if they are new
        if (parsedData.servicePackageNames && parsedData.servicePackageNames.length > 0) {
            for (const name of parsedData.servicePackageNames) {
                // Check if we already have this exact name to avoid duplicates
                const exists = servicePackages.some(p => p.name.toLowerCase() === name.toLowerCase());
                
                if (!exists) {
                    await saveNewPackageToDb({
                        name: name,
                        description: parsedData.description,
                        // You can add default values here
                    });
                }
            }
        }

        return parsedData;

    } catch (error: any) {
        console.error("Error parsing job request with Gemini:", error);
        let errorMessage = "Failed to understand the job request.";
        if (error.message && error.message.includes("xhr error")) {
            errorMessage = "Network error connecting to AI service. Please check your internet connection or API key configuration.";
        }
        throw new Error(errorMessage);
    }
};

export const parseSearchQuery = async (query: string): Promise<{ searchTerm: string, searchType: 'customer' | 'vehicle' | 'unknown' }> => {
    if (!ai) {
         const isReg = /[A-Z0-9]{1,7}/.test(query.toUpperCase());
         return { searchTerm: query, searchType: isReg ? 'vehicle' : 'customer' };
    }

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            searchTerm: {
                type: Type.STRING,
                description: "The primary search term extracted from the user's query. This should be the core identifier like a name, registration plate, phone number, email, or vehicle model. Normalize registration plates by removing spaces.",
            },
            searchType: {
                type: Type.STRING,
                description: "The type of entity the user is most likely searching for. If it's a person's name, phone number, or email, classify as 'customer'. If it's a registration plate, vehicle make or model, classify as 'vehicle'. If it's ambiguous, classify as 'unknown'.",
                enum: ['customer', 'vehicle', 'unknown'],
            }
        },
        required: ['searchTerm', 'searchType'],
    };

    const fullPrompt = `
      Analyze the following search query from a garage management system\'s universal search bar.
      Your task is to extract the core search term and classify the user\'s intent.

      Query: "${query}"

      Classification Rules:
      1.  If the query contains a person\'s name (e.g., "John Smith"), a phone number (e.g., "07700900123"), or an email address, the searchType is 'customer'. The searchTerm should be the name, number, or email.
      2.  If the query contains what looks like a vehicle registration plate (e.g., "REG123", "WP19 WML"), a vehicle make (e.g., "Porsche"), or a model (e.g., "911 GT3"), the searchType is 'vehicle'. The searchTerm should be the registration, make, or model. For registrations, remove any spaces.
      3.  If the query is ambiguous (e.g., "Smith\'s car", "the transit"), classify the searchType as 'unknown' and extract the most likely identifier as the searchTerm.

      Format the output according to the provided JSON schema.
    `;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: fullPrompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            },
        });
        
        const jsonText = result.text;
        const parsedData = JSON.parse(jsonText);
        return parsedData;

    } catch (error) {
        console.error("Error parsing search query with Gemini:", error);
        return { searchTerm: query, searchType: 'unknown' };
    }
};

export const generateServicePackageName = async (
    lineItems: EstimateLineItem[],
    vehicleMake: string,
    vehicleModel: string
): Promise<{ name: string; description: string }> => {
    if (!ai) {
        throw new Error("AI service is unavailable.");
    }

    const itemsDescription = (lineItems || [])
        .map(item => `- ${item.description} (Qty: ${item.quantity})`)
        .join('\n');

    const fullPrompt = `
      Generate a concise, customer-facing name and a short description for a service package.
      The vehicle is a ${vehicleMake} ${vehicleModel}.
      The work items are:
      ${itemsDescription}

      The name should be marketable and specific to the vehicle.
      The description should be a single sentence summarizing the work.

      Return a JSON object with two keys: "name" and "description".
    `;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: fullPrompt,
            config: {
                responseMimeType: 'application/json',
            },
        });
        
        const jsonText = result.text;
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error generating service package name with Gemini:", error);
        throw new Error("Failed to generate a service package name. Please try again.");
    }
};

export const generateAndSaveServicePackage = async (
    lineItems: EstimateLineItem[],
    vehicleMake: string,
    vehicleModel: string,
    entityId: string,
    totalPrice: number
) => {
    const db = getDb();
    const aiResult = await generateServicePackageName(lineItems, vehicleMake, vehicleModel);

    try {
        const docRef = await addDoc(collection(db, 'brooks_servicePackages'), {
            entityId: entityId,
            name: aiResult.name,
            description: aiResult.description,
            applicableMake: vehicleMake,
            applicableModel: vehicleModel,
            costItems: lineItems,
            totalPrice: totalPrice,
            created: serverTimestamp(),
            lastUpdated: serverTimestamp(),
        });

        console.log("✅ New AI package saved to options list with ID:", docRef.id);
        
        const newPackage: ServicePackage = {
            id: docRef.id,
            entityId: entityId,
            name: aiResult.name,
            description: aiResult.description,
            applicableMake: vehicleMake,
            applicableModel: vehicleModel,
            costItems: lineItems,
            totalPrice: totalPrice,
            created: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
        };
        return newPackage;

    } catch (dbError) {
        console.error("❌ Failed to save AI package to list:", dbError);
        throw new Error("Database error: Failed to save the new service package.");
    }
};


export const generateEstimateFromDescription = async (
    description: string,
    vehicleInfo: { make: string; model: string; },
    availableParts: Part[],
    availablePackages: ServicePackage[],
    laborRate: number,
): Promise<{ mainItems: Partial<EstimateLineItem>[], optionalExtras: Partial<EstimateLineItem>[], suggestedNotes: string }> => {
    if (!ai) {
        throw new Error("AI service is unavailable.");
    }

    const partsList = (availableParts || []).map(p => `- ${p.partNumber}: ${p.description}`).join('\n');
    const packagesList = (availablePackages || []).map(p => `- ${p.name}: ${p.description || p.name}`).join('\n');

    const fullPrompt = `
      You are an expert garage service advisor. Your task is to analyze a customer\'s request and create a list of estimate items.
      Return a JSON object with three keys: 'mainItems', 'optionalExtras', and 'suggestedNotes'.

      Vehicle: ${vehicleInfo.make} ${vehicleInfo.model}
      Hourly labor rate: £${laborRate}

      Available Service Packages:
      ${packagesList}

      Customer Request: "${description}"

      **Instructions**:
      1.  **Check for Service Packages**: If the request mentions a service from the "Available Service Packages" list, add it to the 'mainItems' array.
          - The item should have 'servicePackageName' set to the package name, 'quantity': 1, and 'isLabor': false.
      2.  **Add Custom Items**: If the request mentions work not in a package, add it to 'mainItems' as labor or parts.
          - Labor items need 'isLabor: true' and a 'quantity' representing estimated hours.
          - Part items need 'isLabor: false' and a part number if known.
      3.  **Suggest Extras**: Add 1-2 relevant upsells to the 'optionalExtras' array (e.g., brake fluid for a brake job).
      4.  **Add Notes**: Add technical or customer-facing notes to the 'suggestedNotes' string.
    `;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: fullPrompt,
            config: {
                responseMimeType: 'application/json',
            },
        });
        
        const jsonText = result.text;
        const parsedData = JSON.parse(jsonText);
        
        return {
            mainItems: parsedData.mainItems || [],
            optionalExtras: parsedData.optionalExtras || [],
            suggestedNotes: parsedData.suggestedNotes || ''
        };

    } catch (error) {
        console.error("Error generating estimate with Gemini:", error);
        throw new Error("AI failed to generate an estimate. Please enter items manually or rephrase your request.");
    }
};

export const parseInquiryMessage = async (message: string): Promise<{ fromName: string; fromContact: string; vehicleRegistration: string; summary: string; }> => {
    if (!ai) {
        return { fromName: '', fromContact: '', vehicleRegistration: '', summary: message };
    }

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            fromName: {
                type: Type.STRING,
                description: "The full name of the person making the inquiry. Return an empty string if not found.",
            },
            fromContact: {
                type: Type.STRING,
                description: "The primary contact detail mentioned, either a phone number or an email address. Return an empty string if not found.",
            },
            vehicleRegistration: {
                type: Type.STRING,
                description: "The registration plate of the vehicle mentioned in the message. Normalize by removing spaces and making it uppercase. Return an empty string if not found.",
            },
            summary: {
                type: Type.STRING,
                description: "A very brief, one-sentence summary of the customer's request (e.g., 'Wants to book a minor service', 'Inquiring about brake replacement cost').",
            }
        },
        required: ['summary'],
    };

    const fullPrompt = `
      You are an expert garage receptionist. Your task is to parse a message from a customer inquiry and extract key details.

      Message: "${message}"

      Rules for Extraction:
      1.  **fromName**: Extract the customer\'s full name. If only a first name is given, use that.
      2.  **fromContact**: Extract the most prominent contact detail. This will be either a phone number or an email address. If both are present, prefer the phone number.
      3.  **vehicleRegistration**: Find any vehicle registration plate mentioned. It\'s crucial to normalize it to be uppercase and without any spaces.
      4.  **summary**: Provide a concise, one-sentence summary of the customer\'s request.

      Format the output according to the provided JSON schema.
    `;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: fullPrompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            },
        });
        
        const jsonText = result.text;
        const parsedData = JSON.parse(jsonText);
        return parsedData;

    } catch (error) {
        console.error("Error parsing inquiry with Gemini:", error);
        return { fromName: '', fromContact: '', vehicleRegistration: '', summary: message };
    }
};

export const parseServicePackageFromContent = async (content: string): Promise<Partial<ServicePackage>> => {
    if (!ai) {
        throw new Error("AI service is unavailable.");
    }

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            name: {
                type: Type.STRING,
                description: "A concise name for the service package derived from the content (e.g., 'Porsche 911 Wheel Torque Check', 'Major Service Kit').",
            },
            description: {
                type: Type.STRING,
                description: "A description of the work or parts included. Include any specific values like torque settings here.",
            },
            costItems: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING, description: "Description of the labor or part." },
                        quantity: { type: Type.NUMBER, description: "Quantity required." },
                        isLabor: { type: Type.BOOLEAN, description: "True if it's a labor item, false if it's a part." },
                        unitCost: { type: Type.NUMBER, description: "Estimated unit cost price (optional, default to 0)." },
                        unitPrice: { type: Type.NUMBER, description: "Estimated unit sale price (optional, default to 0)." },
                        partNumber: { type: String, description: "Part number if available." }
                    },
                    required: ['description', 'quantity', 'isLabor']
                }
            }
        },
        required: ['name', 'description', 'costItems'],
    };

    const fullPrompt = `
      Analyze the following technical content provided by an automotive assistant and extract a structured Service Package.
      
      Content: "${content}"

      Instructions:
      1. Create a 'name' that summarizes the. content (e.g., "Wheel Torque Spec" or "911 Major Service").
      2. Create a 'description' that includes key details like torque settings or specific instructions found in the text.
      3. Extract a list of 'costItems'.
         - If the text lists parts, create items with isLabor: false.
         - If the text describes actions (e.g., "Check torque", "Replace oil"), create items with isLabor: true.
         - If no quantity is specified, assume 1.
         - If no price is specified, use 0.

      Format the output according to the provided JSON schema.
    `;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: fullPrompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            },
        });
        
        const jsonText = result.text;
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error parsing service package with Gemini:", error);
        throw new Error("Failed to create service package from content.");
    }
};
