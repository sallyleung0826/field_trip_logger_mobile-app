import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import {
  forwardGeocode,
  reverseGeocode,
} from "../lib/services/apis/geocodingApi";

const statusBarHeight =
  Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 24;

const HONG_KONG_REGION = {
  latitude: 22.3193,
  longitude: 114.1694,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
  showExistingTrips?: boolean;
  existingTrips?: Array<{
    latitude: number;
    longitude: number;
    address?: string;
    rating?: number;
  }>;
}

export default function MapLocationPicker({
  visible,
  onClose,
  onLocationSelect,
  initialLocation,
  showExistingTrips = false,
  existingTrips = [],
}: LocationPickerProps) {
  const [region, setRegion] = useState<Region>(HONG_KONG_REGION);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const mapRef = useRef<MapView>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      if (initialLocation) {
        const newRegion = {
          ...initialLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);
        handleLocationSelect(
          initialLocation.latitude,
          initialLocation.longitude
        );
      } else {
        getCurrentLocation();
      }
    }
  }, [visible, initialLocation]);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission denied, using Hong Kong as default");
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newRegion = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(newRegion);
      handleLocationSelect(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );
    } catch (error) {
      console.error("Error getting current location:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = async (latitude: number, longitude: number) => {
    try {
      setGeocoding(true);
      const geocodeResult = await reverseGeocode(latitude, longitude);

      const locationData = {
        latitude,
        longitude,
        address:
          geocodeResult?.formattedAddress ||
          `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      };

      setSelectedLocation(locationData);
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      setSelectedLocation({
        latitude,
        longitude,
        address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      });
    } finally {
      setGeocoding(false);
    }
  };

  const handleMapPress = useCallback(
    (event: any) => {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      handleLocationSelect(latitude, longitude);

      setRegion({
        latitude,
        longitude,
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
      });
    },
    [region]
  );

  const handleSearch = async () => {
    if (!searchText.trim()) {
      Alert.alert("Error", "Please enter a location to search");
      return;
    }

    try {
      setLoading(true);
      const result = await forwardGeocode(searchText.trim());

      if (result) {
        const newRegion = {
          latitude: result.latitude,
          longitude: result.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        setRegion(newRegion);
        handleLocationSelect(result.latitude, result.longitude);

        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      } else {
        Alert.alert("Search Failed", "Could not find the specified location");
      }
    } catch (error) {
      console.error("Error searching location:", error);
      Alert.alert("Search Error", "An error occurred while searching");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTextChange = (text: string) => {
    setSearchText(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (text.trim().length > 2) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch();
      }, 1000);
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    }
  };

  const centerOnCurrentLocation = async () => {
    await getCurrentLocation();
  };

  const getMarkerColor = (rating?: number): string => {
    if (!rating) return "#6b7280";
    if (rating >= 4.5) return "#22c55e";
    if (rating >= 3.5) return "#eab308";
    if (rating >= 2.5) return "#f97316";
    return "#ef4444";
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Select Location</Text>

          <TouchableOpacity
            onPress={handleConfirm}
            style={[
              styles.headerButton,
              { opacity: selectedLocation ? 1 : 0.5 },
            ]}
            disabled={!selectedLocation}
          >
            <MaterialIcons name="check" size={24} color="#007bff" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a location..."
              value={searchText}
              onChangeText={handleSearchTextChange}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {loading && <ActivityIndicator size="small" color="#007bff" />}
          </View>

          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={centerOnCurrentLocation}
          >
            <MaterialIcons name="my-location" size={24} color="#007bff" />
          </TouchableOpacity>
        </View>

        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={false}
            mapType="standard"
            showsCompass={true}
            showsScale={Platform.OS === "android"}
          >
            {selectedLocation && (
              <Marker
                coordinate={{
                  latitude: selectedLocation.latitude,
                  longitude: selectedLocation.longitude,
                }}
                title="Selected Location"
                description={selectedLocation.address}
                pinColor="#007bff"
              />
            )}

            {showExistingTrips &&
              existingTrips.map((trip, index) => (
                <Marker
                  key={`trip-${index}`}
                  coordinate={{
                    latitude: trip.latitude,
                    longitude: trip.longitude,
                  }}
                  title="Previous Trip"
                  description={trip.address || "Previous trip location"}
                >
                  <View
                    style={[
                      styles.existingTripMarker,
                      { backgroundColor: getMarkerColor(trip.rating) },
                    ]}
                  >
                    <MaterialIcons name="place" size={16} color="white" />
                  </View>
                </Marker>
              ))}
          </MapView>

          <View style={styles.centerMarker}>
            <MaterialIcons name="gps-fixed" size={24} color="#007bff" />
          </View>

          <View style={styles.mapControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => {
                const newRegion = {
                  ...region,
                  latitudeDelta: region.latitudeDelta * 0.5,
                  longitudeDelta: region.longitudeDelta * 0.5,
                };
                setRegion(newRegion);
                mapRef.current?.animateToRegion(newRegion, 300);
              }}
            >
              <MaterialIcons name="zoom-in" size={24} color="#007bff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => {
                const newRegion = {
                  ...region,
                  latitudeDelta: region.latitudeDelta * 2,
                  longitudeDelta: region.longitudeDelta * 2,
                };
                setRegion(newRegion);
                mapRef.current?.animateToRegion(newRegion, 300);
              }}
            >
              <MaterialIcons name="zoom-out" size={24} color="#007bff" />
            </TouchableOpacity>
          </View>
        </View>

        {selectedLocation && (
          <View style={styles.locationInfo}>
            <View style={styles.locationDetails}>
              <MaterialIcons name="place" size={20} color="#007bff" />
              <Text style={styles.locationText} numberOfLines={2}>
                {selectedLocation.address}
              </Text>
              {geocoding && (
                <ActivityIndicator
                  size="small"
                  color="#007bff"
                  style={styles.geocodingIndicator}
                />
              )}
            </View>
            <Text style={styles.coordinatesText}>
              {selectedLocation.latitude.toFixed(6)},{" "}
              {selectedLocation.longitude.toFixed(6)}
            </Text>
          </View>
        )}

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: statusBarHeight + 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    backgroundColor: "white",
  },
  headerButton: {
    padding: 5,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  currentLocationButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  centerMarker: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
    alignItems: "center",
    justifyContent: "center",
  },
  mapControls: {
    position: "absolute",
    top: 15,
    right: 15,
    flexDirection: "column",
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  existingTripMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  locationInfo: {
    backgroundColor: "white",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  locationDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  geocodingIndicator: {
    marginLeft: 8,
  },
  coordinatesText: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 28,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#64748b",
  },
});
