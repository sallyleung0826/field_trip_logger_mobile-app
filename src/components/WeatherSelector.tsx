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
import {
  getWeatherDescription,
  SelectedWeather,
  WEATHER_OPTIONS,
  WeatherOption,
} from "../lib/types/weather";

interface WeatherSelectorProps {
  selectedWeather?: SelectedWeather;
  onWeatherSelect: (weather: SelectedWeather) => void;
  style?: any;
}

export default function WeatherSelector({
  selectedWeather,
  onWeatherSelect,
  style,
}: WeatherSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleWeatherSelect = (weather: WeatherOption) => {
    const weatherData: SelectedWeather = {
      condition: weather.condition,
      description: weather.description,
    };

    onWeatherSelect(weatherData);
    setModalVisible(false);
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
                <Text style={styles.condition}>
                  {selectedWeather.description}
                </Text>
                <Text style={styles.conditionSubtext}>
                  Weather condition recorded
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
              <Text style={styles.instructionText}>
                Choose the weather condition that best describes the conditions
                during your trip:
              </Text>

              {WEATHER_OPTIONS.map((weather, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.weatherOption,
                    selectedWeather?.condition === weather.condition &&
                      styles.selectedWeatherOption,
                  ]}
                  onPress={() => handleWeatherSelect(weather)}
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
                  <View style={styles.weatherOptionContent}>
                    <Text style={styles.weatherOptionText}>
                      {weather.description}
                    </Text>
                    <Text style={styles.weatherOptionDescription}>
                      {getWeatherDescription(weather.condition)}
                    </Text>
                  </View>
                  {selectedWeather?.condition === weather.condition && (
                    <MaterialIcons
                      name="check-circle"
                      size={20}
                      color="#00cc44"
                    />
                  )}
                  {selectedWeather?.condition !== weather.condition && (
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color="#ccc"
                    />
                  )}
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
  },
  weatherInfo: {
    marginLeft: 12,
  },
  condition: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    textTransform: "capitalize",
  },
  conditionSubtext: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
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
  instructionText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 10,
    lineHeight: 20,
  },
  weatherOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedWeatherOption: {
    backgroundColor: "#f0f9ff",
    borderColor: "#007bff",
    borderWidth: 1,
  },
  weatherIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  weatherOptionContent: {
    flex: 1,
  },
  weatherOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 2,
  },
  weatherOptionDescription: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 16,
  },
});
