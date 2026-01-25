
import { collection, addDoc, getFirestore } from "firebase/firestore"; 
import { Vehicle } from "../types";

export const addVehicle = async () => {
  const db = getFirestore();
  const vehicleData: Omit<Vehicle, 'id' | 'customerId'> = {
    registration: "GT3 RS",
    make: "Porsche",
    model: "911 GT3 RS",
    colour: "Blue",
    engineCC: "4000",
    fuelType: "Petrol",
    vin: "WP0ZZZ99ZJS123456",
    engineNo: "GT3-12345",
    transmission: "Manual",
    nextServiceDue: "16/03/2026",
    nextMOTDue: "22/02/2026",
    winterCheck: "",
    fleetNumber: "",
    manufactureDate: "",
    covid19MOTExemption: false,
    vehicleImages: [],
  };

  try {
    // @ts-ignore
    const docRef = await addDoc(collection(db, "vehicles"), vehicleData);
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};
