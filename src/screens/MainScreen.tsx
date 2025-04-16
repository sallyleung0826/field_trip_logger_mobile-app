import React from "react";
import { View, Text, Button, Alert, StyleSheet } from "react-native";
import { logout } from "../firebase/auth";

export default function MainScreen({ navigation }: any) {
  const handleLogout = async () => {
    try {
      await logout();
      navigation.replace("Login");
    } catch (error: any) {
      Alert.alert("Error", "Could not log out.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Field Trip Logger!</Text>
      <View style={styles.btnGroup}>
        <Button
          title="Start Trip Logging"
          onPress={() => navigation.navigate("Trip")}
        />
      </View>
      <View style={styles.btnGroup}>
        <Button title="Log Out" onPress={handleLogout} color="#d9534f" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  btnGroup: { marginVertical: 10, width: 200 },
});
