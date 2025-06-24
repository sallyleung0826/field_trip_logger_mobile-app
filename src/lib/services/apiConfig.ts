import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_KEYS = {
  GOOGLE_API_KEY: "AIzaSyAdFG2ysWFsaCryviWor1U4OTUWeOeizC4",
  ACCUWEATHER_API_KEY: "NOqFORgjxsESmp6kehi04XXAMzEUlTGj",
  YELP_API_KEY:
    "midycyO5Yfq-HkhT2YQHD1ZqwCfIsgAQNAX5ak9ZvECwv8NkqBLo4-gNKnnZPKNRHj384qcAQeSEsreEj-Xm-ylSUboCKzDAjH9HBZKr0LTbkr8Jtnv_f2si__tPaHYx",
  YELP_CLIENT_ID: "K52DM9fLUPG_a3VIGi0Vhw",
  GOOGLE_PLACES: "AIzaSyAdFG2ysWFsaCryviWor1U4OTUWeOeizC4",
  GOOGLE_GEOCODING: "AIzaSyAdFG2ysWFsaCryviWor1U4OTUWeOeizC4",
  GOOGLE_MAPS: "AIzaSyAdFG2ysWFsaCryviWor1U4OTUWeOeizC4",
};

export const API_ENDPOINTS = {
  ACCUWEATHER_BASE: "https://dataservice.accuweather.com",
  ACCUWEATHER_LOCATIONS: "https://dataservice.accuweather.com/locations/v1",
  ACCUWEATHER_CURRENT:
    "https://dataservice.accuweather.com/currentconditions/v1",
  ACCUWEATHER_FORECAST: "https://dataservice.accuweather.com/forecasts/v1",
  YELP_FUSION: "https://api.yelp.com/v3",
  GEOCODING: "https://nominatim.openstreetmap.org",
  GOOGLE_PLACES: "https://maps.googleapis.com/maps/api/place",
  GOOGLE_GEOCODING: "https://maps.googleapis.com/maps/api/geocode",
  GOOGLE_MAPS: "https://maps.googleapis.com/maps/api",
};

export const API_CONFIG = {
  TIMEOUT: 25000,
  RETRY_ATTEMPTS: 3,
  CACHE_DURATION: 600000,
  DEBUG_MODE: true,
  MAX_CONCURRENT_REQUESTS: 2,
};

export const RATE_LIMITS = {
  ACCUWEATHER_REQUESTS_PER_DAY: 45,
  ACCUWEATHER_REQUESTS_PER_SECOND: 1,
  ACCUWEATHER_MIN_REQUEST_INTERVAL: 3000,
  YELP_REQUESTS_PER_DAY: 4800,
  YELP_REQUESTS_PER_HOUR: 500,
  GOOGLE_REQUESTS_PER_MINUTE: 50,
  GEOCODING_REQUESTS_PER_MINUTE: 20,
};

interface RateLimitResult {
  allowed: boolean;
  waitTime?: number;
  reason?: string;
}

class AccuWeatherRateLimiter {
  private dailyRequestTimes: number[] = [];
  private lastRequestTime: number = 0;
  private storageKey = "accuweather_rate_limit";
  private loaded: boolean = false;

  constructor() {
    this.loadFromStorage();
  }

