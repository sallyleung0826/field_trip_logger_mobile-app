export interface Trip {
  id?: string;
  userId: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  photoUrl?: string;
  audioUrl?: string;
  description?: string;
  rating?: number;
  timestamp?: any;
  tripDate?: string;
  weather?: {
    condition: string;
    description: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
  tags?: string[];
  duration?: number;
  companions?: string[];
  mood?: string;
  highlights?: string[];
  title?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

export interface LocationRating {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  ratings: number[];
  averageRating: number;
  totalRatings: number;
  lastUpdated: any;
}

export interface ClusteredMarker {
  id: string;
  latitude: number;
  longitude: number;
  trips: Trip[];
  averageRating: number;
  isCluster: boolean;
  clusterSize?: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface UserStats {
  totalTrips: number;
  averageRating: number;
  totalRatings: number;
  photosTaken: number;
  audioRecorded: number;
  uniqueLocations: number;
  longestTrip: number;
  totalDuration: number;
  streakCurrent: number;
  streakLongest: number;
  lastTripDate?: string;
  firstTripDate?: string;
  favoriteWeather?: string;
  perfectRatings: number;
  companionTrips: number;
  weatherConditionsCovered: string[];
  seasonsCovered: string[];
  achievementPoints: number;
  unlockedAchievements: number;
}

export interface EnhancedLocationRating extends LocationRating {
  tripCount: number;
  mostRecentTrip: string;
  weatherData?: {
    condition: string;
    temperature: number;
  };
  photos: string[];
  tags: string[];
}

export const HONG_KONG_LOCATION = {
  latitude: 22.3193,
  longitude: 114.1694,
  address: "Hong Kong",
};
