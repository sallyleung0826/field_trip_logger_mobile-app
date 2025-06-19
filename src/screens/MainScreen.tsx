import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ScrollView,
  RefreshControl,
  StatusBar,
  Platform,
  SafeAreaView,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { MaterialIcons } from "@expo/vector-icons";
import { getTripsGroupedByDate, deleteTrip } from "../firebase/firebaseService";
import { Trip } from "../lib/types/trip";
import { Audio } from "expo-av";
import StarRating from "../components/StarRating";
import { styles } from "../styles";

const statusBarHeight =
  Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 24;

export default function MainScreen({ navigation }: any) {
  const [tripsGroupedByDate, setTripsGroupedByDate] = useState<{
    [date: string]: Trip[];
  }>({});
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedTrips, setSelectedTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<Audio.Sound | null>(null);

  const loadTrips = async () => {
    try {
      const groupedTrips = await getTripsGroupedByDate();
      setTripsGroupedByDate(groupedTrips);

      const tripsForDate = groupedTrips[selectedDate] || [];
      setSelectedTrips(tripsForDate);
    } catch (error) {
      setTripsGroupedByDate({});
      setSelectedTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadTrips);
    loadTrips();
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const tripsForDate = tripsGroupedByDate[selectedDate] || [];
    setSelectedTrips(tripsForDate);
  }, [selectedDate, tripsGroupedByDate]);

  const playAudio = async (audioUrl: string) => {
    try {
      if (playingAudio) {
        await playingAudio.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      setPlayingAudio(sound);
      await sound.playAsync();
    } catch (error) {
      Alert.alert("Error", "Could not play audio");
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    Alert.alert("Delete Trip", "Are you sure you want to delete this trip?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTrip(tripId);
            await loadTrips();
            setModalVisible(false);
            Alert.alert("Success", "Trip deleted successfully");
          } catch (error) {
            Alert.alert("Error", "Could not delete trip");
          }
        },
      },
    ]);
  };

  const formatDate = (timestamp: any) => {
    try {
      if (timestamp?.toDate) {
        return timestamp.toDate().toLocaleDateString();
      } else if (timestamp?.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
      } else if (typeof timestamp === "string") {
        return new Date(timestamp).toLocaleDateString();
      }
      return "Recent";
    } catch (error) {
      return "Recent";
    }
  };

  const getWeatherIcon = (
    condition: string
  ): keyof typeof MaterialIcons.glyphMap => {
    const iconMap: { [key: string]: keyof typeof MaterialIcons.glyphMap } = {
      sunny: "wb-sunny",
      "partly-cloudy": "wb-cloudy",
      cloudy: "cloud",
      overcast: "cloud",
      "light-rain": "grain",
      rain: "grain",
      "heavy-rain": "grain",
      thunderstorm: "flash-on",
      drizzle: "grain",
      snow: "ac-unit",
      fog: "foggy",
      windy: "air",
      clear: "wb-sunny",
      clouds: "cloud",
    };
    return iconMap[condition.toLowerCase()] || "wb-sunny";
  };

  const getWeatherColor = (condition: string): string => {
    const colorMap: { [key: string]: string } = {
      sunny: "#FFD700",
      "partly-cloudy": "#87CEEB",
      cloudy: "#708090",
      overcast: "#696969",
      "light-rain": "#4682B4",
      rain: "#1E90FF",
      "heavy-rain": "#000080",
      thunderstorm: "#8A2BE2",
      drizzle: "#6495ED",
      snow: "#B0E0E6",
      fog: "#D3D3D3",
      windy: "#20B2AA",
      clear: "#FFD700",
      clouds: "#87CEEB",
    };
    return colorMap[condition.toLowerCase()] || "#FFD700";
  };

  const getMarkedDates = () => {
    const marked: any = {};

    Object.keys(tripsGroupedByDate).forEach((date) => {
      const trips = tripsGroupedByDate[date];
      if (trips && trips.length > 0) {
        marked[date] = {
          marked: true,
          dotColor: "#007bff",
          selectedColor: date === selectedDate ? "#007bff" : undefined,
          selected: date === selectedDate,
        };
      }
    });

    if (!marked[selectedDate]) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: "#007bff",
      };
    }

    return marked;
  };

  const renderTripItem = ({ item }: { item: Trip }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => {
        setSelectedTrip(item);
        setModalVisible(true);
      }}
    >
      {item.photoUrl ? (
        <Image source={{ uri: item.photoUrl }} style={styles.tripCardImage} />
      ) : (
        <View style={styles.tripCardImagePlaceholder}>
          <MaterialIcons name="photo" size={32} color="#ccc" />
        </View>
      )}
      <View style={styles.tripCardContent}>
        <Text style={styles.tripCardLocation} numberOfLines={2}>
          {item.location.address ||
            `${item.location.latitude.toFixed(
              4
            )}, ${item.location.longitude.toFixed(4)}`}
        </Text>
        {item.description && (
          <Text style={styles.tripCardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        {item.rating && (
          <View style={styles.tripCardRating}>
            <StarRating rating={item.rating} readonly size={16} />
          </View>
        )}
        <View style={styles.tripCardFooter}>
          <View style={styles.tripCardIcons}>
            {item.audioUrl && (
              <MaterialIcons name="audiotrack" size={16} color="#28a745" />
            )}
            {item.weather && (
              <MaterialIcons
                name={getWeatherIcon(item.weather.condition)}
                size={16}
                color={getWeatherColor(item.weather.condition)}
              />
            )}
          </View>
          <Text style={styles.tripCardTime}>
            {item.tripDate
              ? new Date(item.tripDate).toLocaleDateString()
              : formatDate(item.timestamp)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTripDetails = () => {
    if (!selectedTrip) return null;

    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalHeaderButton}
              onPress={() => setModalVisible(false)}
            >
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Trip Details</Text>
            <TouchableOpacity
              style={styles.modalHeaderButton}
              onPress={() => handleDeleteTrip(selectedTrip.id!)}
            >
              <MaterialIcons name="delete" size={24} color="#d9534f" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
          >
            {selectedTrip.photoUrl ? (
              <Image
                source={{ uri: selectedTrip.photoUrl }}
                style={styles.tripDetailImage}
              />
            ) : (
              <View style={styles.tripDetailImagePlaceholder}>
                <MaterialIcons name="photo" size={64} color="#ccc" />
                <Text style={styles.tripDetailImagePlaceholderText}>
                  No Photo
                </Text>
              </View>
            )}

            <View style={styles.quickInfoContainer}>
              <View style={styles.quickInfoCard}>
                <View style={styles.quickInfoIcon}>
                  <MaterialIcons name="event" size={20} color="#007bff" />
                </View>
                <View style={styles.quickInfoContent}>
                  <Text style={styles.quickInfoLabel}>Date</Text>
                  <Text style={styles.quickInfoValue}>
                    {selectedTrip.tripDate
                      ? new Date(selectedTrip.tripDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )
                      : formatDate(selectedTrip.timestamp)}
                  </Text>
                </View>
              </View>

              {selectedTrip.rating && (
                <View style={styles.quickInfoCard}>
                  <View style={styles.quickInfoIcon}>
                    <MaterialIcons name="star" size={20} color="#FFD700" />
                  </View>
                  <View style={styles.quickInfoContent}>
                    <Text style={styles.quickInfoLabel}>Rating</Text>
                    <Text style={styles.quickInfoValue}>
                      {selectedTrip.rating}/5 stars
                    </Text>
                  </View>
                </View>
              )}

              {selectedTrip.weather && (
                <View style={styles.quickInfoCard}>
                  <View style={styles.quickInfoIcon}>
                    <MaterialIcons
                      name={getWeatherIcon(selectedTrip.weather.condition)}
                      size={20}
                      color={getWeatherColor(selectedTrip.weather.condition)}
                    />
                  </View>
                  <View style={styles.quickInfoContent}>
                    <Text style={styles.quickInfoLabel}>Weather</Text>
                    <Text style={styles.quickInfoValue}>
                      {selectedTrip.weather.temperature}°C
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.tripDetailSection}>
              <View style={styles.tripDetailSectionHeader}>
                <MaterialIcons name="place" size={24} color="#007bff" />
                <Text style={styles.tripDetailSectionTitle}>Location</Text>
              </View>
              <Text style={styles.tripDetailSectionContent}>
                {selectedTrip.location.address ||
                  `${selectedTrip.location.latitude.toFixed(
                    4
                  )}, ${selectedTrip.location.longitude.toFixed(4)}`}
              </Text>
            </View>

            {selectedTrip.rating && (
              <View style={styles.tripDetailSection}>
                <View style={styles.tripDetailSectionHeader}>
                  <MaterialIcons name="star-rate" size={24} color="#FFD700" />
                  <Text style={styles.tripDetailSectionTitle}>Your Rating</Text>
                </View>
                <View style={styles.tripDetailRatingContainer}>
                  <StarRating rating={selectedTrip.rating} readonly size={28} />
                  <Text style={styles.tripDetailRatingText}>
                    {selectedTrip.rating} out of 5 stars -{" "}
                    {selectedTrip.rating === 1
                      ? "Poor"
                      : selectedTrip.rating === 2
                      ? "Fair"
                      : selectedTrip.rating === 3
                      ? "Good"
                      : selectedTrip.rating === 4
                      ? "Very Good"
                      : "Excellent"}
                  </Text>
                </View>
              </View>
            )}

            {selectedTrip.description && (
              <View style={styles.tripDetailSection}>
                <View style={styles.tripDetailSectionHeader}>
                  <MaterialIcons name="description" size={24} color="#10b981" />
                  <Text style={styles.tripDetailSectionTitle}>Description</Text>
                </View>
                <Text style={styles.tripDetailSectionContent}>
                  {selectedTrip.description}
                </Text>
              </View>
            )}

            {selectedTrip.audioUrl && (
              <View style={styles.tripDetailSection}>
                <View style={styles.tripDetailSectionHeader}>
                  <MaterialIcons name="audiotrack" size={24} color="#28a745" />
                  <Text style={styles.tripDetailSectionTitle}>Audio Note</Text>
                </View>
                <TouchableOpacity
                  style={styles.playAudioButton}
                  onPress={() => playAudio(selectedTrip.audioUrl!)}
                >
                  <MaterialIcons name="play-arrow" size={24} color="white" />
                  <Text style={styles.playAudioButtonText}>Play Recording</Text>
                </TouchableOpacity>
              </View>
            )}

            {selectedTrip.weather && (
              <View style={styles.tripDetailSection}>
                <View style={styles.tripDetailSectionHeader}>
                  <MaterialIcons
                    name={getWeatherIcon(selectedTrip.weather.condition)}
                    size={24}
                    color={getWeatherColor(selectedTrip.weather.condition)}
                  />
                  <Text style={styles.tripDetailSectionTitle}>
                    Weather Conditions
                  </Text>
                </View>
                <View style={styles.weatherDetailContainer}>
                  <View style={styles.weatherMainCard}>
                    <View style={styles.weatherMainInfo}>
                      <Text style={styles.weatherTemperature}>
                        {selectedTrip.weather.temperature}°C
                      </Text>
                      <Text style={styles.weatherCondition}>
                        {selectedTrip.weather.description ||
                          selectedTrip.weather.condition}
                      </Text>
                    </View>
                    <MaterialIcons
                      name={getWeatherIcon(selectedTrip.weather.condition)}
                      size={48}
                      color={getWeatherColor(selectedTrip.weather.condition)}
                    />
                  </View>

                  <View style={styles.weatherDetailsGrid}>
                    <View style={styles.weatherDetailItem}>
                      <MaterialIcons
                        name="water-drop"
                        size={18}
                        color="#4682B4"
                      />
                      <Text style={styles.weatherDetailLabel}>Humidity</Text>
                      <Text style={styles.weatherDetailValue}>
                        {selectedTrip.weather.humidity}%
                      </Text>
                    </View>

                    {selectedTrip.weather.windSpeed && (
                      <View style={styles.weatherDetailItem}>
                        <MaterialIcons name="air" size={18} color="#20B2AA" />
                        <Text style={styles.weatherDetailLabel}>
                          Wind Speed
                        </Text>
                        <Text style={styles.weatherDetailValue}>
                          {selectedTrip.weather.windSpeed} m/s
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}

            <View style={styles.tripDetailSection}>
              <View style={styles.tripDetailSectionHeader}>
                <MaterialIcons name="info" size={24} color="#64748b" />
                <Text style={styles.tripDetailSectionTitle}>
                  Trip Information
                </Text>
              </View>
              <View style={styles.metadataContainer}>
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>Created on</Text>
                  <Text style={styles.metadataValue}>
                    {selectedTrip.tripDate
                      ? new Date(selectedTrip.tripDate).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : formatDate(selectedTrip.timestamp)}
                  </Text>
                </View>

                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>Coordinates</Text>
                  <Text style={styles.metadataValue}>
                    {selectedTrip.location.latitude.toFixed(6)},{" "}
                    {selectedTrip.location.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <View style={[styles.simpleHeader, { paddingTop: 30 }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🎒 My Adventures</Text>
          <Text style={styles.headerSubtitle}>
            {Object.keys(tripsGroupedByDate).length} days with trips
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("Trip")}
        >
          <MaterialIcons name="add" size={24} color="#007bff" />
        </TouchableOpacity>
      </View>

      <View style={styles.calendarContainer}>
        <Calendar
          onDayPress={(day) => {
            setSelectedDate(day.dateString);
          }}
          markedDates={getMarkedDates()}
          theme={{
            backgroundColor: "#ffffff",
            calendarBackground: "#ffffff",
            textSectionTitleColor: "#b6c1cd",
            selectedDayBackgroundColor: "#007bff",
            selectedDayTextColor: "#ffffff",
            todayTextColor: "#007bff",
            dayTextColor: "#2d4150",
            textDisabledColor: "#d9e1e8",
            dotColor: "#007bff",
            selectedDotColor: "#ffffff",
            arrowColor: "#007bff",
            disabledArrowColor: "#d9e1e8",
            monthTextColor: "#2d4150",
            indicatorColor: "#007bff",
            textDayFontWeight: "400",
            textMonthFontWeight: "600",
            textDayHeaderFontWeight: "600",
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
          }}
          style={styles.calendar}
        />
      </View>

      <View style={styles.selectedDateContainer}>
        <Text style={styles.selectedDateTitle}>
          {new Date(selectedDate).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </Text>
        <Text style={styles.selectedDateSubtitle}>
          {selectedTrips.length} trip{selectedTrips.length !== 1 ? "s" : ""} on
          this day
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainerCenter}>
          <MaterialIcons name="hourglass-empty" size={48} color="#ccc" />
          <Text style={styles.loadingTextCenter}>Loading trips...</Text>
        </View>
      ) : selectedTrips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="explore-off" size={48} color="#ccc" />
          <Text style={styles.emptyTitle}>No trips on this date</Text>
          <Text style={styles.emptySubtitle}>
            {selectedDate === new Date().toISOString().split("T")[0]
              ? "Start your first adventure today!"
              : "Select a date with trips or create a new one"}
          </Text>
          <TouchableOpacity
            style={styles.createTripButton}
            onPress={() => navigation.navigate("Trip")}
          >
            <MaterialIcons name="add" size={20} color="white" />
            <Text style={styles.createTripButtonText}>Log New Trip</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={selectedTrips}
          renderItem={renderTripItem}
          keyExtractor={(item) => item.id || Math.random().toString()}
          style={styles.tripsList}
          contentContainerStyle={styles.tripsListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {renderTripDetails()}
    </SafeAreaView>
  );
}