  private async loadFromStorage(): Promise<void> {
    if (this.loaded) return;

    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.dailyRequestTimes = data.dailyRequestTimes || [];
        this.lastRequestTime = data.lastRequestTime || 0;
      }
      this.loaded = true;
    } catch (error) {
      console.warn(
        "[AccuWeather Rate Limiter] Failed to load from storage:",
        error
      );
      this.dailyRequestTimes = [];
      this.lastRequestTime = 0;
      this.loaded = true;
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      const data = {
        dailyRequestTimes: this.dailyRequestTimes,
        lastRequestTime: this.lastRequestTime,
      };
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn(
        "[AccuWeather Rate Limiter] Failed to save to storage:",
        error
      );
    }
  }

  async checkRateLimit(): Promise<RateLimitResult> {
    await this.loadFromStorage();

    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    this.dailyRequestTimes = this.dailyRequestTimes.filter(
      (time) => time > twentyFourHoursAgo
    );

    if (
      this.dailyRequestTimes.length >= RATE_LIMITS.ACCUWEATHER_REQUESTS_PER_DAY
    ) {
      const oldestRequest = Math.min(...this.dailyRequestTimes);
      const resetTime = oldestRequest + 24 * 60 * 60 * 1000;
      const waitTime = resetTime - now;

      return {
        allowed: false,
        waitTime,
        reason: `Daily limit of ${RATE_LIMITS.ACCUWEATHER_REQUESTS_PER_DAY} requests exceeded`,
      };
    }

    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMITS.ACCUWEATHER_MIN_REQUEST_INTERVAL) {
      const waitTime =
        RATE_LIMITS.ACCUWEATHER_MIN_REQUEST_INTERVAL - timeSinceLastRequest;

      return {
        allowed: false,
        waitTime,
        reason: "Requests must be at least 3 seconds apart",
      };
    }

    this.dailyRequestTimes.push(now);
    this.lastRequestTime = now;
    await this.saveToStorage();

    return { allowed: true };
  }

  async getRemainingDailyRequests(): Promise<number> {
    await this.loadFromStorage();

    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    this.dailyRequestTimes = this.dailyRequestTimes.filter(
      (time) => time > twentyFourHoursAgo
    );
    return Math.max(
      0,
      RATE_LIMITS.ACCUWEATHER_REQUESTS_PER_DAY - this.dailyRequestTimes.length
    );
  }

  async reset(): Promise<void> {
    this.dailyRequestTimes = [];
    this.lastRequestTime = 0;
    await this.saveToStorage();
  }
}

class YelpRateLimiter {
  private dailyRequestTimes: number[] = [];
  private hourlyRequestTimes: number[] = [];
  private storageKey = "yelp_fusion_rate_limiter";
  private loaded: boolean = false;

  constructor() {
    this.loadFromStorage();
  }

  private async loadFromStorage(): Promise<void> {
    if (this.loaded) return;

    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.dailyRequestTimes = data.dailyRequestTimes || [];
        this.hourlyRequestTimes = data.hourlyRequestTimes || [];
      }
      this.loaded = true;
    } catch (error) {
      console.warn("[Yelp Rate Limiter] Failed to load:", error);
      this.dailyRequestTimes = [];
      this.hourlyRequestTimes = [];
      this.loaded = true;
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      const data = {
        dailyRequestTimes: this.dailyRequestTimes,
        hourlyRequestTimes: this.hourlyRequestTimes,
      };
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn("[Yelp Rate Limiter] Failed to save to storage:", error);
    }
  }

  async checkRateLimit(): Promise<RateLimitResult> {
    await this.loadFromStorage();

    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    this.dailyRequestTimes = this.dailyRequestTimes.filter(
      (time) => time > twentyFourHoursAgo
    );

    const oneHourAgo = now - 60 * 60 * 1000;
    this.hourlyRequestTimes = this.hourlyRequestTimes.filter(
      (time) => time > oneHourAgo
    );

    if (this.dailyRequestTimes.length >= RATE_LIMITS.YELP_REQUESTS_PER_DAY) {
      const oldestRequest = Math.min(...this.dailyRequestTimes);
      const resetTime = oldestRequest + 24 * 60 * 60 * 1000;
      const waitTime = resetTime - now;

      return {
        allowed: false,
        waitTime,
        reason: `Daily limit of ${RATE_LIMITS.YELP_REQUESTS_PER_DAY} requests exceeded`,
      };
    }

    if (this.hourlyRequestTimes.length >= RATE_LIMITS.YELP_REQUESTS_PER_HOUR) {
      const oldestRequest = Math.min(...this.hourlyRequestTimes);
      const resetTime = oldestRequest + 60 * 60 * 1000;
      const waitTime = resetTime - now;

      return {
        allowed: false,
        waitTime,
        reason: `Hourly limit of ${RATE_LIMITS.YELP_REQUESTS_PER_HOUR} requests exceeded`,
      };
    }

    this.dailyRequestTimes.push(now);
    this.hourlyRequestTimes.push(now);
    await this.saveToStorage();

    return { allowed: true };
  }

  async getRemainingDailyRequests(): Promise<number> {
    await this.loadFromStorage();

    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    this.dailyRequestTimes = this.dailyRequestTimes.filter(
      (time) => time > twentyFourHoursAgo
    );
    return Math.max(
      0,
      RATE_LIMITS.YELP_REQUESTS_PER_DAY - this.dailyRequestTimes.length
    );
  }

  async getRemainingHourlyRequests(): Promise<number> {
    await this.loadFromStorage();

    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    this.hourlyRequestTimes = this.hourlyRequestTimes.filter(
      (time) => time > oneHourAgo
    );
    return Math.max(
      0,
      RATE_LIMITS.YELP_REQUESTS_PER_HOUR - this.hourlyRequestTimes.length
    );
  }

  async reset(): Promise<void> {
    this.dailyRequestTimes = [];
    this.hourlyRequestTimes = [];
    await this.saveToStorage();
  }
}

