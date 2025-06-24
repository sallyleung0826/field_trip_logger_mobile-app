export interface WeatherData {
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

export interface EnhancedBusinessData {
  yelpId: string;
  rating: number;
  reviewCount: number;
  priceLevel: string;
  categories: string[];
  phone?: string;
  hours?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  photos?: string[];
  categoryType?: string;
  area?: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  imageUrl?: string;
  businessType?:
    | "restaurant"
    | "attraction"
    | "activity"
    | "shopping"
    | "nightlife"
    | "wellness"
    | "dining"
    | "attractions"
    | "activities"
    | "transport"
    | "services"
    | "news";
  rating?: number;
  priceLevel?: string;
  address?: string;
  phone?: string;
  hours?: string;
  categories?: string[];
  businessData?: EnhancedBusinessData;
}

export interface GeocodeResult {
  address: string;
  city: string;
  country: string;
  formattedAddress: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface YelpBusiness {
  id: string;
  alias: string;
  name: string;
  image_url?: string;
  is_closed: boolean;
  url: string;
  review_count: number;
  categories: YelpCategory[];
  rating: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  transactions: string[];
  price?: string;
  location: {
    address1?: string;
    address2?: string;
    address3?: string;
    city: string;
    zip_code?: string;
    country: string;
    state?: string;
    display_address: string[];
  };
  phone?: string;
  display_phone?: string;
  distance?: number;
  attributes?: {
    business_temp_closed?: boolean;
    menu_url?: string;
    open24_hours?: boolean;
    waitlist_reservation?: boolean;
  };
}

export interface YelpCategory {
  alias: string;
  title: string;
}

export interface YelpEvent {
  id: string;
  name: string;
  description?: string;
  event_site_url?: string;
  image_url?: string;
  interested_count?: number;
  attending_count?: number;
  category: string;
  cost?: number;
  cost_max?: number;
  is_free?: boolean;
  time_start?: string;
  time_end?: string;
  is_canceled?: boolean;
  location: {
    latitude: number;
    longitude: number;
    address1?: string;
    address2?: string;
    address3?: string;
    city: string;
    zip_code?: string;
    country: string;
    state?: string;
    display_address: string[];
  };
  business_id?: string;
  tickets_url?: string;
}

export interface AccuWeatherCurrentConditions {
  LocalObservationDateTime: string;
  EpochTime: number;
  WeatherText: string;
  WeatherIcon: number;
  HasPrecipitation: boolean;
  PrecipitationType?: string;
  IsDayTime: boolean;
  Temperature: {
    Metric: {
      Value: number;
      Unit: string;
    };
    Imperial: {
      Value: number;
      Unit: string;
    };
  };
  RealFeelTemperature: {
    Metric: {
      Value: number;
      Unit: string;
    };
    Imperial: {
      Value: number;
      Unit: string;
    };
  };
  RelativeHumidity: number;
  Wind: {
    Direction: {
      Degrees: number;
      Localized: string;
    };
    Speed: {
      Metric: {
        Value: number;
        Unit: string;
      };
      Imperial: {
        Value: number;
        Unit: string;
      };
    };
  };
  UVIndex: number;
  UVIndexText: string;
  Visibility: {
    Metric: {
      Value: number;
      Unit: string;
    };
    Imperial: {
      Value: number;
      Unit: string;
    };
  };
  CloudCover: number;
  Pressure: {
    Metric: {
      Value: number;
      Unit: string;
    };
    Imperial: {
      Value: number;
      Unit: string;
    };
  };
}

export const AccuWeatherIconMap: { [key: number]: string } = {
  1: "01d", // Sunny
  2: "02d", // Mostly Sunny
  3: "02d", // Partly Sunny
  4: "03d", // Intermittent Clouds
  5: "03d", // Hazy Sunshine
  6: "04d", // Mostly Cloudy
  7: "04d", // Cloudy
  8: "04d", // Dreary (Overcast)
  11: "50d", // Fog
  12: "09d", // Showers
  13: "10d", // Mostly Cloudy w/ Showers
  14: "10d", // Partly Sunny w/ Showers
  15: "11d", // T-Storms
  16: "11d", // Mostly Cloudy w/ T-Storms
  17: "11d", // Partly Sunny w/ T-Storms
  18: "09d", // Rain
  19: "13d", // Flurries
  20: "13d", // Mostly Cloudy w/ Flurries
  21: "13d", // Partly Sunny w/ Flurries
  22: "13d", // Snow
  23: "13d", // Mostly Cloudy w/ Snow
  24: "50d", // Ice
  25: "13d", // Sleet
  26: "09d", // Freezing Rain
  29: "09d", // Rain and Snow
  30: "01d", // Hot
  31: "01d", // Cold
  32: "01d", // Windy
  33: "01n", // Clear (Night)
  34: "02n", // Mostly Clear (Night)
  35: "02n", // Partly Cloudy (Night)
  36: "03n", // Intermittent Clouds (Night)
  37: "03n", // Hazy Moonlight (Night)
  38: "04n", // Mostly Cloudy (Night)
  39: "10n", // Partly Cloudy w/ Showers (Night)
  40: "10n", // Mostly Cloudy w/ Showers (Night)
  41: "11n", // Partly Cloudy w/ T-Storms (Night)
  42: "11n", // Mostly Cloudy w/ T-Storms (Night)
  43: "13n", // Mostly Cloudy w/ Flurries (Night)
  44: "13n", // Mostly Cloudy w/ Snow (Night)
};

export const AccuWeatherConditionMap: { [key: string]: string } = {
  sunny: "Clear",
  "mostly sunny": "Clear",
  "partly sunny": "Clouds",
  "intermittent clouds": "Clouds",
  "hazy sunshine": "Clouds",
  "mostly cloudy": "Clouds",
  cloudy: "Clouds",
  dreary: "Clouds",
  overcast: "Clouds",
  fog: "Mist",
  showers: "Rain",
  "mostly cloudy w/ showers": "Rain",
  "partly sunny w/ showers": "Rain",
  "t-storms": "Thunderstorm",
  "mostly cloudy w/ t-storms": "Thunderstorm",
  "partly sunny w/ t-storms": "Thunderstorm",
  rain: "Rain",
  flurries: "Snow",
  "mostly cloudy w/ flurries": "Snow",
  "partly sunny w/ flurries": "Snow",
  snow: "Snow",
  "mostly cloudy w/ snow": "Snow",
  ice: "Snow",
  sleet: "Snow",
  "freezing rain": "Rain",
  "rain and snow": "Rain",
  hot: "Clear",
  cold: "Clear",
  windy: "Clear",
  clear: "Clear",
  "mostly clear": "Clear",
  "partly cloudy": "Clouds",
  "hazy moonlight": "Clouds",
  "partly cloudy w/ showers": "Rain",
  "partly cloudy w/ t-storms": "Thunderstorm",
};

export interface LocationLookupError {
  code: string;
  message: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export const getAccuWeatherIcon = (
  iconNumber: number,
  isDayTime: boolean = true
): string => {
  if (AccuWeatherIconMap[iconNumber]) {
    return AccuWeatherIconMap[iconNumber];
  }

  const baseIcon = iconNumber <= 32 ? iconNumber : iconNumber - 32;

  if (baseIcon >= 1 && baseIcon <= 3) {
    return isDayTime ? "01d" : "01n"; // Clear/Sunny
  } else if (baseIcon >= 4 && baseIcon <= 6) {
    return isDayTime ? "02d" : "02n"; // Partly Cloudy
  } else if (baseIcon >= 7 && baseIcon <= 8) {
    return isDayTime ? "04d" : "04n"; // Cloudy
  } else if (baseIcon === 11) {
    return "50d"; // Fog (same day/night)
  } else if (baseIcon >= 12 && baseIcon <= 18) {
    return isDayTime ? "10d" : "10n"; // Rain
  } else if (baseIcon >= 15 && baseIcon <= 17) {
    return isDayTime ? "11d" : "11n"; // Thunderstorm
  } else if (baseIcon >= 19 && baseIcon <= 26) {
    return isDayTime ? "13d" : "13n"; // Snow
  }

  return isDayTime ? "01d" : "01n";
};

export const getAccuWeatherCondition = (weatherText: string): string => {
  const lowerText = weatherText.toLowerCase().trim();

  if (AccuWeatherConditionMap[lowerText]) {
    return AccuWeatherConditionMap[lowerText];
  }

  if (lowerText.includes("thunderstorm") || lowerText.includes("t-storm")) {
    return "Thunderstorm";
  } else if (lowerText.includes("rain") && !lowerText.includes("snow")) {
    return "Rain";
  } else if (
    lowerText.includes("snow") ||
    lowerText.includes("flurr") ||
    lowerText.includes("sleet")
  ) {
    return "Snow";
  } else if (lowerText.includes("drizzle") || lowerText.includes("mist")) {
    return "Drizzle";
  } else if (lowerText.includes("fog")) {
    return "Mist";
  } else if (lowerText.includes("cloud")) {
    return "Clouds";
  } else if (lowerText.includes("clear") || lowerText.includes("sunny")) {
    return "Clear";
  }

  return "Clear";
};
