import { useState } from "react";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { Alert } from "react-native";

export default function useMediaCapture() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [photo, setPhoto] = useState<string | null>(null);
  const [audioRecording, setAudioRecording] = useState<{
    uri: string | null;
    sound: Audio.Sound | null;
  }>({ uri: null, sound: null });
  const [isRecording, setIsRecording] = useState(false);
  const [currentRecording, setCurrentRecording] =
    useState<Audio.Recording | null>(null);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackDuration, setPlaybackDuration] = useState<number>(0);
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);

  const captureLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Location access is required");
        return null;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      return currentLocation;
    } catch (error) {
      Alert.alert("Error", "Could not capture location");
      return null;
    }
  };

  const selectOrCapturePhoto = async (fromCamera: boolean = true) => {
    try {
      let result;
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission needed", "Camera access is required");
          return null;
        }

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.7,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.7,
        });
      }

      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      Alert.alert("Error", "Could not capture/select photo");
      return null;
    }
  };

  const startAudioRecording = async () => {
    try {
      console.log("[Audio] Starting recording process...");

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Microphone access is required to record audio"
        );
        return null;
      }
      console.log("[Audio] Permissions granted");

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      console.log("[Audio] Audio mode set");

      const recording = new Audio.Recording();

      await recording.prepareToRecordAsync({
        android: {
          extension: ".m4a",
          outputFormat: 2,
          audioEncoder: 3,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 64000,
        },
        ios: {
          extension: ".m4a",
          audioQuality: 0,
          sampleRate: 0,
          numberOfChannels: 0,
          bitRate: 0,
        },
        web: {
          mimeType: "audio/webm",
          bitsPerSecond: 64000,
        },
      });
      console.log("[Audio] Recording prepared");

      await recording.startAsync();
      console.log("[Audio] Recording started");

      setIsRecording(true);
      setCurrentRecording(recording);

      return recording;
    } catch (error) {
      console.error("[Audio] Error starting recording:", error);
      Alert.alert(
        "Recording Error",
        "Could not start audio recording. Please try again."
      );
      setIsRecording(false);
      setCurrentRecording(null);
      return null;
    }
  };

  const stopAudioRecording = async (recording: Audio.Recording) => {
    try {
      console.log("[Audio] Stopping recording...");

      if (!recording) {
        throw new Error("No recording instance provided");
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      console.log("[Audio] Recording stopped, URI:", uri);

      if (!uri) {
        throw new Error("Recording URI is null - recording may have failed");
      }

      if (audioRecording.sound) {
        await audioRecording.sound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: false,
          progressUpdateIntervalMillis: 100,
        }
      );

      console.log("[Audio] Sound object created successfully");

      setAudioRecording({ uri, sound });
      setIsRecording(false);
      setCurrentRecording(null);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      return uri;
    } catch (error) {
      console.error("[Audio] Error stopping recording:", error);
      Alert.alert(
        "Recording Error",
        "Could not save audio recording. Please try again."
      );
      setIsRecording(false);
      setCurrentRecording(null);
      return null;
    }
  };

  const playAudioRecording = async () => {
    try {
      console.log("[Audio] Attempting to play recording...");

      if (!audioRecording.uri) {
        Alert.alert("No Recording", "No audio recording found to play");
        return;
      }

      if (isPlayingAudio && audioRecording.sound) {
        console.log("[Audio] Stopping currently playing audio");
        await audioRecording.sound.stopAsync();
        setIsPlayingAudio(false);
        setPlaybackPosition(0);
        return;
      }

      if (!audioRecording.sound) {
        console.log("[Audio] No sound object, creating new one...");
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioRecording.uri },
          {
            shouldPlay: false,
            progressUpdateIntervalMillis: 100,
          }
        );

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            setPlaybackPosition(status.positionMillis || 0);
            setPlaybackDuration(status.durationMillis || 0);

            if (status.didJustFinish) {
              console.log("[Audio] Playback finished");
              setIsPlayingAudio(false);
              setPlaybackPosition(0);
            }
          }
        });

        setAudioRecording((prev) => ({ ...prev, sound }));

        setIsPlayingAudio(true);
        await sound.replayAsync();
      } else {
        console.log("[Audio] Playing existing sound object...");

        const status = await audioRecording.sound.getStatusAsync();
        console.log("[Audio] Sound status:", status);

        if (status.isLoaded) {
          audioRecording.sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded) {
              setPlaybackPosition(status.positionMillis || 0);
              setPlaybackDuration(status.durationMillis || 0);

              if (status.didJustFinish) {
                console.log("[Audio] Playback finished");
                setIsPlayingAudio(false);
                setPlaybackPosition(0);
              }
            }
          });

          await audioRecording.sound.setPositionAsync(0);
          setIsPlayingAudio(true);
          await audioRecording.sound.playAsync();
        } else {
          await audioRecording.sound.loadAsync({ uri: audioRecording.uri });
          setIsPlayingAudio(true);
          await audioRecording.sound.playAsync();
        }
      }

      console.log("[Audio] Playback started successfully");
    } catch (error) {
      console.error("[Audio] Error playing recording:", error);
      setIsPlayingAudio(false);
      Alert.alert(
        "Playback Error",
        "Could not play audio recording. The file may be corrupted."
      );
    }
  };

  const stopAudioPlayback = async () => {
    try {
      if (audioRecording.sound && isPlayingAudio) {
        console.log("[Audio] Stopping playback...");
        await audioRecording.sound.stopAsync();
        setIsPlayingAudio(false);
        setPlaybackPosition(0);
        console.log("[Audio] Playback stopped");
      }
    } catch (error) {
      console.error("[Audio] Error stopping playback:", error);
    }
  };

  const getPlaybackProgress = (): number => {
    if (playbackDuration === 0) return 0;
    return (playbackPosition / playbackDuration) * 100;
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const clearMedia = async (type: "photo" | "audio") => {
    try {
      if (type === "photo") {
        setPhoto(null);
      } else {
        console.log("[Audio] Clearing audio media...");

        if (isRecording && currentRecording) {
          await currentRecording.stopAndUnloadAsync();
          setIsRecording(false);
          setCurrentRecording(null);
        }

        if (isPlayingAudio) {
          await stopAudioPlayback();
        }

        if (audioRecording.sound) {
          await audioRecording.sound.unloadAsync();
        }

        setAudioRecording({ uri: null, sound: null });
        setIsPlayingAudio(false);
        setPlaybackDuration(0);
        setPlaybackPosition(0);
        console.log("[Audio] Audio media cleared");
      }
    } catch (error) {
      console.error("[Audio] Error clearing media:", error);
    }
  };

  return {
    location,
    photo,
    audioRecording,
    isRecording,
    isPlayingAudio,
    playbackDuration,
    playbackPosition,
    captureLocation,
    selectOrCapturePhoto,
    startAudioRecording,
    stopAudioRecording,
    playAudioRecording,
    stopAudioPlayback,
    getPlaybackProgress,
    formatTime,
    clearMedia,
    setLocation,
    setPhoto,
    setAudioRecording,
  };
}
