import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { fetchWeatherData } from "../lib/services/apis/weatherApi";
import { WeatherData } from "../lib/services/apis/types/apiTypes";
import { getWeatherColor, getWeatherIcon } from "../lib/types/weather";

interface WeatherWidgetProps {
  style?: any;
  location?: { latitude: number; longitude: number };
}

export default function WeatherWidget({ style, location }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWeatherData = async () => {
    try {
      console.log("[Weather Widget] Starting weather data load");
      console.log("[Weather Widget] Location prop:", location);

      setLoading(true);
      setError(null);
      let coords = location;

      if (!coords) {
        console.log(
          "[Weather Widget] No location provided, requesting current location"
        );

        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log("[Weather Widget] Location permission status:", status);

        if (status !== "granted") {
          console.error("[Weather Widget] Location permission denied");
          setError("Location permission denied");
          setLoading(false);
          return;
        }

        try {
          console.log("[Weather Widget] Getting current position");

          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          coords = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          };

          console.log("[Weather Widget] Current location obtained:", coords);
        } catch (locationError) {
          console.error(
            "[Weather Widget] Failed to get current location:",
            locationError
          );
          setError("Unable to get location");
          setLoading(false);
          return;
        }
      }

      if (coords) {
        console.log(
          "[Weather Widget] Making weather API call for coordinates:",
          coords
        );

        try {
          console.log("[Weather Widget] Fetching current weather data");

          const weatherData = await fetchWeatherData(
            coords.latitude,
            coords.longitude
          );

          console.log("[Weather Widget] Weather API call completed");

          if (weatherData) {
            console.log("[Weather Widget] Weather data received:", weatherData);
            setWeather(weatherData);
            setError(null);
          } else {
            console.error("[Weather Widget] No weather data received");
            setError("Weather data unavailable");
          }
        } catch (weatherError) {
          console.error("[Weather Widget] Weather fetch error:", weatherError);

          const errorMessage =
            weatherError instanceof Error
              ? weatherError.message
              : "Weather service unavailable";

          if (
            errorMessage.includes("Rate limit") ||
            errorMessage.includes("seconds apart")
          ) {
            setError(
              "Weather service is rate limited. Please try again in a few seconds."
            );
          } else if (errorMessage.includes("API key")) {
            setError("Weather service configuration issue");
          } else {
            setError("Weather service unavailable");
          }
        }
      } else {
        console.error("[Weather Widget] No coordinates available");
        setError("Location unavailable");
      }
    } catch (error) {
      console.error("[Weather Widget] Error loading weather data:", error);
      setError("Failed to load weather");
    } finally {
      console.log("[Weather Widget] Weather loading completed");
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(
      "[Weather Widget] Effect triggered, location changed:",
      location
    );
    loadWeatherData();
  }, [location]);

  if (loading) {
    console.log("[Weather Widget] Rendering loading state");
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator size="small" color="#007bff" />
        <Text style={styles.loadingText}>Loading weather...</Text>
      </View>
    );
  }

  if (error || !weather) {
    console.log("[Weather Widget] Rendering error state:", error);
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <MaterialIcons name="error-outline" size={24} color="#ff6b6b" />
        <Text style={styles.errorText}>{error || "Weather unavailable"}</Text>
        <TouchableOpacity onPress={loadWeatherData} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  console.log("[Weather Widget] Rendering weather data:", weather);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.currentWeather}>
          <MaterialIcons
            name={getWeatherIcon(weather.condition)}
            size={32}
            color={getWeatherColor(weather.condition)}
          />
          <View style={styles.weatherInfo}>
            <Text style={styles.temperature}>{weather.temperature}°C</Text>
            <Text style={styles.condition}>{weather.description}</Text>
          </View>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <MaterialIcons name="opacity" size={16} color="#007bff" />
          <Text style={styles.detailText}>{weather.humidity}%</Text>
          <Text style={styles.detailLabel}>Humidity</Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialIcons name="air" size={16} color="#007bff" />
          <Text style={styles.detailText}>{weather.windSpeed} m/s</Text>
          <Text style={styles.detailLabel}>Wind Speed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 10,
    margin: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    color: "#666",
  },
  errorContainer: {
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#ff6b6b",
    marginTop: 8,
    marginBottom: 10,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  retryText: {
    color: "white",
    fontWeight: "600",
  },
  header: {
    padding: 15,
  },
  currentWeather: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  weatherInfo: {
    marginLeft: 12,
    alignItems: "center",
  },
  temperature: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  condition: {
    fontSize: 16,
    color: "#666",
    textTransform: "capitalize",
    marginTop: 4,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 15,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 15,
  },
  detailItem: {
    alignItems: "center",
  },
  detailText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 5,
  },
  detailLabel: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
});
