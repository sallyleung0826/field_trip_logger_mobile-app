import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export interface WeatherOption {
  condition: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  temperature?: number;
}

export interface SelectedWeather {
  condition: string;
  description: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
}

interface WeatherSelectorProps {
  selectedWeather?: SelectedWeather;
  onWeatherSelect: (weather: SelectedWeather) => void;
  style?: any;
}

const WEATHER_OPTIONS: WeatherOption[] = [
  {
    condition: "sunny",
    description: "Sunny",
    icon: "wb-sunny",
    color: "#FFD700",
  },
  {
    condition: "partly-cloudy",
    description: "Partly Cloudy",
    icon: "wb-cloudy",
    color: "#87CEEB",
  },
  {
    condition: "cloudy",
    description: "Cloudy",
    icon: "cloud",
    color: "#708090",
  },
  {
    condition: "overcast",
    description: "Overcast",
    icon: "cloud",
    color: "#696969",
  },
  {
    condition: "light-rain",
    description: "Light Rain",
    icon: "grain",
    color: "#4682B4",
  },
  {
    condition: "rain",
    description: "Rain",
    icon: "grain",
    color: "#1E90FF",
  },
  {
    condition: "heavy-rain",
    description: "Heavy Rain",
    icon: "grain",
    color: "#000080",
  },
  {
    condition: "thunderstorm",
    description: "Thunderstorm",
    icon: "flash-on",
    color: "#8A2BE2",
  },
  {
    condition: "drizzle",
    description: "Drizzle",
    icon: "grain",
    color: "#6495ED",
  },
  {
    condition: "snow",
    description: "Snow",
    icon: "ac-unit",
    color: "#B0E0E6",
  },
  {
    condition: "fog",
    description: "Fog",
    icon: "foggy",
    color: "#D3D3D3",
  },
  {
    condition: "windy",
    description: "Windy",
    icon: "air",
    color: "#20B2AA",
  },
];

const TEMPERATURE_RANGES = [
  { label: "Very Cold", range: "< 0°C", value: -5 },
  { label: "Cold", range: "0-10°C", value: 5 },
  { label: "Cool", range: "10-20°C", value: 15 },
  { label: "Mild", range: "20-25°C", value: 22 },
  { label: "Warm", range: "25-30°C", value: 27 },
  { label: "Hot", range: "30-35°C", value: 32 },
  { label: "Very Hot", range: "> 35°C", value: 38 },
];

