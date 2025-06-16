import { initializeApp } from "firebase/app";
// Do not remove! This helps to fix the getReactNativePersistence typescript error
import * as firebaseAuth from "firebase/auth";
import { getAuth, initializeAuth, onAuthStateChanged } from "firebase/auth";
import {
  doc,
  enableNetwork,
  getFirestore,
  onSnapshot,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Do not remove! This fix the typescript error of getReactNativePersistence in firebase/auth
// Fix: Typescript error of getReactNativePersistence in firebase/auth
const reactNativePersistence = (firebaseAuth as any).getReactNativePersistence;

const firebaseConfig = {
  apiKey: "AIzaSyD4UvfSXR_eYnWOTauDx3pg1o1u7qxpgbQ",
  authDomain: "field-trip-logger.firebaseapp.com",
  databaseURL: "https://field-trip-logger-default-rtdb.firebaseio.com", // This matches your log
  projectId: "field-trip-logger",
  storageBucket: "field-trip-logger.firebasestorage.app",
  messagingSenderId: "306918563266",
  appId: "1:306918563266:web:464e63211ff1c5c09c8a5b",
};

console.log("[Firebase Config] Initializing Firebase app");

export const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage for persistence
let auth;
try {
  console.log("[Firebase Config] Initializing Firebase Auth with persistence");
  auth = initializeAuth(app, {
    persistence: reactNativePersistence(AsyncStorage),
  });
  console.log("[Firebase Config] Firebase Auth initialized successfully");
} catch (authError: any) {
  console.error(
    "[Firebase Config] Failed to initialize Firebase Auth:",
    authError
  );
  auth = getAuth(app);
  console.log("[Firebase Config] Using fallback Firebase Auth");
}

export { auth };

// Initialize Firestore
let firestore;
try {
  console.log("[Firebase Config] Initializing Firestore");
  firestore = getFirestore(app);
  console.log("[Firebase Config] Firestore initialized successfully");

  // Enable network for better connectivity
  enableNetwork(firestore)
    .then(() => {
      console.log("[Firebase Config] Firestore network enabled");
    })
    .catch((networkError: any) => {
      console.warn(
        "[Firebase Config] Firestore network enable failed:",
        networkError
      );
    });
} catch (firestoreError) {
  console.error(
    "[Firebase Config] Failed to initialize Firestore:",
    firestoreError
  );
  throw firestoreError;
}

export { firestore };

// Initialize Realtime Database
let database;
try {
  console.log("[Firebase Config] Initializing Firebase Realtime Database");
  database = getDatabase(app);
  console.log(
    "[Firebase Config] Firebase Realtime Database initialized successfully"
  );
  console.log(
    "[Firebase Config] Database URL:",
    database.app.options.databaseURL
  );
} catch (databaseError) {
  console.error(
    "[Firebase Config] Failed to initialize Firebase Realtime Database:",
    databaseError
  );
  throw databaseError;
}

export { database };

// Initialize Storage
let storage;
try {
  console.log("[Firebase Config] Initializing Firebase Storage");
  storage = getStorage(app);
  console.log("[Firebase Config] Firebase Storage initialized successfully");
} catch (storageError) {
  console.error(
    "[Firebase Config] Failed to initialize Firebase Storage:",
    storageError
  );
  throw storageError;
}

export { storage };

// Connection monitoring
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("[Firebase Config] User authenticated:", user.uid);
  } else {
    console.log("[Firebase Config] User not authenticated");
  }
});

// Test Firestore connection
const testFirestoreConnection = async () => {
  try {
    console.log("[Firebase Config] Testing Firestore connection");
    const testDoc = doc(firestore, "test", "connection");

    const unsubscribe = onSnapshot(
      testDoc,
      (doc) => {
        console.log("[Firebase Config] Firestore connection test successful");
        unsubscribe();
      },
      (error) => {
        console.error(
          "[Firebase Config] Firestore connection test failed:",
          error
        );
        unsubscribe();
      }
    );
  } catch (error) {
    console.error("[Firebase Config] Firestore connection test error:", error);
  }
};
