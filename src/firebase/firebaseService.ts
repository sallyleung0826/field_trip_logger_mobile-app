import {
  ref,
  push,
  set,
  get,
  onValue,
  off,
  serverTimestamp,
  remove,
  update,
} from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { auth, database } from "./config";
import {
  Trip,
  LocationRating,
  UserStats,
  EnhancedLocationRating,
} from "../lib/types/trip";
import {
  Achievement,
  AchievementCategory,
  AchievementProgress,
  AchievementRarity,
  AchievementType,
} from "../lib/types/achievement";

const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const calculateDelay = (attempt: number): number => {
  const delay = Math.min(
    RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
    RETRY_CONFIG.maxDelay
  );
  return delay + Math.random() * 1000;
};

const withRetry = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = RETRY_CONFIG.maxRetries
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = calculateDelay(attempt - 1);
        await sleep(delay);
      }

      const result = await operation();
      return result;
    } catch (error) {
      lastError = error as Error;

      if (
        error.code === "PERMISSION_DENIED" ||
        error.code === "permission-denied" ||
        error.code === "unauthenticated" ||
        error.code === "invalid-argument"
      ) {
        throw error;
      }

      if (attempt === maxRetries) {
        throw lastError;
      }
    }
  }

  throw lastError!;
};

const cleanObjectForFirebase = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanObjectForFirebase).filter((item) => item !== null);
  }

  if (typeof obj === "object") {
    const cleaned: any = {};

    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) {
        continue;
      }

      if (value === null) {
        cleaned[key] = null;
        continue;
      }

      if (typeof value === "object") {
        const cleanedValue = cleanObjectForFirebase(value);
        if (cleanedValue !== null && Object.keys(cleanedValue).length > 0) {
          cleaned[key] = cleanedValue;
        }
      } else {
        cleaned[key] = value;
      }
    }

    return Object.keys(cleaned).length > 0 ? cleaned : null;
  }

  return obj;
};

const ACHIEVEMENT_DEFINITIONS: Omit<
  Achievement,
  "current" | "unlocked" | "unlockedDate"
