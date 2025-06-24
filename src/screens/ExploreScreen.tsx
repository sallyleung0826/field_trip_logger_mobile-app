import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import MapView, { Marker, Callout, Region } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { getUserTrips } from "../firebase/firebaseService";
import { getTopRatedLocations } from "../firebase/firebaseService";
import {
  Trip,
  LocationRating,
  HONG_KONG_REGION,
  ClusteredMarker,
} from "../lib/types/trip";
import WeatherWidget from "../components/WeatherWidget";

export default function ExploreScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<"map" | "list">("map");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [topLocations, setTopLocations] = useState<LocationRating[]>([]);
  const [clusteredMarkers, setClusteredMarkers] = useState<ClusteredMarker[]>(
    []
  );
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(HONG_KONG_REGION);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [showUserLocation, setShowUserLocation] = useState(false);

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    loadData();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [userTrips, locations] = await Promise.all([
        getUserTrips(),
        getTopRatedLocations(20),
      ]);

      setTrips(userTrips);
      setTopLocations(locations);

      const markers = generateClusteredMarkers(userTrips, mapRegion);
      setClusteredMarkers(markers);
    } catch (err) {
      console.error("Error loading explore data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const generateClusteredMarkers = (
    trips: Trip[],
    region: Region
  ): ClusteredMarker[] => {
    if (!trips.length) return [];

    const CLUSTER_DISTANCE = 0.01;
    const clusters: ClusteredMarker[] = [];

    trips.forEach((trip) => {
      if (!trip.location?.latitude || !trip.location?.longitude) return;

      const existingCluster = clusters.find((cluster) => {
        const distance = Math.sqrt(
          Math.pow(cluster.latitude - trip.location.latitude, 2) +
            Math.pow(cluster.longitude - trip.location.longitude, 2)
        );
        return distance < CLUSTER_DISTANCE;
      });

      if (existingCluster) {
        existingCluster.trips.push(trip);
        existingCluster.averageRating =
          existingCluster.trips.reduce((sum, t) => sum + (t.rating || 0), 0) /
          existingCluster.trips.length;

        const totalTrips = existingCluster.trips.length;
        existingCluster.latitude =
          existingCluster.trips.reduce(
            (sum, t) => sum + t.location.latitude,
            0
          ) / totalTrips;
        existingCluster.longitude =
          existingCluster.trips.reduce(
            (sum, t) => sum + t.location.longitude,
            0
          ) / totalTrips;
      } else {
        clusters.push({
          id: trip.id || `cluster_${Date.now()}_${Math.random()}`,
          latitude: trip.location.latitude,
          longitude: trip.location.longitude,
          trips: [trip],
          averageRating: trip.rating || 0,
          isCluster: false,
        });
      }
    });

    clusters.forEach((cluster) => {
      cluster.isCluster = cluster.trips.length > 1;
    });

    return clusters;
  };

  const onRegionChangeComplete = (region: Region) => {
    setMapRegion(region);
    const markers = generateClusteredMarkers(trips, region);
    setClusteredMarkers(markers);
  };

  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      const region: Region = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      mapRef.current.animateToRegion(region, 1000);
      setShowUserLocation(true);
    } else {
      Alert.alert(
        "Location not available",
        "Unable to get your current location"
      );
    }
  };

  const onMarkerPress = (marker: ClusteredMarker) => {
    if (marker.isCluster) {
      const region: Region = {
        latitude: marker.latitude,
        longitude: marker.longitude,
        latitudeDelta: mapRegion.latitudeDelta * 0.3,
        longitudeDelta: mapRegion.longitudeDelta * 0.3,
      };
      mapRef.current?.animateToRegion(region, 500);
    } else {
      setSelectedTrip(marker.trips[0]);
    }
  };

  const getMarkerColor = (rating: number): string => {
    if (rating >= 4.5) return "#22c55e"; // Green for excellent
    if (rating >= 3.5) return "#eab308"; // Yellow for good
    if (rating >= 2.5) return "#f97316"; // Orange for average
    return "#ef4444"; // Red for poor
  };

  const renderMarker = (marker: ClusteredMarker) => (
    <Marker
      key={marker.id}
      coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
      onPress={() => onMarkerPress(marker)}
    >
      <View
        style={[
          styles.markerContainer,
          {
            backgroundColor: getMarkerColor(marker.averageRating),
            borderColor: marker.isCluster ? "#ffffff" : "transparent",
            borderWidth: marker.isCluster ? 2 : 0,
          },
        ]}
      >
        {marker.isCluster ? (
          <Text style={styles.clusterText}>{marker.trips.length}</Text>
        ) : (
          <MaterialIcons name="place" size={20} color="white" />
        )}
      </View>

      {!marker.isCluster && (
        <Callout style={styles.calloutContainer}>
          <View style={styles.callout}>
            <Text style={styles.calloutTitle} numberOfLines={2}>
              {marker.trips[0].location.address || "Unknown Location"}
            </Text>
            <View style={styles.calloutRating}>
              <Text style={styles.ratingStars}>
                {"★".repeat(Math.floor(marker.averageRating))}
                {"☆".repeat(5 - Math.floor(marker.averageRating))}
              </Text>
              <Text style={styles.ratingNumber}>
                {marker.averageRating.toFixed(1)}
              </Text>
            </View>
            {marker.trips[0].description && (
              <Text style={styles.calloutDescription} numberOfLines={2}>
                {marker.trips[0].description}
              </Text>
            )}
          </View>
        </Callout>
      )}
    </Marker>
  );

  const renderTopLocationItem = ({ item }: { item: LocationRating }) => (
    <TouchableOpacity
      style={styles.locationItem}
      onPress={() => {
        setActiveTab("map");
        const region: Region = {
          latitude: item.latitude,
          longitude: item.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        mapRef.current?.animateToRegion(region, 1000);
      }}
    >
      <View style={styles.locationInfo}>
        <Text style={styles.locationName} numberOfLines={1}>
          {item.address || "Unknown Location"}
        </Text>
        <View style={styles.locationRating}>
          <Text style={styles.ratingStars}>
            {"★".repeat(Math.floor(item.averageRating))}
            {"☆".repeat(5 - Math.floor(item.averageRating))}
          </Text>
          <Text style={styles.ratingText}>
            {item.averageRating.toFixed(1)} ({item.totalRatings}{" "}
            {item.totalRatings === 1 ? "rating" : "ratings"})
          </Text>
        </View>
        <Text style={styles.locationCoords}>
          {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#666" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <View style={[styles.simpleHeader, { paddingTop: 30 }]}>
        <View>
          <Text style={styles.headerTitle}>🔍 Explore</Text>
          <Text style={styles.headerSubtitle}>
            Discover amazing places and plan your next adventure
          </Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "map" && styles.activeTab]}
          onPress={() => setActiveTab("map")}
        >
          <MaterialIcons
            name="map"
            size={18}
            color={activeTab === "map" ? "#007bff" : "#666"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "map" && styles.activeTabText,
            ]}
          >
            Map View
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "list" && styles.activeTab]}
          onPress={() => setActiveTab("list")}
        >
          <MaterialIcons
            name="list"
            size={18}
            color={activeTab === "list" ? "#007bff" : "#666"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "list" && styles.activeTabText,
            ]}
          >
            List View
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "map" ? (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={HONG_KONG_REGION}
            onRegionChangeComplete={onRegionChangeComplete}
            showsUserLocation={showUserLocation}
            showsMyLocationButton={false}
            showsCompass={true}
            showsScale={true}
            mapType="standard"
          >
            {clusteredMarkers.map(renderMarker)}

            {topLocations.map((location) => (
              <Marker
                key={`top_${location.id}`}
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                pinColor="#ff6b6b"
              >
                <Callout>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>⭐ Top Rated</Text>
                    <Text style={styles.calloutSubtitle}>
                      {location.address}
                    </Text>
                    <Text style={styles.calloutRating}>
                      {location.averageRating.toFixed(1)} ★ (
                      {location.totalRatings} reviews)
                    </Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>

          <View style={styles.mapControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={centerOnUserLocation}
            >
              <MaterialIcons name="my-location" size={24} color="#007bff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => {
                const region: Region = {
                  ...HONG_KONG_REGION,
                  latitudeDelta: 0.3,
                  longitudeDelta: 0.3,
                };
                mapRef.current?.animateToRegion(region, 1000);
              }}
            >
              <MaterialIcons name="zoom-out-map" size={24} color="#007bff" />
            </TouchableOpacity>
          </View>

          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Rating Legend</Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: "#22c55e" }]}
                />
                <Text style={styles.legendText}>Excellent (4.5+)</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: "#eab308" }]}
                />
                <Text style={styles.legendText}>Good (3.5+)</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: "#f97316" }]}
                />
                <Text style={styles.legendText}>Average (2.5+)</Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <WeatherWidget />

          {topLocations.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>⭐ Top Rated Locations</Text>
              {topLocations.slice(0, 10).map((location, index) => (
                <View
                  key={`${location.latitude}-${location.longitude}-${index}`}
                >
                  {renderTopLocationItem({ item: location })}
                </View>
              ))}
            </View>
          )}

          {loading && (
            <View style={styles.loadingContainerCenter}>
              <MaterialIcons name="hourglass-empty" size={48} color="#ccc" />
              <Text style={styles.loadingTextCenter}>Loading locations...</Text>
            </View>
          )}

          {!loading && !error && topLocations.length === 0 && (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="explore-off" size={48} color="#ccc" />
              <Text style={styles.emptyTitle}>No locations found</Text>
              <Text style={styles.emptySubtitle}>
                Be the first to rate and share amazing places!
              </Text>
              <TouchableOpacity
                style={styles.createTripButton}
                onPress={() => navigation.navigate("CreateTrip")}
              >
                <MaterialIcons name="add" size={20} color="white" />
                <Text style={styles.createTripButtonText}>
                  Log Your First Trip
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  simpleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 25 : 30,
    paddingBottom: 15,
    backgroundColor: "#f5f5f5",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    marginHorizontal: 20,
    marginBottom: 15,
    marginTop: 10,
    borderRadius: 10,
    padding: 5,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#007bff",
  },
  mapContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  clusterText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  calloutContainer: {
    width: 200,
  },
  callout: {
    padding: 10,
    minWidth: 180,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  calloutSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  calloutRating: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingStars: {
    color: "#fbbf24",
    fontSize: 14,
    marginRight: 4,
  },
  ratingNumber: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  calloutDescription: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 16,
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
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  legend: {
    position: "absolute",
    bottom: 15,
    left: 15,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: "column",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 10,
    color: "#64748b",
  },
  listContainer: {
    flex: 1,
  },
  sectionContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    margin: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#1e293b",
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 8,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  locationRating: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: "#64748b",
    marginLeft: 8,
  },
  locationCoords: {
    fontSize: 12,
    color: "#94a3b8",
  },
  loadingContainerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingTextCenter: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "white",
    margin: 15,
    borderRadius: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 20,
  },
  createTripButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007bff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createTripButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  bottomPadding: {
    height: Platform.OS === "ios" ? 100 : 80,
  },
});
