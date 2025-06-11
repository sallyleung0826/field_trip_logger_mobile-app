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
