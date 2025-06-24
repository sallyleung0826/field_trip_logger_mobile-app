import { useState } from "react";
import * as Location from "expo-location";
import { Alert } from "react-native";
import { HONG_KONG_LOCATION, LocationData } from "../lib/types/trip";

export default function useMapLocation() {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    null
  );
  const [isMapPickerVisible, setIsMapPickerVisible] = useState(false);

  const openMapPicker = () => {
    setIsMapPickerVisible(true);
  };

  const closeMapPicker = () => {
    setIsMapPickerVisible(false);
  };

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
    setIsMapPickerVisible(false);
  };

  const getCurrentLocation = async (): Promise<LocationData | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Location access is needed to get your current position. You can still select a location manually on the map.",
          [{ text: "OK" }]
        );
        return HONG_KONG_LOCATION;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        address: "",
      };
    } catch (error) {
      console.error("Error getting current location:", error);
      Alert.alert(
        "Location Error",
        "Could not get your current location. Please select a location on the map.",
        [{ text: "OK" }]
      );
      return HONG_KONG_LOCATION;
    }
  };

  const useHongKongLocation = () => {
    setSelectedLocation(HONG_KONG_LOCATION);
  };

  const clearLocation = () => {
    setSelectedLocation(null);
  };

  const updateLocationAddress = (address: string) => {
    if (selectedLocation) {
      setSelectedLocation({
        ...selectedLocation,
        address,
      });
    }
  };

  return {
    selectedLocation,
    isMapPickerVisible,
    openMapPicker,
    closeMapPicker,
    handleLocationSelect,
    getCurrentLocation,
    useHongKongLocation,
    clearLocation,
    updateLocationAddress,
    setSelectedLocation,
  };
}
