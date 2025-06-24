import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  TextInput,
  ScrollView,
  StatusBar,
  Animated,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { uploadTripData } from "../firebase/firebaseService";
import { reverseGeocode } from "../lib/services/apis/geocodingApi";
import useMediaCapture from "../hooks/useMediaCapture";
import useMapLocation from "../hooks/useMapLocation";
import MapLocationPicker from "../components/MapLocationPicker";
import StarRating from "../components/StarRating";
import WeatherSelector from "../components/WeatherSelector";
import { Audio } from "expo-av";
import { SelectedWeather } from "../lib/types/weather";

const { width, height } = Dimensions.get("window");

const isIphoneX = () => {
  const dimen = Dimensions.get("window");
  return (
    Platform.OS === "ios" &&
    (dimen.height === 780 ||
      dimen.width === 780 ||
      dimen.height === 812 ||
      dimen.width === 812 ||
      dimen.height === 844 ||
      dimen.width === 844 ||
      dimen.height === 896 ||
      dimen.width === 896 ||
      dimen.height === 926 ||
      dimen.width === 926 ||
      dimen.height === 932 ||
      dimen.width === 932 ||
      dimen.height === 956 ||
      dimen.width === 956)
  );
};

const statusBarHeight =
  Platform.OS === "ios"
    ? isIphoneX()
      ? 59
      : 20
    : StatusBar.currentHeight || 0;

