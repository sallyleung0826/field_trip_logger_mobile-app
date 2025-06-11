import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { fetchTopRatedLocations } from "../firebase/firebaseService";
import { LocationRating } from "../lib/types/trip";
import StarRating from "../components/StarRating";
import WeatherWidget from "../components/WeatherWidget";
import { styles } from "../styles";

export default function ExploreScreen({ navigation }: any) {
  const [topLocations, setTopLocations] = useState<LocationRating[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTopLocations = async () => {
    try {
      setError(null);
      const locations = await fetchTopRatedLocations();
      setTopLocations(locations);
    } catch (error) {
      setError("Could not load top-rated locations");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTopLocations();
    setRefreshing(false);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.race([
          loadTopLocations(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 10000)
          ),
        ]);
      } catch (timeoutError) {
        setError("Loading timed out");
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const renderTopLocationItem = ({ item }: { item: LocationRating }) => (
    <View style={styles.locationRatingCard}>
      <Text style={styles.locationName} numberOfLines={2}>
        {item.address}
      </Text>
      <View style={styles.locationRatingRow}>
        <StarRating rating={item.averageRating} readonly size={16} />
        <Text style={styles.locationRatingCount}>
          ({item.totalRatings} {item.totalRatings === 1 ? "rating" : "ratings"})
        </Text>
      </View>
      <Text style={styles.locationCoords}>
        {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
      </Text>
    </View>
  );

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <View style={styles.simpleHeader}>
        <View>
          <Text style={styles.headerTitle}>🔍 Explore</Text>
          <Text style={styles.headerSubtitle}>
            Discover amazing places and plan your next adventure
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("Trip")}
        >
          <MaterialIcons name="add-location" size={24} color="#007bff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <WeatherWidget />

        {topLocations.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>⭐ Top Rated Locations</Text>
            {topLocations.slice(0, 5).map((location, index) => (
              <View key={`${location.latitude}-${location.longitude}-${index}`}>
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

        {error && !loading && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={20} color="#d32f2f" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={loadTopLocations}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
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
              onPress={() => navigation.navigate("Trip")}
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
    </View>
  );
}
