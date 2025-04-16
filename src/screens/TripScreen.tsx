import React, { useState } from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import * as Location from "expo-location";
import { saveTrip } from "../firebase/firestore";

export default function TripScreen() {
  const [lastLocation, setLastLocation] =
    useState<Location.LocationObject | null>(null);

  const handleLogLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Location access is required.");
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setLastLocation(location);

    try {
      await saveTrip({
        timestamp: new Date().toISOString(),
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      Alert.alert("Trip Saved!", "Location logged to Firebase.");
    } catch (error) {
      Alert.alert("Error", "Could not save trip.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip Logger</Text>
      <Button title="Log Current Location" onPress={handleLogLocation} />
      {lastLocation && (
        <Text style={styles.location}>
          Last: {lastLocation.coords.latitude.toFixed(4)},{" "}
          {lastLocation.coords.longitude.toFixed(4)}
        </Text>
      )}
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
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  location: { marginTop: 20, fontSize: 16 },
});