export default function TripScreen({ navigation, route }: any) {
  const [description, setDescription] = useState<string>("");
  const [rating, setRating] = useState<number>(0);
  const [selectedWeather, setSelectedWeather] =
    useState<SelectedWeather | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [currentRecording, setCurrentRecording] =
    useState<Audio.Recording | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const [tripDate, setTripDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    photo,
    audioRecording,
    isRecording,
    selectOrCapturePhoto,
    startAudioRecording,
    stopAudioRecording,
    playAudioRecording,
    clearMedia,
  } = useMediaCapture();

  const {
    selectedLocation,
    isMapPickerVisible,
    openMapPicker,
    closeMapPicker,
    handleLocationSelect,
    getCurrentLocation,
    useHongKongLocation,
  } = useMapLocation();

  const suggestedLocation = route?.params?.suggestedLocation;

  const showBackButton =
    route?.params?.fromScreen && route.params.fromScreen !== "TabNavigation";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    if (suggestedLocation) {
      handleLocationSelect({
        latitude: suggestedLocation.latitude,
        longitude: suggestedLocation.longitude,
        address: suggestedLocation.address,
      });
    } else {
      useHongKongLocation();
    }
  }, [suggestedLocation]);

  const handleTakePhoto = async () => {
    await selectOrCapturePhoto(true);
    setPhotoModalVisible(false);
  };

  const handleSelectPhoto = async () => {
    await selectOrCapturePhoto(false);
    setPhotoModalVisible(false);
  };

  const handleStartRecording = async () => {
    const recording = await startAudioRecording();
    if (recording) {
      setCurrentRecording(recording);
    }
  };

  const handleStopRecording = async () => {
    if (currentRecording) {
      await stopAudioRecording(currentRecording);
      setCurrentRecording(null);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setTripDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleWeatherSelect = (weather: SelectedWeather) => {
    setSelectedWeather(weather);
  };

  const handleBackPress = () => {
    if (showBackButton) {
      navigation.goBack();
    }
  };

  const handleSubmitTrip = async () => {
    if (!selectedLocation) {
      Alert.alert("Error", "Please select a location for your trip");
      return;
    }

    if (rating === 0) {
      Alert.alert(
        "Rating Required",
        "Please rate this location before submitting"
      );
      return;
    }

    if (!selectedWeather) {
      Alert.alert(
        "Weather Required",
        "Please select the weather conditions for your trip"
      );
      return;
    }

    try {
      setLoading(true);
      setUploadProgress("Preparing trip data...");

      const tripDateString = tripDate.toISOString().split("T")[0];

      const cleanWeatherData: any = {
        condition: selectedWeather.condition,
        description: selectedWeather.description,
      };

      if (
        selectedWeather.temperature !== undefined &&
        selectedWeather.temperature !== null
      ) {
        cleanWeatherData.temperature = selectedWeather.temperature;
      }

      if (
        selectedWeather.humidity !== undefined &&
        selectedWeather.humidity !== null
      ) {
        cleanWeatherData.humidity = selectedWeather.humidity;
      }

      if (
        selectedWeather.windSpeed !== undefined &&
        selectedWeather.windSpeed !== null
      ) {
        cleanWeatherData.windSpeed = selectedWeather.windSpeed;
      }

      const tripData = {
        location: {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          address: selectedLocation.address,
        },
        photoUrl: photo || undefined,
        audioUrl: audioRecording.uri || undefined,
        description: description.trim() || undefined,
        rating: rating,
        tripDate: tripDateString,
        weather: cleanWeatherData,
      };

      setUploadProgress("Uploading photos and audio...");

      await uploadTripData(tripData);

      setUploadProgress("Trip saved successfully!");

      setTimeout(() => {
        Alert.alert(
          "🎉 Success!",
          "Your adventure has been logged successfully.",
          [
            {
              text: "View My Trips",
              onPress: () => {
                clearMedia("photo");
                clearMedia("audio");
                setDescription("");
                setRating(0);
                setSelectedWeather(null);
                setTripDate(new Date());
                navigation.navigate("MainTabs", { screen: "MyTrips" });
              },
            },
          ]
        );
      }, 1000);
    } catch (error) {
      setUploadProgress("");

      let errorMessage = "Could not save trip. Please try again.";

      if (
        error.message?.includes("Network error") ||
        error.message?.includes("network")
      ) {
        errorMessage =
          "Network error. Please check your internet connection and try again.";
      } else if (error.message?.includes("Storage permission")) {
        errorMessage =
          "Storage permission denied. Please check your app permissions.";
      } else if (error.message?.includes("Database permission")) {
        errorMessage =
          "Database access denied. Please check your authentication.";
      } else if (error.message?.includes("recent login")) {
        errorMessage = "Please log in again to continue.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.error("Trip submission error:", error);

      Alert.alert("Upload Failed", errorMessage, [
        {
          text: "Retry",
          onPress: handleSubmitTrip,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]);
    } finally {
      setLoading(false);
      setUploadProgress("");
    }
  };

  const PhotoModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={photoModalVisible}
      onRequestClose={() => setPhotoModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[styles.photoModal, { transform: [{ scale: fadeAnim }] }]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.photoModalTitle}>📸 Add Photo</Text>
            <TouchableOpacity
              onPress={() => setPhotoModalVisible(false)}
              style={styles.photoModalCloseButton}
            >
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.photoOptions}>
            <TouchableOpacity
              style={styles.photoOption}
              onPress={handleTakePhoto}
            >
              <View style={styles.photoOptionIcon}>
                <MaterialIcons name="camera-alt" size={28} color="#007bff" />
              </View>
              <Text style={styles.photoOptionText}>Take Photo</Text>
              <Text style={styles.photoOptionSubtext}>Use camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoOption}
              onPress={handleSelectPhoto}
            >
              <View style={styles.photoOptionIcon}>
                <MaterialIcons name="photo-library" size={28} color="#007bff" />
              </View>
              <Text style={styles.photoOptionText}>Choose Photo</Text>
              <Text style={styles.photoOptionSubtext}>From gallery</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  const LoadingModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={loading}
      onRequestClose={() => {}}
    >
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingTitle}>Saving Your Adventure</Text>
          <Text style={styles.loadingText}>{uploadProgress}</Text>
          <View style={styles.loadingProgressBar}>
            <View style={styles.loadingProgressFill} />
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <View style={styles.simpleHeader}>
        {showBackButton ? (
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <MaterialIcons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🎒 Log New Adventure</Text>
          <Text style={styles.headerSubtitle}>
            Create a memorable experience record
          </Text>
        </View>
      </View>

      <Animated.View
        style={{
          flex: 1,
          backgroundColor: "#f5f5f5",
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      rating > 0 && selectedWeather
                        ? 100
                        : rating > 0
                        ? 80
                        : selectedLocation
                        ? 60
                        : 20
                    }%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {rating > 0 && selectedWeather
                ? "Ready to submit!"
                : rating > 0
                ? "Add weather conditions"
                : selectedLocation
                ? "Add details"
                : "Getting started"}
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <MaterialIcons name="event" size={20} color="#007bff" />
              </View>
              <Text style={styles.sectionTitleText}>Trip Date</Text>
            </View>

            <TouchableOpacity
              style={styles.dateCard}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.dateContent}>
                <MaterialIcons
                  name="calendar-today"
                  size={20}
                  color="#007bff"
                />
                <Text style={styles.dateText}>{formatDate(tripDate)}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={tripDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <MaterialIcons name="place" size={20} color="#007bff" />
              </View>
              <Text style={styles.sectionTitleText}>Location</Text>
              {selectedLocation && (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>✓</Text>
                </View>
              )}
            </View>

            {selectedLocation ? (
              <View style={styles.locationCard}>
                <Text style={styles.locationAddress} numberOfLines={2}>
                  {selectedLocation.address}
                </Text>
                <View style={styles.locationActions}>
                  <TouchableOpacity
                    style={styles.changeLocationButton}
                    onPress={openMapPicker}
                  >
                    <MaterialIcons
                      name="edit-location"
                      size={16}
                      color="#007bff"
                    />
                    <Text style={styles.changeLocationText}>
                      Change location
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.useCurrentButton}
                    onPress={async () => {
                      const currentLoc = await getCurrentLocation();
                      if (currentLoc) {
                        const geocodeResult = await reverseGeocode(
                          currentLoc.latitude,
                          currentLoc.longitude
                        );
                        handleLocationSelect({
                          latitude: currentLoc.latitude,
                          longitude: currentLoc.longitude,
                          address:
                            geocodeResult?.formattedAddress ||
                            `${currentLoc.latitude.toFixed(
                              4
                            )}, ${currentLoc.longitude.toFixed(4)}`,
                        });
                      }
                    }}
                  >
                    <MaterialIcons
                      name="my-location"
                      size={16}
                      color="#007bff"
                    />
                    <Text style={styles.useCurrentText}>Use current</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.actionCard}
                onPress={openMapPicker}
              >
                <MaterialIcons name="add-location" size={24} color="#007bff" />
                <View style={styles.actionCardContent}>
                  <Text style={styles.actionCardTitle}>
                    Select trip location
                  </Text>
                  <Text style={styles.actionCardSubtitle}>
                    Choose where your adventure took place
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#ccc" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <MaterialIcons name="wb-sunny" size={20} color="#007bff" />
              </View>
              <Text style={styles.sectionTitleText}>Weather Conditions</Text>
              {selectedWeather && (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>✓</Text>
                </View>
              )}
            </View>

            <WeatherSelector
              selectedWeather={selectedWeather}
              onWeatherSelect={handleWeatherSelect}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <MaterialIcons name="collections" size={20} color="#007bff" />
              </View>
              <Text style={styles.sectionTitleText}>Capture Memories</Text>
            </View>

            <View style={styles.mediaGrid}>
              <View style={styles.mediaItem}>
                <Text style={styles.mediaLabel}>Photo</Text>
                {photo ? (
                  <View style={styles.mediaPreview}>
                    <Image source={{ uri: photo }} style={styles.mediaImage} />
                    <TouchableOpacity
                      style={styles.mediaRemoveButton}
                      onPress={() => clearMedia("photo")}
                    >
                      <MaterialIcons name="close" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.mediaPlaceholder}
                    onPress={() => setPhotoModalVisible(true)}
                  >
                    <MaterialIcons
                      name="add-a-photo"
                      size={24}
                      color="#007bff"
                    />
                    <Text style={styles.mediaPlaceholderText}>Add photo</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.mediaItem}>
                <Text style={styles.mediaLabel}>Voice Note</Text>
                {audioRecording.uri ? (
                  <View style={styles.audioPreview}>
                    <MaterialIcons
                      name="audiotrack"
                      size={24}
                      color="#28a745"
                    />
                    <Text style={styles.audioPreviewText}>Audio Recorded</Text>
                    <Text style={styles.audioSubtext}>Tap play to listen</Text>
                    <View style={styles.audioActions}>
                      <TouchableOpacity
                        style={[styles.audioActionButton, styles.playButton]}
                        onPress={playAudioRecording}
                      >
                        <MaterialIcons
                          name="play-arrow"
                          size={20}
                          color="white"
                        />
                        <Text style={styles.audioButtonText}>Play</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.audioActionButton, styles.deleteButton]}
                        onPress={() => clearMedia("audio")}
                      >
                        <MaterialIcons name="delete" size={16} color="white" />
                        <Text style={styles.audioButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.recordButton,
                      {
                        backgroundColor: isRecording ? "#dc3545" : "#28a745",
                      },
                    ]}
                    onPress={
                      isRecording ? handleStopRecording : handleStartRecording
                    }
                    disabled={loading}
                  >
                    <MaterialIcons
                      name={isRecording ? "stop" : "mic"}
                      size={24}
                      color="white"
                    />
                    <Text style={styles.recordButtonText}>
                      {isRecording ? "Stop Recording" : "Start Recording"}
                    </Text>
                    {isRecording && (
                      <View style={styles.recordingIndicator}>
                        <View style={styles.recordingDot} />
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <MaterialIcons name="edit-note" size={20} color="#007bff" />
              </View>
              <Text style={styles.sectionTitleText}>Description</Text>
              <Text style={styles.sectionOptional}>Optional</Text>
            </View>

            <TextInput
              style={styles.descriptionInput}
              placeholder="Tell us about your experience... What made this place special?"
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <MaterialIcons name="star" size={20} color="#007bff" />
              </View>
              <Text style={styles.sectionTitleText}>Rate this Location</Text>
              {rating > 0 && (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>✓</Text>
                </View>
              )}
            </View>

            <View style={styles.ratingCard}>
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                size={32}
                color="#FFD700"
              />
              <Text style={styles.ratingCardText}>
                {rating === 0
                  ? "Tap stars to rate this location"
                  : `${rating} star${rating !== 1 ? "s" : ""} - ${
                      rating === 1
                        ? "Poor"
                        : rating === 2
                        ? "Fair"
                        : rating === 3
                        ? "Good"
                        : rating === 4
                        ? "Very Good"
                        : "Excellent"
                    }`}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                opacity:
                  loading ||
                  !selectedLocation ||
                  rating === 0 ||
                  !selectedWeather
                    ? 0.5
                    : 1,
              },
            ]}
            onPress={handleSubmitTrip}
            disabled={
              loading || !selectedLocation || rating === 0 || !selectedWeather
            }
          >
            <MaterialIcons name="check-circle" size={24} color="white" />
            <Text style={styles.submitButtonText}>
              {loading ? "Saving..." : "Save Adventure"}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <PhotoModal />
      <LoadingModal />

      <MapLocationPicker
        visible={isMapPickerVisible}
        onClose={closeMapPicker}
        onLocationSelect={handleLocationSelect}
        initialLocation={
          selectedLocation
            ? {
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }
            : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  simpleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? (isIphoneX() ? 25 : 15) : 30,
    paddingBottom: 15,
    backgroundColor: "#f5f5f5",
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flex: 1,
    alignItems: "flex-start",
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
  headerActions: {
    marginLeft: 12,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  helpButton: {
    padding: 8,
  },
  progressContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: 4,
    backgroundColor: "#007bff",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
  },
  sectionOptional: {
    fontSize: 12,
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadgeText: {
    fontSize: 12,
    color: "white",
    fontWeight: "600",
  },
  dateCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dateContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 16,
    color: "#1e293b",
    marginLeft: 12,
    fontWeight: "500",
  },
  locationCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  locationAddress: {
    fontSize: 16,
    color: "#1e293b",
    lineHeight: 24,
    marginBottom: 12,
  },
  locationActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  changeLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  changeLocationText: {
    color: "#007bff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  useCurrentButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 8,
  },
  useCurrentText: {
    color: "#007bff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  actionCard: {
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
  actionCardContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 2,
  },
  actionCardSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  mediaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mediaItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  mediaLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 8,
  },
  mediaPreview: {
    position: "relative",
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  mediaImage: {
    width: "100%",
    height: 120,
  },
  mediaRemoveButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaPlaceholder: {
    backgroundColor: "white",
    borderRadius: 12,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
  },
  mediaPlaceholderText: {
    color: "#007bff",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  audioPreview: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    height: 120,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  audioPreviewText: {
    color: "#28a745",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 2,
  },
  audioSubtext: {
    color: "#64748b",
    fontSize: 11,
    marginBottom: 8,
  },
  audioActions: {
    flexDirection: "row",
    gap: 8,
  },
  audioActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 60,
    justifyContent: "center",
  },
  playButton: {
    backgroundColor: "#28a745",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
  },
  audioButtonText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
  recordButton: {
    backgroundColor: "#28a745",
    borderRadius: 12,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  recordButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },
  recordingIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff4444",
    opacity: 1,
  },
  descriptionInput: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 100,
    textAlignVertical: "top",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  ratingCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  ratingCardText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    textAlign: "center",
  },
  bottomActions: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButton: {
    backgroundColor: "#007bff",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#007bff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "white",
  },
  photoModalCloseButton: {
    padding: 4,
  },
  photoModal: {
    backgroundColor: "white",
    borderRadius: 20,
    margin: 20,
    overflow: "hidden",
    width: width * 0.9,
  },
  photoModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  photoOptions: {
    flexDirection: "row",
    padding: 20,
  },
  photoOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 20,
    marginHorizontal: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
  },
  photoOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  photoOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  photoOptionSubtext: {
    fontSize: 12,
    color: "#64748b",
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    width: width * 0.8,
    maxWidth: 300,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
  },
  loadingProgressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    overflow: "hidden",
  },
  loadingProgressFill: {
    width: "100%",
    height: "100%",
    backgroundColor: "#007bff",
    borderRadius: 2,
  },
});
