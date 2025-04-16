import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ImageBackground,
  Alert,
  StyleSheet,
} from "react-native";
import { biometricAuth } from "../utils/auth";
import { login } from "../firebase/auth";

export default function LoginScreen({ navigation }: any) {
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  const handleBiometricLogin = async () => {
    const success = await biometricAuth();
    if (success) {
      navigation.replace("Main");
    } else {
      Alert.alert("Authentication Failed", "Try again or use password.");
    }
  };

  const handlePasswordSubmit = async () => {
    if (!email || !password) {
      Alert.alert(
        "Missing Information",
        "Please enter both email and password to proceed."
      );
      return;
    }

    try {
      await login(email, password);
      navigation.replace("Main");
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        Alert.alert(
          "Account Not Found",
          "No account is registered with this email. Please create a new account."
        );
      } else if (error.code === "auth/wrong-password") {
        Alert.alert(
          "Incorrect Password",
          "The email and password combination does not match our records. Please try again."
        );
      } else if (error.code === "auth/invalid-email") {
        Alert.alert(
          "Invalid Email",
          "The email address you entered is not valid. Please check for typos."
        );
      } else {
        Alert.alert("Login Failed", error.message);
      }
    }
  };

  return (
    <ImageBackground
      source={require("../assets/background.jpeg")}
      style={styles.background}
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Login to Field Trip Logger</Text>

        {!showPasswordInput && (
          <>
            <View style={{ marginVertical: 8 }}>
              <Button
                title="Login with Biometric"
                onPress={handleBiometricLogin}
              />
            </View>
            <View style={{ marginVertical: 8 }}>
              <Button
                title="Login with Password"
                onPress={() => setShowPasswordInput(true)}
              />
            </View>
          </>
        )}

        {showPasswordInput && (
          <>
            <TextInput
              placeholder="Email"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              placeholder="Password"
              style={styles.input}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Button title="Login" onPress={handlePasswordSubmit} />
          </>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, justifyContent: "center", alignItems: "center" },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 30,
    borderRadius: 12,
    width: "80%",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 15,
    borderRadius: 6,
  },
});