class EnhancedRateLimiter {
  private requestTimes: number[] = [];
  private maxRequests: number;
  private timeWindow: number;
  private serviceName: string;
  private storageKey: string;
  private loaded: boolean = false;

  constructor(
    maxRequests: number,
    serviceName: string,
    timeWindowMinutes: number = 1
  ) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMinutes * 60 * 1000;
    this.serviceName = serviceName;
    this.storageKey = `rate_limit_${serviceName
      .toLowerCase()
      .replace(/\s+/g, "_")}`;
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;

    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.requestTimes = data.requestTimes || [];
      }
      this.loaded = true;
    } catch (error) {
      console.warn(
        `[${this.serviceName} Rate Limiter] Failed to load from storage:`,
        error
      );
      this.requestTimes = [];
      this.loaded = true;
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      const data = { requestTimes: this.requestTimes };
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn(
        `[${this.serviceName} Rate Limiter] Failed to save to storage:`,
        error
      );
    }
  }

  async checkRateLimit(): Promise<RateLimitResult> {
    await this.ensureLoaded();

    const now = Date.now();
    this.requestTimes = this.requestTimes.filter(
      (time) => now - time < this.timeWindow
    );

    if (this.requestTimes.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requestTimes);
      const waitTime = oldestRequest + this.timeWindow - now;

      return {
        allowed: false,
        waitTime,
        reason: `Rate limit exceeded for ${this.serviceName}`,
      };
    }

    this.requestTimes.push(now);
    await this.saveToStorage();

    return { allowed: true };
  }

  async getRemainingRequests(): Promise<number> {
    await this.ensureLoaded();

    const now = Date.now();
    this.requestTimes = this.requestTimes.filter(
      (time) => now - time < this.timeWindow
    );
    return Math.max(0, this.maxRequests - this.requestTimes.length);
  }

  async reset(): Promise<void> {
    this.requestTimes = [];
    await this.saveToStorage();
  }
}

const accuWeatherRateLimiter = new AccuWeatherRateLimiter();
const yelpRateLimiter = new YelpRateLimiter();

const googleRateLimiter = new EnhancedRateLimiter(
  RATE_LIMITS.GOOGLE_REQUESTS_PER_MINUTE,
  "Google APIs",
  1
);

const geocodingRateLimiter = new EnhancedRateLimiter(
  RATE_LIMITS.GEOCODING_REQUESTS_PER_MINUTE,
  "Geocoding API",
  1
);

