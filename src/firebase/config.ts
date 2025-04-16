import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD4UvfSXR_eYnWOTauDx3pg1o1u7qxpgbQ",
  authDomain: "field-trip-logger.firebaseapp.com",
  projectId: "field-trip-logger",
  storageBucket: "field-trip-logger.firebasestorage.app",
  messagingSenderId: "306918563266",
  appId: "1:306918563266:web:464e63211ff1c5c09c8a5b",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