>[] = [
  {
    id: "first_steps",
    title: "First Steps",
    description: "Log your very first trip adventure",
    icon: "🚶",
    category: AchievementCategory.EXPLORER,
    type: AchievementType.TOTAL_TRIPS,
    target: 1,
    rarity: AchievementRarity.COMMON,
    points: 50,
  },
  {
    id: "getting_started",
    title: "Getting Started",
    description: "Complete 5 trips to show your commitment",
    icon: "🏃",
    category: AchievementCategory.EXPLORER,
    type: AchievementType.TOTAL_TRIPS,
    target: 5,
    rarity: AchievementRarity.COMMON,
    points: 100,
  },
  {
    id: "seasoned_explorer",
    title: "Seasoned Explorer",
    description: "Reach 25 trips and prove your experience",
    icon: "🧗",
    category: AchievementCategory.EXPLORER,
    type: AchievementType.TOTAL_TRIPS,
    target: 25,
    rarity: AchievementRarity.UNCOMMON,
    points: 300,
  },
  {
    id: "adventure_master",
    title: "Adventure Master",
    description: "Complete 100 incredible trips",
    icon: "🏔️",
    category: AchievementCategory.EXPLORER,
    type: AchievementType.TOTAL_TRIPS,
    target: 100,
    rarity: AchievementRarity.EPIC,
    points: 1000,
  },
  {
    id: "picture_perfect",
    title: "Picture Perfect",
    description: "Take your first trip photo",
    icon: "📷",
    category: AchievementCategory.PHOTOGRAPHER,
    type: AchievementType.PHOTOS_TAKEN,
    target: 1,
    rarity: AchievementRarity.COMMON,
    points: 50,
  },
  {
    id: "photo_enthusiast",
    title: "Photo Enthusiast",
    description: "Capture 50 memorable moments",
    icon: "📸",
    category: AchievementCategory.PHOTOGRAPHER,
    type: AchievementType.PHOTOS_TAKEN,
    target: 50,
    rarity: AchievementRarity.UNCOMMON,
    points: 250,
  },
  {
    id: "master_photographer",
    title: "Master Photographer",
    description: "Take 200 stunning trip photos",
    icon: "🎯",
    category: AchievementCategory.PHOTOGRAPHER,
    type: AchievementType.PHOTOS_TAKEN,
    target: 200,
    rarity: AchievementRarity.RARE,
    points: 600,
  },
  {
    id: "five_star_experience",
    title: "Five Star Experience",
    description: "Give your first perfect 5-star rating",
    icon: "⭐",
    category: AchievementCategory.QUALITY,
    type: AchievementType.PERFECT_RATINGS,
    target: 1,
    rarity: AchievementRarity.COMMON,
    points: 75,
  },
  {
    id: "quality_seeker",
    title: "Quality Seeker",
    description: "Rate 10 trips with 5 stars",
    icon: "🌟",
    category: AchievementCategory.QUALITY,
    type: AchievementType.PERFECT_RATINGS,
    target: 10,
    rarity: AchievementRarity.UNCOMMON,
    points: 300,
  },
  {
    id: "perfection_hunter",
    title: "Perfection Hunter",
    description: "Achieve 25 perfect 5-star ratings",
    icon: "✨",
    category: AchievementCategory.QUALITY,
    type: AchievementType.PERFECT_RATINGS,
    target: 25,
    rarity: AchievementRarity.RARE,
    points: 750,
  },
  {
    id: "explorer_badge",
    title: "Explorer Badge",
    description: "Visit 10 different unique locations",
    icon: "🗺️",
    category: AchievementCategory.DISTANCE,
    type: AchievementType.DIFFERENT_LOCATIONS,
    target: 10,
    rarity: AchievementRarity.UNCOMMON,
    points: 200,
  },
  {
    id: "globe_trotter",
    title: "Globe Trotter",
    description: "Explore 50 unique destinations",
    icon: "🌍",
    category: AchievementCategory.DISTANCE,
    type: AchievementType.DIFFERENT_LOCATIONS,
    target: 50,
    rarity: AchievementRarity.RARE,
    points: 800,
  },
  {
    id: "weather_warrior",
    title: "Weather Warrior",
    description: "Experience 5 different weather conditions",
    icon: "🌦️",
    category: AchievementCategory.WEATHER,
    type: AchievementType.WEATHER_CONDITIONS,
    target: 5,
    rarity: AchievementRarity.UNCOMMON,
    points: 250,
  },
  {
    id: "all_weather_explorer",
    title: "All-Weather Explorer",
    description: "Adventure through 10+ weather types",
    icon: "🌈",
    category: AchievementCategory.WEATHER,
    type: AchievementType.WEATHER_CONDITIONS,
    target: 10,
    rarity: AchievementRarity.RARE,
    points: 500,
  },
  {
    id: "voice_recorder",
    title: "Voice Recorder",
    description: "Record your first audio memory",
    icon: "🎤",
    category: AchievementCategory.SPECIAL,
    type: AchievementType.AUDIO_RECORDED,
    target: 1,
    rarity: AchievementRarity.COMMON,
    points: 50,
  },
  {
    id: "storyteller",
    title: "Storyteller",
    description: "Record 25 audio memories",
    icon: "📻",
    category: AchievementCategory.SPECIAL,
    type: AchievementType.AUDIO_RECORDED,
    target: 25,
    rarity: AchievementRarity.UNCOMMON,
    points: 400,
  },
];