class RequestQueueManager {
  private activeRequests: number = 0;
  private pendingRequests: Array<() => Promise<any>> = [];

  async executeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        if (this.activeRequests >= API_CONFIG.MAX_CONCURRENT_REQUESTS) {
          this.pendingRequests.push(execute);
          return;
        }

        this.activeRequests++;

        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;

          if (this.pendingRequests.length > 0) {
            const nextRequest = this.pendingRequests.shift();
            if (nextRequest) {
              nextRequest();
            }
          }
        }
      };

      execute();
    });
  }

  getQueueStatus(): { active: number; pending: number } {
    return {
      active: this.activeRequests,
      pending: this.pendingRequests.length,
    };
  }
}

const requestQueue = new RequestQueueManager();

export const createApiClient = (
  baseURL: string,
  timeout: number = API_CONFIG.TIMEOUT,
  serviceName: string = "Unknown"
) => {
  return {
    get: async (
      endpoint: string,
      params?: Record<string, any>,
      rateLimiter?:
        | EnhancedRateLimiter
        | AccuWeatherRateLimiter
        | YelpRateLimiter,
      customHeaders?: Record<string, string>
    ) => {
      return requestQueue.executeRequest(async () => {
        if (API_CONFIG.DEBUG_MODE) {
          console.log(`[${serviceName} API] Starting request to: ${endpoint}`);
        }

        if (rateLimiter) {
          const rateLimitResult = await rateLimiter.checkRateLimit();
          if (!rateLimitResult.allowed) {
            const waitTime = rateLimitResult.waitTime || 0;
            const reason = rateLimitResult.reason || "Rate limit exceeded";
            throw new Error(
              `${reason}. Try again in ${Math.ceil(waitTime / 1000)} seconds`
            );
          }
        }

        let url: URL;
        try {
          if (endpoint.startsWith("http")) {
            url = new URL(endpoint);
          } else {
            if (!endpoint.startsWith("/")) {
              endpoint = "/" + endpoint;
            }
            url = new URL(endpoint, baseURL);
          }
        } catch (urlError) {
          console.error(
            `[${serviceName} API] Invalid URL construction:`,
            urlError
          );
          throw new Error(`Invalid URL: ${baseURL}${endpoint}`);
        }

        if (params) {
          Object.keys(params).forEach((key) => {
            if (params[key] !== undefined && params[key] !== null) {
              url.searchParams.append(key, params[key].toString());
            }
          });
        }

        if (API_CONFIG.DEBUG_MODE) {
          console.log(`[${serviceName} API] Full URL: ${url.toString()}`);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const startTime = Date.now();

          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "User-Agent": "FieldTripLogger/1.0",
            Accept: "application/json",
            "Cache-Control": "no-cache",
            ...customHeaders,
          };

          const response = await fetch(url.toString(), {
            method: "GET",
            headers,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          const responseTime = Date.now() - startTime;

          if (API_CONFIG.DEBUG_MODE) {
            console.log(
              `[${serviceName} API] Response: ${response.status} (${responseTime}ms)`
            );
          }

          if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

            if (response.status === 429) {
              errorMessage = "Rate limit exceeded by server";
            } else if (response.status === 401) {
              errorMessage = "Invalid API key or unauthorized access";
            } else if (response.status === 403) {
              errorMessage = "Access forbidden - check API permissions";
            } else if (response.status === 404) {
              errorMessage = "API endpoint not found";
            } else if (response.status >= 500) {
              errorMessage = "Server error - please try again later";
            }

            console.error(`[${serviceName} API] ${errorMessage}`);
            throw new Error(errorMessage);
          }

          const data = await response.json();

          if (API_CONFIG.DEBUG_MODE) {
            console.log(
              `[${serviceName} API] Response data keys:`,
              Object.keys(data)
            );
          }

          return data;
        } catch (error: any) {
          clearTimeout(timeoutId);

          if (error.name === "AbortError") {
            console.error(
              `[${serviceName} API] Request timeout after ${timeout}ms`
            );
            throw new Error(`Request timeout (${timeout}ms)`);
          }

          console.error(`[${serviceName} API] Request failed:`, error.message);
          throw error;
        }
      });
    },
  };
};

