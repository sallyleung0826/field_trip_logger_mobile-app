import { db } from "./config";
import { collection, addDoc } from "firebase/firestore";

export const saveTrip = async (tripData: any) => {
  await addDoc(collection(db, "trips"), tripData);
};