export const uploadTripData = async (
  tripData: Omit<Trip, "id" | "timestamp" | "userId">
): Promise<Trip> => {
  if (!auth.currentUser) {
    throw new Error("User must be logged in to upload trip data");
  }

  const storage = getStorage();
  const userId = auth.currentUser.uid;

  try {
    if (!tripData.location) {
      throw new Error("Location is required");
    }

    if (!tripData.rating || tripData.rating === 0) {
      throw new Error("Rating is required");
    }

    let photoDownloadUrl: string | undefined;
    if (tripData.photoUrl) {
      photoDownloadUrl = await withRetry(async () => {
        const photoRef = storageRef(
          storage,
          `trips/${userId}/photos/${Date.now()}.jpg`
        );

        const photoResponse = await fetch(tripData.photoUrl!);
        if (!photoResponse.ok) {
          throw new Error(`Failed to fetch photo: ${photoResponse.status}`);
        }

        const photoBlob = await photoResponse.blob();
        const photoSnapshot = await uploadBytes(photoRef, photoBlob);
        const downloadUrl = await getDownloadURL(photoSnapshot.ref);
        return downloadUrl;
      }, "Photo Upload");
    }

    let audioDownloadUrl: string | undefined;
    if (tripData.audioUrl) {
      audioDownloadUrl = await withRetry(async () => {
        const audioRef = storageRef(
          storage,
          `trips/${userId}/audio/${Date.now()}.m4a`
        );

        const audioResponse = await fetch(tripData.audioUrl!);
        if (!audioResponse.ok) {
          throw new Error(`Failed to fetch audio: ${audioResponse.status}`);
        }

        const audioBlob = await audioResponse.blob();
        const audioSnapshot = await uploadBytes(audioRef, audioBlob);
        const downloadUrl = await getDownloadURL(audioSnapshot.ref);
        return downloadUrl;
      }, "Audio Upload");
    }

    let weatherObject = null;
    if (tripData.weather) {
      const rawWeatherObject = {
        condition: tripData.weather.condition,
        description: tripData.weather.description,
        temperature: tripData.weather.temperature,
        humidity: tripData.weather.humidity,
        windSpeed: tripData.weather.windSpeed,
      };

      weatherObject = cleanObjectForFirebase(rawWeatherObject);
    }

    const tripDoc = {
      userId: userId,
      location: {
        latitude: tripData.location.latitude,
        longitude: tripData.location.longitude,
        address: tripData.location.address || "",
      },
      photoUrl: photoDownloadUrl || null,
      audioUrl: audioDownloadUrl || null,
      description: tripData.description || "",
      rating: tripData.rating,
      tripDate: tripData.tripDate || new Date().toISOString().split("T")[0],
      weather: weatherObject,
      timestamp: serverTimestamp(),
    };

    const cleanedTripDoc = cleanObjectForFirebase(tripDoc);

    const savedTripRef = await withRetry(
      async () => {
        const tripsRef = ref(database, `trips/${userId}`);
        const newTripRef = push(tripsRef);
        await set(newTripRef, cleanedTripDoc);
        return newTripRef;
      },
      "Realtime Database Document Save",
      6
    );

    if (tripData.rating && tripData.rating > 0) {
      try {
        await withRetry(
          async () => {
            await updateLocationRating(
              tripData.location.latitude,
              tripData.location.longitude,
              tripData.rating!,
              tripData.location.address || "Unknown Location"
            );
          },
          "Location Rating Update",
          2
        );
      } catch (ratingError) {
        console.error("Failed to update location rating:", ratingError);
      }
    }

    const savedTrip: Trip = {
      id: savedTripRef.key!,
      ...cleanedTripDoc,
    };

    return savedTrip;
  } catch (error) {
    console.error("Error uploading trip data:", error);

    if (error.code === "storage/unauthorized") {
      throw new Error(
        "Storage permission denied. Please check Firebase Storage rules."
      );
    } else if (error.code === "PERMISSION_DENIED") {
      throw new Error(
        "Database permission denied. Please check Realtime Database rules."
      );
    } else if (error.code === "auth/requires-recent-login") {
      throw new Error("Please log in again to continue.");
    } else if (error.code === "NETWORK_ERROR") {
      throw new Error(
        "Network error. Please check your internet connection and try again."
      );
    } else {
      throw error;
    }
  }
};