export const accuWeatherApiClient = createApiClient(
  API_ENDPOINTS.ACCUWEATHER_BASE,
  API_CONFIG.TIMEOUT,
  "AccuWeather"
);

export const googleApiClient = createApiClient(
  API_ENDPOINTS.GOOGLE_MAPS,
  API_CONFIG.TIMEOUT,
  "Google"
);

export const yelpApiClient = createApiClient(
  API_ENDPOINTS.YELP_FUSION,
  API_CONFIG.TIMEOUT,
  "Yelp Fusion"
);

export const geocodingApiClient = createApiClient(
  API_ENDPOINTS.GEOCODING,
  API_CONFIG.TIMEOUT,
  "Geocoding"
);

export const fetchWithAccuWeatherRateLimit = async (
  endpoint: string,
  params?: Record<string, any>
) => {
  try {
    return await accuWeatherApiClient.get(
      endpoint,
      params,
      accuWeatherRateLimiter
    );
  } catch (error) {
    console.error("[AccuWeather API] Request failed:", error);
    throw error;
  }
};

export const fetchWithGoogleRateLimit = async (
  endpoint: string,
  params?: Record<string, any>
) => {
  try {
    return await googleApiClient.get(endpoint, params, googleRateLimiter);
  } catch (error) {
    console.error("[Google API] Request failed:", error);
    throw error;
  }
};

export const fetchWithYelpRateLimit = async (
  endpoint: string,
  params?: Record<string, any>
) => {
  try {
    if (API_CONFIG.DEBUG_MODE) {
      console.log("[Yelp Fusion API] Making request with rate limiting");
    }

    const cleanParams = { ...params };

    Object.keys(cleanParams).forEach((key) => {
      if (cleanParams[key] === undefined || cleanParams[key] === null) {
        delete cleanParams[key];
      }
    });

    if (!cleanParams.location) {
      throw new Error("Location parameter is required for Yelp API");
    }

    if (cleanParams.radius) {
      cleanParams.radius = parseInt(cleanParams.radius.toString());
      if (cleanParams.radius > 40000) {
        cleanParams.radius = 40000;
      }
    }

    if (cleanParams.limit) {
      cleanParams.limit = parseInt(cleanParams.limit.toString());
      if (cleanParams.limit > 50) {
        cleanParams.limit = 50;
      }
    }

    const validSortOptions = [
      "best_match",
      "rating",
      "review_count",
      "distance",
    ];
    if (
      cleanParams.sort_by &&
      !validSortOptions.includes(cleanParams.sort_by)
    ) {
      cleanParams.sort_by = "best_match";
    }

    if (cleanParams.categories) {
      const categoryString = cleanParams.categories.toString();
      const firstCategory = categoryString.split(",")[0].trim();
      cleanParams.categories = firstCategory;
    }

    if (API_CONFIG.DEBUG_MODE) {
      console.log("[Yelp Fusion API] Clean parameters:", cleanParams);
    }

    return await yelpApiClient.get(endpoint, cleanParams, yelpRateLimiter, {
      Authorization: `Bearer ${API_KEYS.YELP_API_KEY}`,
    });
  } catch (error) {
    console.error("[Yelp Fusion API] Request failed:", error);
    throw error;
  }
};

export const fetchWithGeocodingRateLimit = async (
  endpoint: string,
  params?: Record<string, any>
) => {
  try {
    return await geocodingApiClient.get(endpoint, params, geocodingRateLimiter);
  } catch (error) {
    console.error("[Geocoding API] Request failed:", error);
    throw error;
  }
};

