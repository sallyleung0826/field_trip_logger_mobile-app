import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveTripData = async (checkpoints: any[]) => {
  try {
    await AsyncStorage.setItem("trip_data", JSON.stringify(checkpoints));
  } catch (e) {
    console.error("Error saving trip data", e);
  }
};

export const loadTripData = async (): Promise<any[]> => {
  try {
    const json = await AsyncStorage.getItem("trip_data");
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error("Error loading trip data", e);
    return [];
  }
};
