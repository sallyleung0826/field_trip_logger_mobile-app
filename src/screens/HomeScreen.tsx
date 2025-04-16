import React from "react";
import { View, Text, Button, ImageBackground, StyleSheet } from "react-native";

export default function HomeScreen({ navigation }: any) {
  return (
    <ImageBackground
      source={require("../assets/background.jpeg")}
      style={styles.background}
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Field Trip Logger</Text>

        <View style={styles.buttonWrapper}>
          <Button title="Login" onPress={() => navigation.navigate("Login")} />
        </View>

        <View style={styles.buttonWrapper}>
          <Button
            title="Create Account"
            onPress={() => navigation.navigate("CreateAccount")}
          />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 30,
    borderRadius: 12,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  buttonWrapper: {
    marginVertical: 8,
    width: 200,
  },
});
