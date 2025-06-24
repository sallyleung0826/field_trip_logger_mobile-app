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

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  trip: Trip;
  rating: number;
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

export interface MarkerClusterConfig {
  clusterDistance: number;
  minClusterSize: number;
  maxClusterSize: number;
  clusterRadius: number;
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

export interface MapFilter {
  ratingRange: [number, number];
  dateRange?: [Date, Date];
  weatherConditions?: string[];
  showClusters: boolean;
  showTopRated: boolean;
}

export interface MapSearchResult {
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  trips: Trip[];
  distance?: number;
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