export const validateApiKeys = (): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} => {
  const missing: string[] = [];
  const warnings: string[] = [];

  if (
    !API_KEYS.ACCUWEATHER_API_KEY ||
    API_KEYS.ACCUWEATHER_API_KEY === "YOUR_ACCUWEATHER_API_KEY"
  ) {
    missing.push("AccuWeather API Key (for weather data)");
  } else {
    warnings.push("AccuWeather Free Tier: 50 requests/day limit");
  }

  if (
    !API_KEYS.GOOGLE_API_KEY ||
    API_KEYS.GOOGLE_API_KEY === "YOUR_GOOGLE_API_KEY"
  ) {
    missing.push("Google API Key (for Places, Geocoding, Maps)");
  }

  if (!API_KEYS.YELP_API_KEY || API_KEYS.YELP_API_KEY === "YOUR_YELP_API_KEY") {
    missing.push(
      "Yelp Fusion API Key (PRIMARY SOURCE for Hong Kong travel content)"
    );
  } else {
    warnings.push(
      "Yelp Fusion Free Tier: 5000 requests/day (excellent limit for travel content)"
    );
  }

  if (API_CONFIG.DEBUG_MODE) {
    console.log("[API Validation] Missing keys:", missing);
    console.log("[API Validation] Warnings:", warnings);
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
};

class EnhancedApiCache {
  private cache = new Map<
    string,
    { data: any; timestamp: number; size: number }
  >();
  private maxCacheSize = 10 * 1024 * 1024;
  private currentCacheSize = 0;

  set(key: string, data: any): void {
    try {
      const dataString = JSON.stringify(data);
      const size = new Blob([dataString]).size;

      if (this.currentCacheSize + size > this.maxCacheSize) {
        this.cleanup();
      }

      if (this.cache.has(key)) {
        const oldEntry = this.cache.get(key)!;
        this.currentCacheSize -= oldEntry.size;
      }

      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        size,
      });

      this.currentCacheSize += size;
    } catch (error) {
      console.error("[API Cache] Error storing data:", error);
    }
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const isExpired = Date.now() - cached.timestamp > API_CONFIG.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      this.currentCacheSize -= cached.size;
      return null;
    }

    return cached.data;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > API_CONFIG.CACHE_DURATION) {
        this.cache.delete(key);
        this.currentCacheSize -= value.size;
      }
    }

    if (this.currentCacheSize > this.maxCacheSize) {
      const entries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );

      while (
        this.currentCacheSize > this.maxCacheSize * 0.8 &&
        entries.length > 0
      ) {
        const [key, value] = entries.shift()!;
        this.cache.delete(key);
        this.currentCacheSize -= value.size;
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.currentCacheSize = 0;
  }

  getStats(): { entries: number; size: number; maxSize: number } {
    return {
      entries: this.cache.size,
      size: this.currentCacheSize,
      maxSize: this.maxCacheSize,
    };
  }
}

export const apiCache = new EnhancedApiCache();

export const getRateLimiterStatus = async () => {
  return {
    accuweather: {
      remainingDaily: await accuWeatherRateLimiter.getRemainingDailyRequests(),
    },
    yelp: {
      remainingDaily: await yelpRateLimiter.getRemainingDailyRequests(),
      remainingHourly: await yelpRateLimiter.getRemainingHourlyRequests(),
    },
    google: {
      remaining: await googleRateLimiter.getRemainingRequests(),
    },
    geocoding: {
      remaining: await geocodingRateLimiter.getRemainingRequests(),
    },
    queue: requestQueue.getQueueStatus(),
    cache: apiCache.getStats(),
  };
};

export const resetAllRateLimiters = async () => {
  await accuWeatherRateLimiter.reset();
  await yelpRateLimiter.reset();
  await googleRateLimiter.reset();
  await geocodingRateLimiter.reset();
  console.log("[API Config] All rate limiters reset");
};
