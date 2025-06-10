import {
  API_KEYS,
  API_ENDPOINTS,
  API_CONFIG,
  apiCache,
  fetchWithAccuWeatherRateLimit,
} from "../apiConfig";
import {
  WeatherData,
  LocationLookupError,
  AccuWeatherCurrentConditions,
  getAccuWeatherIcon,
  getAccuWeatherCondition,
} from "./types/apiTypes";

// AccuWeather API functions
class AccuWeatherService {
  private validateApiKey(): void {
    if (
      !API_KEYS.ACCUWEATHER_API_KEY ||
      API_KEYS.ACCUWEATHER_API_KEY === "YOUR_ACCUWEATHER_API_KEY"
    ) {
      throw new Error(
        "AccuWeather API key not configured. Please add your API key to API_KEYS.ACCUWEATHER_API_KEY"
      );
    }
  }

  // Get location key from coordinates using AccuWeather Geolocation API
  async getLocationKey(latitude: number, longitude: number): Promise<string> {
    const cacheKey = `location_key_${latitude.toFixed(4)}_${longitude.toFixed(
      4
    )}`;

    try {
      console.log(
        "[AccuWeather] Getting location key for coordinates:",
        latitude,
        longitude
      );

      const cachedLocationKey = apiCache.get(cacheKey);
      if (cachedLocationKey) {
        console.log(
          "[AccuWeather] Using cached location key:",
          cachedLocationKey
        );
        return cachedLocationKey;
      }

      this.validateApiKey();

      if (
        !latitude ||
        !longitude ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        throw new Error("Invalid coordinates provided");
      }

      console.log("[AccuWeather] Making location lookup API call");

      const response = await fetchWithAccuWeatherRateLimit(
        `${API_ENDPOINTS.ACCUWEATHER_LOCATIONS}/cities/geoposition/search`,
        {
          apikey: API_KEYS.ACCUWEATHER_API_KEY,
          q: `${latitude},${longitude}`,
          details: "false",
        }
      );

      console.log("[AccuWeather] Location lookup response received");

      if (!response || !response.Key) {
        console.error("[AccuWeather] Invalid location response:", response);
        throw new Error("Unable to find location for the provided coordinates");
      }

      const locationKey = response.Key;
      console.log("[AccuWeather] Location key found:", locationKey);

      apiCache.set(cacheKey, locationKey);

      return locationKey;
    } catch (error: any) {
      console.error("[AccuWeather] Error getting location key:", error);

      const locationError: LocationLookupError = {
        code: "LOCATION_LOOKUP_FAILED",
        message: `Failed to get location key: ${error.message}`,
        coordinates: { latitude, longitude },
      };

      throw locationError;
    }
  }

  // Convert AccuWeather current conditions to the WeatherData format
  private convertCurrentConditions(
    accuWeatherData: AccuWeatherCurrentConditions
  ): WeatherData {
    console.log("[AccuWeather] Converting current conditions data");

    const condition = getAccuWeatherCondition(accuWeatherData.WeatherText);
    const icon = getAccuWeatherIcon(
      accuWeatherData.WeatherIcon,
      accuWeatherData.IsDayTime
    );

    const weatherData: WeatherData = {
      temperature: Math.round(accuWeatherData.Temperature.Metric.Value),
      condition: condition,
      description: accuWeatherData.WeatherText,
      humidity: accuWeatherData.RelativeHumidity,
      windSpeed: Math.round(accuWeatherData.Wind.Speed.Metric.Value * 10) / 10,
      icon: icon,
    };

    console.log("[AccuWeather] Converted weather data:", weatherData);
    return weatherData;
  }

  // Get current weather data
  async getCurrentWeather(
    latitude: number,
    longitude: number
  ): Promise<WeatherData> {
    const cacheKey = `weather_current_${latitude.toFixed(
      4
    )}_${longitude.toFixed(4)}`;

    console.log(
      "[AccuWeather] Starting current weather fetch for coordinates:",
      latitude,
      longitude
    );

    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
      console.log("[AccuWeather] Using cached current weather data");
      return cachedData;
    }

    this.validateApiKey();

    // Step 1: Get location key
    const locationKey = await this.getLocationKey(latitude, longitude);

    // Add delay to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 3500));

    // Step 2: Get current conditions
    console.log(
      "[AccuWeather] Fetching current conditions for location key:",
      locationKey
    );

    const response = await fetchWithAccuWeatherRateLimit(
      `${API_ENDPOINTS.ACCUWEATHER_CURRENT}/${locationKey}`,
      {
        apikey: API_KEYS.ACCUWEATHER_API_KEY,
        details: "true",
      }
    );

    console.log("[AccuWeather] Current conditions response received");

    if (!response || !Array.isArray(response) || response.length === 0) {
      console.error(
        "[AccuWeather] Invalid current conditions response:",
        response
      );
      throw new Error("No current weather data available");
    }

    const currentConditions = response[0] as AccuWeatherCurrentConditions;
    const weatherData = this.convertCurrentConditions(currentConditions);

    apiCache.set(cacheKey, weatherData);

    console.log("[AccuWeather] Current weather data successfully retrieved");
    return weatherData;
  }
}

// Create service instance
const accuWeatherService = new AccuWeatherService();

// Export function for weather
export const fetchWeatherData = async (
  latitude: number,
  longitude: number
): Promise<WeatherData | null> => {
  try {
    console.log(
      "[Weather API] Starting weather data fetch using AccuWeather for coordinates:",
      latitude,
      longitude
    );

    if (
      !latitude ||
      !longitude ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new Error("Invalid coordinates provided");
    }

    const weatherData = await accuWeatherService.getCurrentWeather(
      latitude,
      longitude
    );

    console.log(
      "[Weather API] Weather data successfully retrieved:",
      weatherData
    );
    return weatherData;
  } catch (error: any) {
    console.error("[Weather API] Error in fetchWeatherData:", error);

    console.error("[Weather API] Weather service failed:", error.message);
    return null;
  }
};

// Utility function to get AccuWeather API status
export const getAccuWeatherStatus = () => {
  try {
    const hasApiKey =
      API_KEYS.ACCUWEATHER_API_KEY &&
      API_KEYS.ACCUWEATHER_API_KEY !== "YOUR_ACCUWEATHER_API_KEY";

    return {
      configured: hasApiKey,
      apiKey: hasApiKey ? "✓ Configured" : "✗ Missing",
      endpoint: API_ENDPOINTS.ACCUWEATHER_BASE,
      rateLimit: "50 requests/day",
      features: "Current weather conditions only",
      status: hasApiKey ? "Ready" : "Needs API Key",
    };
  } catch (error) {
    return {
      configured: false,
      apiKey: "✗ Error",
      endpoint: API_ENDPOINTS.ACCUWEATHER_BASE,
      rateLimit: "50 requests/day",
      features: "Error",
      status: "Error",
    };
  }
};

// Clear weather cache
export const clearWeatherCache = () => {
  try {
    console.log("[Weather API] Clearing weather-related cache entries");

    const cacheStats = apiCache.getStats();
    console.log(
      `[Weather API] Cache cleared. Total entries: ${cacheStats.entries}`
    );

    apiCache.clear();
    console.log("[Weather API] All cache cleared successfully");
  } catch (error) {
    console.error("[Weather API] Error clearing cache:", error);
  }
};
