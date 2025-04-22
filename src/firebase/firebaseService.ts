import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  deleteDoc,
  orderBy,
  where,
  query,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { auth } from "./config";
import { Trip } from "../lib/trip";

export const uploadTripData = async (tripData: Trip) => {
  if (!auth.currentUser) {
    throw new Error("User must be logged in to upload trip data");
  }

  const db = getFirestore();
  const storage = getStorage();

  try {
    const uploadPromises: Promise<string>[] = [];

    let photoUrl: string | undefined;
    if (tripData.photoUrl) {
      const photoRef = ref(
        storage,
        `trips/${auth.currentUser.uid}/photos/${Date.now()}.jpg`
      );
      const photoResponse = await fetch(tripData.photoUrl);
      const photoBlob = await photoResponse.blob();
      const photoSnapshot = await uploadBytes(photoRef, photoBlob);
      photoUrl = await getDownloadURL(photoSnapshot.ref);
    }

    let audioUrl: string | undefined;
    if (tripData.audioUrl) {
      const audioRef = ref(
        storage,
        `trips/${auth.currentUser.uid}/audio/${Date.now()}.m4a`
      );
      const audioResponse = await fetch(tripData.audioUrl);
      const audioBlob = await audioResponse.blob();
      const audioSnapshot = await uploadBytes(audioRef, audioBlob);
      audioUrl = await getDownloadURL(audioSnapshot.ref);
    }

    const tripDoc = {
      userId: auth.currentUser.uid,
      location: tripData.location,
      photoUrl: photoUrl,
      audioUrl: audioUrl,
      description: tripData.description || "",
      timestamp: serverTimestamp(),
    };

    const tripsCollection = collection(db, "trips");
    const docRef = await addDoc(tripsCollection, tripDoc);

    return {
      id: docRef.id,
      ...tripDoc,
    };
  } catch (error) {
    console.error("Error uploading trip data:", error);
    throw error;
  }
};

// Fetch user's trips
export const fetchUserTrips = async (): Promise<Trip[]> => {
  // Ensure user is authenticated
  if (!auth.currentUser) {
    throw new Error("User must be logged in to fetch trips");
  }

  const db = getFirestore();

  try {
    const tripsCollection = collection(db, "trips");
    const q = query(
      tripsCollection,
      where("userId", "==", auth.currentUser.uid),
      orderBy("timestamp", "desc")
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Trip)
    );
  } catch (error) {
    console.error("Error fetching trips:", error);
    throw error;
  }
};

// Delete a specific trip
export const deleteTrip = async (tripId: string) => {
  // Ensure user is authenticated
  if (!auth.currentUser) {
    throw new Error("User must be logged in to delete a trip");
  }

  const db = getFirestore();
  const storage = getStorage();

  try {
    // Get the trip document
    const tripRef = doc(db, "trips", tripId);
    const tripDoc = await getDoc(tripRef);

    // Additional security check
    if (!tripDoc.exists()) {
      throw new Error("Trip not found");
    }

    const tripData = tripDoc.data();

    // Check if the trip belongs to the current user
    if (tripData?.userId !== auth.currentUser.uid) {
      throw new Error("Unauthorized to delete this trip");
    }

    // Delete associated photo from storage
    if (tripData?.photoUrl) {
      const photoRef = ref(storage, tripData.photoUrl);
      await deleteObject(photoRef);
    }

    // Delete associated audio from storage if exists
    if (tripData?.audioUrl) {
      const audioRef = ref(storage, tripData.audioUrl);
      await deleteObject(audioRef);
    }

    // Delete Firestore document
    await deleteDoc(tripRef);

    return true;
  } catch (error) {
    console.error("Error deleting trip:", error);
    throw error;
  }
};
