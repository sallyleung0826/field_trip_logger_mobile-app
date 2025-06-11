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
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { uploadTripData } from "../firebase/firebaseService";
import { reverseGeocode } from "../lib/services/apis/geocodingApi";
import useMediaCapture from "../hooks/useMediaCapture";
import useMapLocation from "../hooks/useMapLocation";
import MapLocationPicker from "../components/MapLocationPicker";
import StarRating from "../components/StarRating";
import WeatherSelector, {
  SelectedWeather,
} from "../components/WeatherSelector";
import { Audio } from "expo-av";
import { styles } from "../styles";

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
        weather: {
          condition: selectedWeather.condition,
          description: selectedWeather.description,
          temperature: selectedWeather.temperature,
          humidity: selectedWeather.humidity,
          windSpeed: selectedWeather.windSpeed,
        },
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
      } else if (error.message?.includes("Database temporarily unavailable")) {
        errorMessage =
          "Database temporarily unavailable. Please try again in a few moments.";
      } else if (error.message?.includes("permission")) {
        errorMessage = "Permission error. Please try logging out and back in.";
      }

      Alert.alert("Upload Failed", errorMessage, [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Retry",
          onPress: () => handleSubmitTrip(),
        },
      ]);
    } finally {
      setLoading(false);
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
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1a365d" />

      <View style={styles.professionalHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.professionalHeaderTitle}>Log Adventure</Text>
          <Text style={styles.professionalHeaderSubtitle}>
            Create a memorable experience
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.helpButton}>
            <MaterialIcons
              name="help-outline"
              size={20}
              color="rgba(255,255,255,0.8)"
            />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View
        style={{
          flex: 1,
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
                    <Text style={styles.audioPreviewText}>Recorded</Text>
                    <View style={styles.audioActions}>
                      <TouchableOpacity
                        style={styles.audioActionButton}
                        onPress={playAudioRecording}
                      >
                        <MaterialIcons
                          name="play-arrow"
                          size={16}
                          color="#28a745"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.audioActionButton}
                        onPress={() => clearMedia("audio")}
                      >
                        <MaterialIcons
                          name="delete"
                          size={16}
                          color="#d9534f"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.recordButton,
                      { backgroundColor: isRecording ? "#d9534f" : "#28a745" },
                    ]}
                    onPress={
                      isRecording ? handleStopRecording : handleStartRecording
                    }
                  >
                    <MaterialIcons
                      name={isRecording ? "stop" : "mic"}
                      size={20}
                      color="white"
                    />
                    <Text style={styles.recordButtonText}>
                      {isRecording ? "Stop" : "Record"}
                    </Text>
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
    </View>
  );
}
