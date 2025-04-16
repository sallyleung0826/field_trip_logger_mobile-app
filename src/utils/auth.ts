import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";

const USER_KEY = "user_credentials";

export async function saveCredentials(username: string, password: string) {
  const user = { username, password };
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function verifyCredentials(
  inputUsername: string,
  inputPassword: string
): Promise<boolean> {
  const stored = await AsyncStorage.getItem(USER_KEY);
  if (!stored) return false;

  const saved = JSON.parse(stored);
  return saved.username === inputUsername && saved.password === inputPassword;
}

export async function biometricAuth(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;

  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Login with biometrics",
    fallbackLabel: "Enter Password",
  });

  return result.success;
}
