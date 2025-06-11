import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { logout } from "../firebase/auth";
import { auth } from "../firebase/config";
import { fetchUserTrips } from "../firebase/firebaseService";
import { reverseGeocode } from "../lib/services/apis/geocodingApi";
import * as Location from "expo-location";
import { styles } from "../styles";

export default function ProfileScreen({ navigation }: any) {
  const [userStats, setUserStats] = useState({
    totalTrips: 0,
    totalRatings: 0,
    averageRating: 0,
    favoriteLocation: "No trips yet",
  });
  const [recentLocation, setRecentLocation] = useState<string>("Loading...");
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    Alert.alert("Confirm Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            Alert.alert("Error", "Could not log out.");
          }
        },
      },
    ]);
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setRecentLocation("Location permission denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const geocodeResult = await reverseGeocode(
        location.coords.latitude,
        location.coords.longitude
      );

      if (geocodeResult) {
        setRecentLocation(geocodeResult.city || geocodeResult.formattedAddress);
      } else {
        setRecentLocation(
          `${location.coords.latitude.toFixed(
            4
          )}, ${location.coords.longitude.toFixed(4)}`
        );
      }
    } catch (error) {
      setRecentLocation("Unable to get location");
    }
  };

  const loadUserStats = async () => {
    try {
      setLoading(true);
      const trips = await fetchUserTrips();
      const ratingsData = trips.filter(
        (trip) => trip.rating && trip.rating > 0
      );

      const stats = {
        totalTrips: trips.length,
        totalRatings: ratingsData.length,
        averageRating:
          ratingsData.length > 0
            ? ratingsData.reduce((sum, trip) => sum + (trip.rating || 0), 0) /
              ratingsData.length
            : 0,
        favoriteLocation:
          trips.length > 0
            ? trips[0].location.address || "Recent trip location"
            : "No trips yet",
      };

      setUserStats(stats);
    } catch (error) {
      setUserStats({
        totalTrips: 0,
        totalRatings: 0,
        averageRating: 0,
        favoriteLocation: "Unable to load trips",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadUserStats();
      getCurrentLocation();
    });

    loadUserStats();
    getCurrentLocation();

    return unsubscribe;
  }, [navigation]);

  const StatCard = ({
    icon,
    title,
    value,
    subtitle,
  }: {
    icon: string;
    title: string;
    value: string | number;
    subtitle?: string;
  }) => (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 10,
        padding: 20,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        alignItems: "center",
      }}
    >
      <MaterialIcons name={icon as any} size={32} color="#007bff" />
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          color: "#333",
          marginTop: 10,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: "#666",
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            fontSize: 12,
            color: "#999",
            textAlign: "center",
            marginTop: 4,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );

  const MenuOption = ({
    icon,
    title,
    onPress,
    danger = false,
  }: {
    icon: string;
    title: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={{
        backgroundColor: "white",
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        flexDirection: "row",
        alignItems: "center",
      }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialIcons
        name={icon as any}
        size={24}
        color={danger ? "#d9534f" : "#007bff"}
      />
      <Text
        style={{
          marginLeft: 15,
          fontSize: 16,
          fontWeight: "500",
          color: danger ? "#d9534f" : "#333",
          flex: 1,
        }}
      >
        {title}
      </Text>
      <MaterialIcons name="chevron-right" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <View style={styles.simpleHeader}>
        <View>
          <Text style={styles.headerTitle}>👤 Profile</Text>
          <Text style={styles.headerSubtitle}>
            {auth.currentUser?.email || "Field Trip Explorer"}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#d9534f" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: "#333",
              marginBottom: 15,
            }}
          >
            📊 Your Adventure Stats
          </Text>

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View style={{ flex: 1, marginRight: 7.5 }}>
              <StatCard
                icon="list"
                title="Total Trips"
                value={loading ? "..." : userStats.totalTrips}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 7.5 }}>
              <StatCard
                icon="star"
                title="Avg Rating"
                value={
                  loading
                    ? "..."
                    : userStats.averageRating > 0
                    ? userStats.averageRating.toFixed(1)
                    : "—"
                }
                subtitle={`${userStats.totalRatings} ratings given`}
              />
            </View>
          </View>

          <StatCard
            icon="place"
            title="Recent Location"
            value={recentLocation}
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}
