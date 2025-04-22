import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { 
  getAuth,
  initializeAuth, 
} from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD4UvfSXR_eYnWOTauDx3pg1o1u7qxpgbQ",
  authDomain: "field-trip-logger.firebaseapp.com",
  projectId: "field-trip-logger",
  storageBucket: "field-trip-logger.firebasestorage.app",
  messagingSenderId: "306918563266",
  appId: "1:306918563266:web:464e63211ff1c5c09c8a5b",
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
