import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { login } from "../firebase/auth";

const USER_KEY = "user_credentials";
const BIOMETRIC_ENABLED_KEY = "biometric_enabled";

export async function saveCredentialsSecurely(email: string, password: string) {
  try {
    const credentials = { email, password };
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(credentials));
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "true");
  } catch (error) {
    console.error("[Auth] Failed to save credentials:", error);
    throw new Error("Failed to save credentials securely");
  }
}

export async function getStoredCredentials(): Promise<{
  email: string;
  password: string;
} | null> {
  try {
    const stored = await SecureStore.getItemAsync(USER_KEY);
    if (!stored) return null;

    const credentials = JSON.parse(stored);
    return credentials;
  } catch (error) {
    console.error("[Auth] Failed to retrieve credentials:", error);
    return null;
  }
}

export async function clearStoredCredentials() {
  try {
    await SecureStore.deleteItemAsync(USER_KEY);
    await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
  } catch (error) {
    console.error("[Auth] Failed to clear credentials:", error);
  }
}

export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return enabled === "true";
  } catch (error) {
    return false;
  }
}

export async function setBiometricEnabled(enabled: boolean) {
  try {
    if (enabled) {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "true");
    } else {
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      await clearStoredCredentials();
    }
  } catch (error) {
    console.error("[Auth] Failed to set biometric preference:", error);
  }
}

export async function checkBiometricSupport(): Promise<{
  isAvailable: boolean;
  biometricType: string;
  error?: string;
}> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();

    if (!compatible) {
      return {
        isAvailable: false,
        biometricType: "none",
        error: "Device does not support biometric authentication",
      };
    }

    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (!enrolled) {
      return {
        isAvailable: false,
        biometricType: "none",
        error:
          "No biometric authentication methods are enrolled on this device",
      };
    }

    return {
      isAvailable: true,
      biometricType: "Biometric",
    };
  } catch (error) {
    console.error("[Auth] Error checking biometric support:", error);
    return {
      isAvailable: false,
      biometricType: "none",
      error: "Failed to check biometric support",
    };
  }
}

export async function promptForBiometricSetup(
  email: string,
  password: string
): Promise<boolean> {
  try {
    const biometricSupport = await checkBiometricSupport();
    if (!biometricSupport.isAvailable) {
      return false;
    }

    const testResult = await LocalAuthentication.authenticateAsync({
      promptMessage: "Enable biometric authentication for quick login?",
      fallbackLabel: "Use Password",
      disableDeviceFallback: false,
      cancelLabel: "Not Now",
    });

    if (testResult.success) {
      await saveCredentialsSecurely(email, password);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("[Auth] Error setting up biometric:", error);
    return false;
  }
}

export async function biometricAuth(): Promise<{
  success: boolean;
  credentials?: { email: string; password: string };
  error?: string;
}> {
  try {
    const biometricSupport = await checkBiometricSupport();
    if (!biometricSupport.isAvailable) {
      return {
        success: false,
        error:
          biometricSupport.error || "Biometric authentication not available",
      };
    }

    const isBioEnabled = await isBiometricEnabled();
    if (!isBioEnabled) {
      return {
        success: false,
        error: "Biometric authentication is not enabled for this app",
      };
    }

    const storedCredentials = await getStoredCredentials();
    if (!storedCredentials) {
      return {
        success: false,
        error:
          "No stored credentials found. Please log in with your password first.",
      };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Login with biometric authentication",
      fallbackLabel: "Use Password",
      disableDeviceFallback: false,
      cancelLabel: "Cancel",
      requireConfirmation: false,
    });

    if (result.success) {
      return {
        success: true,
        credentials: storedCredentials,
      };
    } else {
      let errorMessage = "Biometric authentication failed";

      return {
        success: false,
        error: errorMessage,
      };
    }
  } catch (error) {
    console.error("[Auth] Biometric authentication error:", error);
    return {
      success: false,
      error: "An error occurred during biometric authentication",
    };
  }
}

export async function authenticateWithBiometric(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const biometricResult = await biometricAuth();

    if (!biometricResult.success || !biometricResult.credentials) {
      return {
        success: false,
        error: biometricResult.error || "Biometric authentication failed",
      };
    }

    try {
      await login(
        biometricResult.credentials.email,
        biometricResult.credentials.password
      );
      return { success: true };
    } catch (firebaseError: any) {
      console.error("[Auth] Firebase authentication failed:", firebaseError);

      await clearStoredCredentials();

      return {
        success: false,
        error:
          "Your stored credentials are no longer valid. Please log in again.",
      };
    }
  } catch (error) {
    console.error("[Auth] Error in authenticateWithBiometric:", error);
    return {
      success: false,
      error: "Authentication failed. Please try again.",
    };
  }
}
