import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { createAccount } from "../firebase/auth";

export default function CreateAccountScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert(
        "Missing Information",
        "Please enter both email and password to register."
      );
      return;
    }

    try {
      await createAccount(email, password);
      Alert.alert(
        "Account Created.",
        "Your account was successfully created. You can now log in.",
        [{ text: "OK", onPress: () => navigation.replace("Login") }]
      );
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        Alert.alert(
          "Account Exists",
          "This email is already registered. Please log in instead."
        );
      } else if (error.code === "auth/invalid-email") {
        Alert.alert(
          "Invalid Email",
          "The email address you entered is not valid. Please check for typos."
        );
      } else if (error.code === "auth/weak-password") {
        Alert.alert(
          "Weak Password",
          "Your password is too weak. Please use at least 6 characters."
        );
      } else {
        Alert.alert("Registration Failed", error.message);
      }
    }
  };

  return (
    <ImageBackground
      source={require("../assets/background.jpeg")}
      style={styles.background}
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Create Your Account</Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        <Button title="Register" onPress={handleRegister} />
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