export const fetchUserTrips = async (): Promise<Trip[]> => {
  if (!auth.currentUser) {
    return [];
  }

  try {
    const trips = await withRetry(async () => {
      const userId = auth.currentUser!.uid;
      const tripsRef = ref(database, `trips/${userId}`);

      const snapshot = await get(tripsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const tripsData = snapshot.val();
      const tripsArray = Object.entries(tripsData || {}).map(
        ([id, data]: [string, any]) => {
          return {
            id,
            ...data,
          } as Trip;
        }
      );

      return tripsArray.sort((a, b) => {
        const aTime = a.timestamp || 0;
        const bTime = b.timestamp || 0;
        return bTime - aTime;
      });
    }, "Fetch Trips");

    if (trips.length === 0) {
      return [];
    }

    return trips;
  } catch (error) {
    console.error("Error fetching trips:", error);

    if (error.code === "PERMISSION_DENIED") {
      return [];
    }

    return [];
  }
};

export const getUserTrips = fetchUserTrips;

export const fetchTripsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<Trip[]> => {
  if (!auth.currentUser) {
    return [];
  }

  try {
    const trips = await fetchUserTrips();

    return trips.filter((trip) => {
      const tripDate =
        trip.tripDate || new Date(trip.timestamp).toISOString().split("T")[0];
      return tripDate && tripDate >= startDate && tripDate <= endDate;
    });
  } catch (error) {
    console.error("Error fetching trips by date range:", error);
    return [];
  }
};

export const getTripsGroupedByDate = async (): Promise<{
  [date: string]: Trip[];
}> => {
  try {
    const trips = await fetchUserTrips();
    const groupedTrips: { [date: string]: Trip[] } = {};

    trips.forEach((trip) => {
      let tripDate: string;

      if (trip.tripDate) {
        tripDate = trip.tripDate;
      } else if (trip.timestamp) {
        tripDate = new Date(trip.timestamp).toISOString().split("T")[0];
      } else {
        tripDate = new Date().toISOString().split("T")[0];
      }

      if (!groupedTrips[tripDate]) {
        groupedTrips[tripDate] = [];
      }
      groupedTrips[tripDate].push(trip);
    });

    return groupedTrips;
  } catch (error) {
    console.error("Error grouping trips by date:", error);
    return {};
  }
};

export const updateTripRating = async (tripId: string, rating: number) => {
  if (!auth.currentUser) {
    throw new Error("User must be logged in to rate a trip");
  }

  try {
    return await withRetry(async () => {
      const userId = auth.currentUser!.uid;
      const tripRef = ref(database, `trips/${userId}/${tripId}`);
      const snapshot = await get(tripRef);

      if (!snapshot.exists()) {
        throw new Error("Trip not found");
      }

      const tripData = snapshot.val();

      await update(tripRef, {
        rating: rating,
      });

      await updateLocationRating(
        tripData.location.latitude,
        tripData.location.longitude,
        rating,
        tripData.location.address || "Unknown Location"
      );

      return true;
    }, "Update Trip Rating");
  } catch (error) {
    console.error("Error updating trip rating:", error);
    throw error;
  }
};

export const updateLocationRating = async (
  latitude: number,
  longitude: number,
  rating: number,
  address: string
) => {
  const locationId = `${latitude.toFixed(4)}_${longitude.toFixed(4)}`.replace(
    /\./g,
    "_"
  );
  const locationRef = ref(database, `locationRatings/${locationId}`);

  try {
    const snapshot = await get(locationRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const currentRatings = data.ratings || [];
      const newRatings = [...currentRatings, rating];
      const newAverage =
        newRatings.reduce((a, b) => a + b, 0) / newRatings.length;

      await update(locationRef, {
        ratings: newRatings,
        averageRating: newAverage,
        totalRatings: newRatings.length,
        lastUpdated: serverTimestamp(),
      });
    } else {
      await set(locationRef, {
        id: locationId,
        latitude,
        longitude,
        address,
        ratings: [rating],
        averageRating: rating,
        totalRatings: 1,
        lastUpdated: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error updating location rating:", error);
    throw error;
  }
};

export const fetchTopRatedLocations = async (): Promise<LocationRating[]> => {
  try {
    const ratingsRef = ref(database, "locationRatings");
    const snapshot = await get(ratingsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const ratingsData = snapshot.val();
    const ratingsArray = Object.entries(ratingsData || {}).map(
      ([id, data]: [string, any]) =>
        ({
          id,
          ...data,
        } as LocationRating)
    );

    return ratingsArray
      .filter((location) => location.totalRatings >= 1)
      .sort((a, b) => {
        if (b.averageRating === a.averageRating) {
          return b.totalRatings - a.totalRatings;
        }
        return b.averageRating - a.averageRating;
      });
  } catch (error) {
    console.error("Error fetching top rated locations:", error);
    return [];
  }
};

export const getTopRatedLocations = async (
  limit: number = 10
): Promise<LocationRating[]> => {
  const locations = await fetchTopRatedLocations();
  return locations.slice(0, limit);
};

export const deleteTrip = async (tripId: string) => {
  if (!auth.currentUser) {
    throw new Error("User must be logged in to delete a trip");
  }

  const storage = getStorage();
  const userId = auth.currentUser.uid;

  try {
    return await withRetry(async () => {
      const tripRef = ref(database, `trips/${userId}/${tripId}`);
      const snapshot = await get(tripRef);

      if (!snapshot.exists()) {
        throw new Error("Trip not found");
      }

      const tripData = snapshot.val();

      if (tripData?.photoUrl) {
        try {
          const photoRef = storageRef(storage, tripData.photoUrl);
          await deleteObject(photoRef);
        } catch (deleteError) {
          console.error("Failed to delete photo from storage:", deleteError);
        }
      }

      if (tripData?.audioUrl) {
        try {
          const audioRef = storageRef(storage, tripData.audioUrl);
          await deleteObject(audioRef);
        } catch (deleteError) {
          console.error("Failed to delete audio from storage:", deleteError);
        }
      }

      await remove(tripRef);

      return true;
    }, "Delete Trip");
  } catch (error) {
    console.error("Error deleting trip:", error);
    throw error;
  }
};

export const subscribeToUserTrips = (callback: (trips: Trip[]) => void) => {
  if (!auth.currentUser) {
    callback([]);
    return () => {};
  }

  const userId = auth.currentUser.uid;
  const tripsRef = ref(database, `trips/${userId}`);

  const unsubscribe = onValue(
    tripsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const tripsData = snapshot.val();
        const tripsArray = Object.entries(tripsData || {}).map(
          ([id, data]: [string, any]) =>
            ({
              id,
              ...data,
            } as Trip)
        );

        const sortedTrips = tripsArray.sort((a, b) => {
          const aTime = a.timestamp || 0;
          const bTime = b.timestamp || 0;
          return bTime - aTime;
        });

        callback(sortedTrips);
      } else {
        callback([]);
      }
    },
    (error) => {
      console.error("Error in trip subscription:", error);
      callback([]);
    }
  );

  return () => off(tripsRef, "value", unsubscribe);
};

export const calculateUserStats = async (
  userId?: string
): Promise<UserStats> => {
  if (!userId && !auth.currentUser) {
    return getDefaultStats();
  }

  try {
    const actualUserId = userId || auth.currentUser!.uid;
    const tripsRef = ref(database, `trips/${actualUserId}`);
    const snapshot = await get(tripsRef);

    if (!snapshot.exists()) {
      return getDefaultStats();
    }

    const tripsData = snapshot.val();
    const trips = Object.values(tripsData || {}) as Trip[];

    if (trips.length === 0) {
      return getDefaultStats();
    }

    const totalTrips = trips.length;
    const ratingsGiven = trips
      .filter((trip) => trip.rating)
      .map((trip) => trip.rating!);
    const averageRating =
      ratingsGiven.length > 0
        ? ratingsGiven.reduce((sum, rating) => sum + rating, 0) /
          ratingsGiven.length
        : 0;

    const photosTaken = trips.filter((trip) => trip.photoUrl).length;
    const audioRecorded = trips.filter((trip) => trip.audioUrl).length;
    const perfectRatings = trips.filter((trip) => trip.rating === 5).length;

    const companionTrips = trips.filter(
      (trip) =>
        trip.companions &&
        Array.isArray(trip.companions) &&
        trip.companions.length > 0
    ).length;

    const uniqueLocations = calculateUniqueLocations(trips);

    const durationsHours = trips
      .filter((trip) => trip.duration && typeof trip.duration === "number")
      .map((trip) => trip.duration!);
    const totalDuration = durationsHours.reduce(
      (sum, duration) => sum + duration,
      0
    );
    const longestTrip =
      durationsHours.length > 0 ? Math.max(...durationsHours) : 0;

    const { current: streakCurrent, longest: streakLongest } =
      calculateTripStreaks(trips);

    const weatherConditions = [
      ...new Set(
        trips
          .filter((trip) => trip.weather?.condition)
          .map((trip) => trip.weather!.condition)
      ),
    ];

    const seasons = calculateSeasonsCovered(trips);

    const achievements = await calculateAchievements(trips);
    const achievementPoints = achievements
      .filter((a) => a.unlocked)
      .reduce((sum, a) => sum + a.points, 0);
    const unlockedAchievements = achievements.filter((a) => a.unlocked).length;

    const sortedDates = trips
      .map((trip) => new Date(trip.timestamp || Date.now()))
      .sort((a, b) => a.getTime() - b.getTime());

    const firstTripDate =
      sortedDates.length > 0 ? sortedDates[0].toISOString() : undefined;
    const lastTripDate =
      sortedDates.length > 0
        ? sortedDates[sortedDates.length - 1].toISOString()
        : undefined;

    const weatherCounts = trips.reduce((acc, trip) => {
      if (trip.weather?.condition) {
        acc[trip.weather.condition] = (acc[trip.weather.condition] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const favoriteWeather = Object.entries(weatherCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];

    return {
      totalTrips,
      averageRating: Number(averageRating.toFixed(1)),
      totalRatings: ratingsGiven.length,
      photosTaken,
      audioRecorded,
      uniqueLocations,
      longestTrip,
      totalDuration,
      streakCurrent,
      streakLongest,
      lastTripDate,
      firstTripDate,
      favoriteWeather,
      perfectRatings,
      companionTrips,
      weatherConditionsCovered: weatherConditions,
      seasonsCovered: seasons,
      achievementPoints,
      unlockedAchievements,
    };
  } catch (error) {
    console.error("Error calculating user stats:", error);
    return getDefaultStats();
  }
};

const getDefaultStats = (): UserStats => ({
  totalTrips: 0,
  averageRating: 0,
  totalRatings: 0,
  photosTaken: 0,
  audioRecorded: 0,
  uniqueLocations: 0,
  longestTrip: 0,
  totalDuration: 0,
  streakCurrent: 0,
  streakLongest: 0,
  perfectRatings: 0,
  companionTrips: 0,
  weatherConditionsCovered: [],
  seasonsCovered: [],
  achievementPoints: 0,
  unlockedAchievements: 0,
});

const calculateUniqueLocations = (trips: Trip[]): number => {
  const locations = new Set<string>();

  trips.forEach((trip) => {
    if (trip.location?.latitude && trip.location?.longitude) {
      const lat = trip.location.latitude.toFixed(3);
      const lng = trip.location.longitude.toFixed(3);
      locations.add(`${lat},${lng}`);
    }
  });

  return locations.size;
};

const calculateTripStreaks = (
  trips: Trip[]
): { current: number; longest: number } => {
  if (trips.length === 0) return { current: 0, longest: 0 };

  const sortedTrips = trips
    .filter((trip) => trip.tripDate || trip.timestamp)
    .sort((a, b) => {
      const dateA = new Date(a.tripDate || a.timestamp);
      const dateB = new Date(b.tripDate || b.timestamp);
      return dateA.getTime() - dateB.getTime();
    });

  if (sortedTrips.length === 0) return { current: 0, longest: 0 };

  const uniqueDates = [
    ...new Set(
      sortedTrips.map((trip) => {
        const date = new Date(trip.tripDate || trip.timestamp);
        return date.toDateString();
      })
    ),
  ].sort();

  let currentStreak = 1;
  let longestStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i - 1]);
    const currentDate = new Date(uniqueDates[i]);
    const dayDiff = Math.floor(
      (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayDiff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak);

  const today = new Date();
  const lastTripDate = new Date(uniqueDates[uniqueDates.length - 1]);
  const daysSinceLastTrip = Math.floor(
    (today.getTime() - lastTripDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastTrip <= 1) {
    currentStreak = 1;
    for (let i = uniqueDates.length - 2; i >= 0; i--) {
      const prevDate = new Date(uniqueDates[i]);
      const nextDate = new Date(uniqueDates[i + 1]);
      const dayDiff = Math.floor(
        (nextDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else {
    currentStreak = 0;
  }

  return { current: currentStreak, longest: longestStreak };
};

const calculateSeasonsCovered = (trips: Trip[]): string[] => {
  const seasons = new Set<string>();

  trips.forEach((trip) => {
    const date = new Date(trip.tripDate || trip.timestamp);
    const month = date.getMonth() + 1;

    if (month >= 3 && month <= 5) seasons.add("Spring");
    else if (month >= 6 && month <= 8) seasons.add("Summer");
    else if (month >= 9 && month <= 11) seasons.add("Autumn");
    else seasons.add("Winter");
  });

  return Array.from(seasons);
};

export const calculateAchievements = async (
  trips: Trip[]
): Promise<Achievement[]> => {
  const achievements: Achievement[] = [];

  for (const definition of ACHIEVEMENT_DEFINITIONS) {
    let current = 0;

    switch (definition.type) {
      case AchievementType.TOTAL_TRIPS:
        current = trips.length;
        break;

      case AchievementType.AUDIO_RECORDED:
        current = trips.filter((trip) => trip.audioUrl).length;
        break;

      case AchievementType.PERFECT_RATINGS:
        current = trips.filter((trip) => trip.rating === 5).length;
        break;

      case AchievementType.COMPANION_TRIPS:
        current = trips.filter(
          (trip) =>
            trip.companions &&
            Array.isArray(trip.companions) &&
            trip.companions.length > 0
        ).length;
        break;

      case AchievementType.DIFFERENT_LOCATIONS:
        current = calculateUniqueLocations(trips);
        break;

      case AchievementType.WEATHER_CONDITIONS:
        current = [
          ...new Set(
            trips
              .filter((trip) => trip.weather?.condition)
              .map((trip) => trip.weather!.condition)
          ),
        ].length;
        break;

      case AchievementType.TRIP_STREAK:
        const streaks = calculateTripStreaks(trips);
        current = definition.target <= 7 ? streaks.current : streaks.longest;
        break;

      case AchievementType.LONG_TRIPS:
        current = trips.filter(
          (trip) =>
            trip.duration &&
            typeof trip.duration === "number" &&
            trip.duration >= 8
        ).length;
        break;

      default:
        current = 0;
    }

    const unlocked = current >= definition.target;
    const unlockedDate = unlocked ? new Date().toISOString() : undefined;

    achievements.push({
      ...definition,
      current: Math.min(current, definition.target),
      unlocked,
      unlockedDate,
    });
  }

  return achievements;
};

export const getAchievementProgress = async (
  userId?: string
): Promise<AchievementProgress[]> => {
  try {
    const actualUserId = userId || auth.currentUser?.uid;
    if (!actualUserId) {
      return [];
    }

    const tripsRef = ref(database, `trips/${actualUserId}`);
    const snapshot = await get(tripsRef);

    const trips = snapshot.exists()
      ? (Object.values(snapshot.val() || {}) as Trip[])
      : [];

    const achievements = await calculateAchievements(trips);

    const categories = Object.values(AchievementCategory);
    const progress: AchievementProgress[] = [];

    for (const category of categories) {
      const categoryAchievements = achievements.filter(
        (a) => a.category === category
      );
      const unlockedCount = categoryAchievements.filter(
        (a) => a.unlocked
      ).length;
      const categoryProgress =
        categoryAchievements.length > 0
          ? (unlockedCount / categoryAchievements.length) * 100
          : 0;

      const nextAchievement = categoryAchievements
        .filter((a) => !a.unlocked)
        .sort((a, b) => b.current / b.target - a.current / a.target)[0];

      progress.push({
        category,
        achievements: categoryAchievements,
        categoryProgress,
        nextAchievement,
      });
    }

    return progress;
  } catch (error) {
    console.error("Error calculating achievement progress:", error);
    return [];
  }
};

export const getTripsAtLocation = async (
  latitude: number,
  longitude: number,
  radiusInDegrees: number = 0.01
): Promise<Trip[]> => {
  if (!auth.currentUser) {
    return [];
  }

  try {
    const allTrips = await getUserTrips();

    const tripsAtLocation = allTrips.filter((trip) => {
      const distance = Math.sqrt(
        Math.pow(trip.location.latitude - latitude, 2) +
          Math.pow(trip.location.longitude - longitude, 2)
      );
      return distance <= radiusInDegrees;
    });

    return tripsAtLocation;
  } catch (error) {
    console.error("Error fetching trips at location:", error);
    return [];
  }
};

export const getEnhancedTopRatedLocations = async (
  limit: number = 10
): Promise<EnhancedLocationRating[]> => {
  try {
    return await withRetry(async () => {
      const locationsRef = ref(database, "locationRatings");
      const snapshot = await get(locationsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const locationsData = snapshot.val();
      const locations: EnhancedLocationRating[] = [];

      for (const [id, data] of Object.entries(locationsData) as [
        string,
        any
      ][]) {
        if (data.averageRating && data.totalRatings >= 1) {
          const tripsAtLocation = await getTripsAtLocation(
            data.latitude,
            data.longitude,
            0.001
          );

          const enhancedLocation: EnhancedLocationRating = {
            ...data,
            tripCount: tripsAtLocation.length,
            mostRecentTrip:
              tripsAtLocation.length > 0
                ? tripsAtLocation.sort(
                    (a, b) =>
                      new Date(b.timestamp || 0).getTime() -
                      new Date(a.timestamp || 0).getTime()
                  )[0].timestamp || new Date().toISOString()
                : new Date().toISOString(),
            photos: tripsAtLocation
              .filter((trip) => trip.photoUrl)
              .map((trip) => trip.photoUrl!)
              .slice(0, 3),
            tags: [
              ...new Set(tripsAtLocation.flatMap((trip) => trip.tags || [])),
            ],
            weatherData:
              tripsAtLocation.length > 0 && tripsAtLocation[0].weather
                ? {
                    condition: tripsAtLocation[0].weather.condition,
                    temperature: tripsAtLocation[0].weather.temperature,
                  }
                : undefined,
          };

          locations.push(enhancedLocation);
        }
      }

      const sortedLocations = locations
        .sort((a, b) => {
          if (b.averageRating !== a.averageRating) {
            return b.averageRating - a.averageRating;
          }
          return b.totalRatings - a.totalRatings;
        })
        .slice(0, limit);

      return sortedLocations;
    }, "Get Enhanced Top Rated Locations");
  } catch (error) {
    console.error("Error fetching enhanced top rated locations:", error);
    throw error;
  }
};

export const getTripsInRegion = async (
  northEast: { latitude: number; longitude: number },
  southWest: { latitude: number; longitude: number }
): Promise<Trip[]> => {
  if (!auth.currentUser) {
    throw new Error("User must be logged in to fetch trips");
  }

  try {
    const allTrips = await getUserTrips();

    const tripsInRegion = allTrips.filter((trip) => {
      const { latitude, longitude } = trip.location;
      return (
        latitude <= northEast.latitude &&
        latitude >= southWest.latitude &&
        longitude <= northEast.longitude &&
        longitude >= southWest.longitude
      );
    });

    return tripsInRegion;
  } catch (error) {
    console.error("Error fetching trips in region:", error);
    throw error;
  }
};

export const searchTrips = async (query: string): Promise<Trip[]> => {
  if (!auth.currentUser) {
    throw new Error("User must be logged in to search trips");
  }

  try {
    const allTrips = await getUserTrips();
    const lowercaseQuery = query.toLowerCase();

    const filteredTrips = allTrips.filter((trip) => {
      const addressMatch = trip.location.address
        ?.toLowerCase()
        .includes(lowercaseQuery);
      const descriptionMatch = trip.description
        ?.toLowerCase()
        .includes(lowercaseQuery);
      const tagsMatch = trip.tags?.some((tag) =>
        tag.toLowerCase().includes(lowercaseQuery)
      );

      return addressMatch || descriptionMatch || tagsMatch;
    });

    return filteredTrips;
  } catch (error) {
    console.error("Error searching trips:", error);
    throw error;
  }
};

export const getMapStatistics = async (): Promise<{
  totalTrips: number;
  uniqueLocations: number;
  averageRating: number;
  mostVisitedLocation?: {
    latitude: number;
    longitude: number;
    address: string;
    visitCount: number;
  };
  ratingDistribution: { [rating: number]: number };
}> => {
  if (!auth.currentUser) {
    throw new Error("User must be logged in to get statistics");
  }

  try {
    const trips = await getUserTrips();

    if (trips.length === 0) {
      return {
        totalTrips: 0,
        uniqueLocations: 0,
        averageRating: 0,
        ratingDistribution: {},
      };
    }

    const locationMap = new Map<
      string,
      { location: Trip["location"]; count: number }
    >();

    trips.forEach((trip) => {
      const key = `${trip.location.latitude.toFixed(
        3
      )},${trip.location.longitude.toFixed(3)}`;
      const existing = locationMap.get(key);

      if (existing) {
        existing.count += 1;
      } else {
        locationMap.set(key, { location: trip.location, count: 1 });
      }
    });

    let mostVisitedLocation;
    let maxVisits = 0;

    for (const [key, data] of locationMap) {
      if (data.count > maxVisits) {
        maxVisits = data.count;
        mostVisitedLocation = {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          address: data.location.address || "Unknown Location",
          visitCount: data.count,
        };
      }
    }

    const ratingDistribution: { [rating: number]: number } = {};
    trips.forEach((trip) => {
      if (trip.rating) {
        ratingDistribution[trip.rating] =
          (ratingDistribution[trip.rating] || 0) + 1;
      }
    });

    const ratingsArray = trips
      .filter((trip) => trip.rating)
      .map((trip) => trip.rating!);
    const averageRating =
      ratingsArray.length > 0
        ? ratingsArray.reduce((sum, rating) => sum + rating, 0) /
          ratingsArray.length
        : 0;

    return {
      totalTrips: trips.length,
      uniqueLocations: locationMap.size,
      averageRating: Math.round(averageRating * 10) / 10,
      mostVisitedLocation,
      ratingDistribution,
    };
  } catch (error) {
    console.error("Error calculating map statistics:", error);
    throw error;
  }
};