export default function WeatherSelector({
  selectedWeather,
  onWeatherSelect,
  style,
}: WeatherSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempModalVisible, setTempModalVisible] = useState(false);
  const [selectedCondition, setSelectedCondition] =
    useState<WeatherOption | null>(null);

  const handleWeatherConditionSelect = (weather: WeatherOption) => {
    setSelectedCondition(weather);
    setModalVisible(false);
    setTempModalVisible(true);
  };

  const handleTemperatureSelect = (temperature: number) => {
    if (selectedCondition) {
      const weatherData: SelectedWeather = {
        condition: selectedCondition.condition,
        description: selectedCondition.description,
        temperature: temperature,
        humidity: getDefaultHumidity(selectedCondition.condition, temperature),
        windSpeed: getDefaultWindSpeed(selectedCondition.condition),
      };

      onWeatherSelect(weatherData);
      setTempModalVisible(false);
      setSelectedCondition(null);
    }
  };

  const getDefaultHumidity = (
    condition: string,
    temperature: number
  ): number => {
    const humidityMap: { [key: string]: number } = {
      sunny: Math.max(30, 60 - Math.max(0, temperature - 25) * 2),
      "partly-cloudy": 55,
      cloudy: 65,
      overcast: 70,
      "light-rain": 80,
      rain: 85,
      "heavy-rain": 90,
      thunderstorm: 85,
      drizzle: 80,
      snow: 75,
      fog: 95,
      windy: 50,
    };
    return humidityMap[condition] || 60;
  };

  const getDefaultWindSpeed = (condition: string): number => {
    const windSpeedMap: { [key: string]: number } = {
      sunny: 2,
      "partly-cloudy": 3,
      cloudy: 4,
      overcast: 3,
      "light-rain": 8,
      rain: 12,
      "heavy-rain": 15,
      thunderstorm: 20,
      drizzle: 6,
      snow: 10,
      fog: 1,
      windy: 25,
    };
    return windSpeedMap[condition] || 5;
  };

  const getWeatherIcon = (
    condition: string
  ): keyof typeof MaterialIcons.glyphMap => {
    const weather = WEATHER_OPTIONS.find((w) => w.condition === condition);
    return weather?.icon || "wb-sunny";
  };

  const getWeatherColor = (condition: string): string => {
    const weather = WEATHER_OPTIONS.find((w) => w.condition === condition);
    return weather?.color || "#FFD700";
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.selectorCard}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorHeader}>
          <View style={styles.selectorIcon}>
            <MaterialIcons name="edit" size={16} color="#007bff" />
          </View>
          <Text style={styles.selectorTitle}>Weather Conditions</Text>
        </View>

        {selectedWeather ? (
          <View style={styles.selectedWeatherContainer}>
            <View style={styles.weatherMain}>
              <MaterialIcons
                name={getWeatherIcon(selectedWeather.condition)}
                size={32}
                color={getWeatherColor(selectedWeather.condition)}
              />
              <View style={styles.weatherInfo}>
                <Text style={styles.temperature}>
                  {selectedWeather.temperature}°C
                </Text>
                <Text style={styles.condition}>
                  {selectedWeather.description}
                </Text>
              </View>
            </View>
            <View style={styles.weatherDetails}>
              <View style={styles.weatherDetail}>
                <MaterialIcons name="water-drop" size={14} color="#007bff" />
                <Text style={styles.weatherDetailText}>
                  {selectedWeather.humidity}%
                </Text>
              </View>
              <View style={styles.weatherDetail}>
                <MaterialIcons name="air" size={14} color="#007bff" />
                <Text style={styles.weatherDetailText}>
                  {selectedWeather.windSpeed} m/s
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <MaterialIcons name="wb-sunny" size={24} color="#ccc" />
            <Text style={styles.placeholderText}>Tap to select weather</Text>
          </View>
        )}

        <MaterialIcons name="chevron-right" size={20} color="#ccc" />
      </TouchableOpacity>

      {/* Weather Condition Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Weather Condition</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsContainer}>
              {WEATHER_OPTIONS.map((weather, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.weatherOption}
                  onPress={() => handleWeatherConditionSelect(weather)}
                >
                  <View
                    style={[
                      styles.weatherIconContainer,
                      { backgroundColor: weather.color + "20" },
                    ]}
                  >
                    <MaterialIcons
                      name={weather.icon}
                      size={28}
                      color={weather.color}
                    />
                  </View>
                  <Text style={styles.weatherOptionText}>
                    {weather.description}
                  </Text>
                  <MaterialIcons name="chevron-right" size={20} color="#ccc" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Temperature Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={tempModalVisible}
        onRequestClose={() => setTempModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Temperature Range</Text>
              <TouchableOpacity
                onPress={() => setTempModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsContainer}>
              {TEMPERATURE_RANGES.map((temp, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.temperatureOption}
                  onPress={() => handleTemperatureSelect(temp.value)}
                >
                  <View style={styles.temperatureInfo}>
                    <Text style={styles.temperatureLabel}>{temp.label}</Text>
                    <Text style={styles.temperatureRange}>{temp.range}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color="#ccc" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  selectorCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  selectorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  selectorIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  selectorTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  selectedWeatherContainer: {
    flex: 1,
    marginRight: 12,
  },
  weatherMain: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  weatherInfo: {
    marginLeft: 12,
  },
  temperature: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  condition: {
    fontSize: 12,
    color: "#64748b",
    textTransform: "capitalize",
    marginTop: 2,
  },
  weatherDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  weatherDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  weatherDetailText: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 4,
  },
  placeholderContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  placeholderText: {
    fontSize: 14,
    color: "#94a3b8",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  weatherOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  weatherIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  weatherOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
  },
  temperatureOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  temperatureInfo: {
    flex: 1,
  },
  temperatureLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 2,
  },
  temperatureRange: {
    fontSize: 14,
    color: "#64748b",
  },
});
