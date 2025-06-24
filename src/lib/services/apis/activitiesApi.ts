import { Activity, YelpBusiness } from "./types/apiTypes";
import { activitiesCacheService } from "../../../firebase/activitiesCacheService";
import { API_KEYS } from "../apiConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

const YELP_CONFIG = {
  BASE_URL: "https://api.yelp.com/v3",
  REQUESTS_PER_DAY: 5000,
  CACHE_DURATION_HOURS: 6,
};

const HONG_KONG_CATEGORIES = {
  dining: {
    yelpCategories: [
      "restaurants",
      "food",
      "chinese",
      "dimsum",
      "seafood",
      "hotpot",
      "desserts",
    ],
    icon: "🍴",
    name: "Dining & Food",
    searchTerms: ["restaurants", "food"],
    description: "From street food to Michelin stars",
  },
  attractions: {
    yelpCategories: [
      "museums",
      "landmarks",
      "tours",
      "galleries",
      "observatories",
    ],
    icon: "🏛️",
    name: "Attractions & Culture",
    searchTerms: ["museums", "attractions", "landmarks"],
    description: "Museums, temples, and iconic sights",
  },
  activities: {
    yelpCategories: [
      "hiking",
      "beaches",
      "parks",
      "recreation",
      "fitness",
      "climbing",
    ],
    icon: "🎯",
    name: "Activities & Recreation",
    searchTerms: ["activities", "recreation", "sports"],
    description: "Outdoor adventures and entertainment",
  },
  shopping: {
    yelpCategories: [
      "shopping",
      "markets",
      "malls",
      "fashion",
      "antiques",
      "souvenirs",
    ],
    icon: "🛍️",
    name: "Shopping & Markets",
    searchTerms: ["shopping", "markets", "malls"],
    description: "Markets, malls, and unique finds",
  },
  nightlife: {
    yelpCategories: [
      "bars",
      "pubs",
      "cocktailbars",
      "lounges",
      "karaoke",
      "clubs",
    ],
    icon: "🌃",
    name: "Nightlife & Entertainment",
    searchTerms: ["bars", "nightlife", "entertainment"],
    description: "Bars, clubs, and evening entertainment",
  },
  wellness: {
    yelpCategories: [
      "spas",
      "massage",
      "wellness",
      "yoga",
      "meditation",
      "health",
    ],
    icon: "💆‍♀️",
    name: "Wellness & Relaxation",
    searchTerms: ["spa", "wellness", "massage"],
    description: "Spas, massage, and relaxation",
  },
  transport: {
    yelpCategories: ["transport", "ferries", "tours", "taxis"],
    icon: "🚢",
    name: "Transport & Tours",
    searchTerms: ["transport", "tours", "ferry"],
    description: "Getting around and guided tours",
  },
  services: {
    yelpCategories: ["services", "banks", "internet", "laundry"],
    icon: "🏪",
    name: "Local Services",
    searchTerms: ["services", "convenience"],
    description: "Essential services for travelers",
  },
};

const HK_AREAS = [
  { name: "Central", lat: 22.2783, lng: 114.1747 },
  { name: "Tsim Sha Tsui", lat: 22.2976, lng: 114.1722 },
  { name: "Causeway Bay", lat: 22.2792, lng: 114.1831 },
  { name: "Wan Chai", lat: 22.2769, lng: 114.1728 },
  { name: "Mong Kok", lat: 22.3193, lng: 114.1694 },
  { name: "Admiralty", lat: 22.2787, lng: 114.1658 },
  { name: "Stanley", lat: 22.2188, lng: 114.213 },
  { name: "Aberdeen", lat: 22.2481, lng: 114.1544 },
];

class YelpRateLimiter {
  private requestTimes: number[] = [];
  private storageKey = "yelp_fusion_rate_limiter";
  private loaded = false;

  async canMakeRequest(): Promise<boolean> {
    await this.ensureLoaded();

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    this.requestTimes = this.requestTimes.filter((time) => time > oneDayAgo);

    if (this.requestTimes.length >= YELP_CONFIG.REQUESTS_PER_DAY) {
      console.warn(
        `[Yelp] Daily limit reached: ${this.requestTimes.length}/${YELP_CONFIG.REQUESTS_PER_DAY}`
      );
      return false;
    }

    this.requestTimes.push(now);
    await this.saveToStorage();

    return true;
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
      console.warn("[Yelp Rate Limiter] Failed to load:", error);
      this.requestTimes = [];
      this.loaded = true;
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.storageKey,
        JSON.stringify({
          requestTimes: this.requestTimes,
        })
      );
    } catch (error) {
      console.warn("[Yelp Rate Limiter] Failed to save:", error);
    }
  }

  getRemainingRequests(): number {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const recentRequests = this.requestTimes.filter((time) => time > oneDayAgo);
    return Math.max(0, YELP_CONFIG.REQUESTS_PER_DAY - recentRequests.length);
  }
}

const yelpRateLimiter = new YelpRateLimiter();

const makeYelpApiCall = async (params: Record<string, any>): Promise<any> => {
  try {
    if (!API_KEYS.YELP_API_KEY) {
      throw new Error("Yelp API key not configured");
    }

    const url = new URL("https://api.yelp.com/v3/businesses/search");

    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key].toString());
      }
    });

    const headers = {
      Authorization: `Bearer ${API_KEYS.YELP_API_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Yelp API] Error response:", errorText);
      throw new Error(
        `HTTP ${response.status}: ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[Yelp API] API call failed:", error);
    throw error;
  }
};

const fetchMultipleCategoriesFromYelp = async (): Promise<Activity[]> => {
  const allResults: Activity[] = [];
  const categories = Object.entries(HONG_KONG_CATEGORIES);

  const selectedAreas = HK_AREAS.sort(() => 0.5 - Math.random()).slice(0, 3);

  for (const [categoryKey, categoryConfig] of categories) {
    try {
      if (!(await yelpRateLimiter.canMakeRequest())) {
        console.warn(
          `[Yelp Multi-Category] Rate limit reached, stopping at ${categoryKey}`
        );
        break;
      }

      for (const categoryTerm of categoryConfig.yelpCategories.slice(0, 2)) {
        try {
          const area =
            selectedAreas[Math.floor(Math.random() * selectedAreas.length)];

          const searchParams = {
            latitude: area.lat,
            longitude: area.lng,
            categories: categoryTerm,
            limit: 8,
            sort_by: "best_match",
            radius: 10000,
          };

          const result = await makeYelpApiCall(searchParams);

          if (result.businesses && result.businesses.length > 0) {
            const convertedResults = convertYelpResults(
              result.businesses,
              categoryKey,
              categoryConfig
            );
            allResults.push(...convertedResults);

            await new Promise((resolve) => setTimeout(resolve, 1000));
            break;
          }
        } catch (termError) {
          console.warn(
            `[Yelp Multi-Category] Failed for ${categoryKey}-${categoryTerm}:`,
            termError.message
          );
          continue;
        }
      }
    } catch (categoryError) {
      console.error(
        `[Yelp Multi-Category] Failed for category ${categoryKey}:`,
        categoryError
      );
      continue;
    }
  }

  const uniqueResults = allResults.filter(
    (item, index, self) => index === self.findIndex((t) => t.id === item.id)
  );

  return uniqueResults;
};

const cleanObjectForFirebase = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (Array.isArray(obj)) {
    return obj
      .map(cleanObjectForFirebase)
      .filter((item) => item !== null && item !== undefined);
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
        if (cleanedValue !== null && cleanedValue !== undefined) {
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

const convertYelpResults = (
  businesses: YelpBusiness[],
  categoryKey: string,
  categoryConfig: any
): Activity[] => {
  return businesses
    .map((business, index) => {
      const baseArticle: any = {
        id: `yelp_hk_${business.id}_${categoryKey}_${Date.now()}_${index}`,
        title: `${categoryConfig.icon} ${business.name || "Business"}`,
        description: buildBusinessDescription(business, categoryConfig),
        url: business.url || "#",
        publishedAt: new Date().toISOString(),
        source: "Yelp Hong Kong",
        businessType: categoryKey,
      };

      if (business.image_url) {
        baseArticle.imageUrl = business.image_url;
      }

      if (business.rating !== undefined && business.rating !== null) {
        baseArticle.rating = business.rating;
      }

      if (business.price) {
        baseArticle.priceLevel = business.price;
      }

      if (
        business.location?.display_address &&
        business.location.display_address.length > 0
      ) {
        baseArticle.address = business.location.display_address.join(", ");
      }

      if (business.display_phone) {
        baseArticle.phone = business.display_phone;
      }

      if (business.categories && business.categories.length > 0) {
        baseArticle.categories = business.categories.map((c) => c.title);
      }

      const businessData: any = {
        yelpId: business.id || `unknown_${index}`,
        rating: business.rating || 0,
        reviewCount: business.review_count || 0,
        priceLevel: business.price || "Not specified",
        categories:
          business.categories && business.categories.length > 0
            ? business.categories.map((c) => c.title)
            : [],
        coordinates: {
          latitude: business.coordinates?.latitude || 22.3193,
          longitude: business.coordinates?.longitude || 114.1694,
        },
        photos: business.image_url ? [business.image_url] : [],
        hours: "Check website for hours",
        categoryType: categoryKey,
        area: getAreaFromCoordinates(
          business.coordinates?.latitude,
          business.coordinates?.longitude
        ),
      };

      if (business.display_phone) {
        businessData.phone = business.display_phone;
      }

      baseArticle.businessData = businessData;

      const cleaned = cleanObjectForFirebase(baseArticle);
      return cleaned;
    })
    .filter((article) => article !== null && article !== undefined);
};

const buildBusinessDescription = (
  business: YelpBusiness,
  categoryConfig: any
): string => {
  const rating = business.rating || 0;
  const reviews = business.review_count || 0;
  const categories = business.categories
    ? business.categories.map((c) => c.title).join(", ")
    : categoryConfig.name;

  let description = `${categories} with ${rating}⭐ rating from ${reviews} reviews. `;

  if (business.location?.display_address) {
    description += `Located in ${business.location.display_address.join(
      ", "
    )}. `;
  }

  if (business.price) {
    description += `Price range: ${business.price}. `;
  }

  description += categoryConfig.description;

  return description;
};

const getAreaFromCoordinates = (lat?: number, lng?: number): string => {
  if (!lat || !lng) return "Hong Kong";

  let closestArea = "Hong Kong";
  let minDistance = Infinity;

  for (const area of HK_AREAS) {
    const distance = Math.sqrt(
      Math.pow(lat - area.lat, 2) + Math.pow(lng - area.lng, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestArea = area.name;
    }
  }

  return closestArea;
};

export const fetchLocalActivities = async (
  country: string = "hk",
  category: string = "travel"
): Promise<Activity[]> => {
  try {
    const needsFresh = await activitiesCacheService.needsFreshData(
      country,
      category
    );
    if (!needsFresh) {
      const cachedArticles = await activitiesCacheService.getArticles(
        country,
        category
      );
      if (cachedArticles.length > 0) {
        return cachedArticles;
      }
    }

    const remainingRequests = yelpRateLimiter.getRemainingRequests();
    if (remainingRequests <= 0) {
      console.warn("[HK Local Guide] Rate limit exceeded, using cached data");
      const cachedArticles = await activitiesCacheService.getArticles(
        country,
        category
      );
      return cachedArticles;
    }

    const results = await fetchMultipleCategoriesFromYelp();

    if (results.length > 0) {
      try {
        const firebaseSafeResults = results
          .map((article) => cleanObjectForFirebase(article))
          .filter(Boolean);

        await activitiesCacheService.storeArticles(
          firebaseSafeResults,
          country,
          category,
          true
        );

        return firebaseSafeResults;
      } catch (cacheError) {
        console.warn("[HK Local Guide] Failed to cache:", cacheError);
        return results;
      }
    }

    const cachedArticles = await activitiesCacheService.getArticles(
      country,
      category
    );
    if (cachedArticles.length > 0) {
      return cachedArticles;
    }

    return [];
  } catch (error) {
    console.error("[HK Local Guide] Error:", error);

    try {
      const cachedArticles = await activitiesCacheService.getArticles(
        country,
        category
      );
      if (cachedArticles.length > 0) {
        return cachedArticles;
      }
    } catch (cacheError) {
      console.error("[HK Local Guide] Cache fallback also failed:", cacheError);
    }

    return [];
  }
};

export const fetchTravelActivities = async (): Promise<Activity[]> => {
  return await fetchLocalActivities("hk", "travel");
};

export const fetchGeneralActivities = async (): Promise<Activity[]> => {
  return await fetchLocalActivities("hk", "general");
};

export const fetchCountryActivities = async (
  country: string,
  category: string = "general"
): Promise<Activity[]> => {
  return await fetchLocalActivities(country, category);
};

export const fetchCategoryData = async (
  categoryKey: string
): Promise<Activity[]> => {
  try {
    if (!(await yelpRateLimiter.canMakeRequest())) {
      console.warn(`[HK Category] Rate limit reached for ${categoryKey}`);
      return [];
    }

    const categoryConfig =
      HONG_KONG_CATEGORIES[categoryKey as keyof typeof HONG_KONG_CATEGORIES];
    if (!categoryConfig) {
      console.error(`[HK Category] Unknown category: ${categoryKey}`);
      return [];
    }

    const results: Activity[] = [];
    const areasToSearch = HK_AREAS.slice(0, 3);

    for (const area of areasToSearch) {
      try {
        if (!(await yelpRateLimiter.canMakeRequest())) {
          break;
        }

        const searchParams = {
          latitude: area.lat,
          longitude: area.lng,
          categories: categoryConfig.yelpCategories[0],
          limit: 10,
          sort_by: "best_match",
          radius: 5000,
        };

        const result = await makeYelpApiCall(searchParams);

        if (result.businesses && result.businesses.length > 0) {
          const convertedResults = convertYelpResults(
            result.businesses,
            categoryKey,
            categoryConfig
          );
          results.push(...convertedResults);
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (areaError) {
        console.warn(
          `[HK Category] Failed for area ${area.name}:`,
          areaError.message
        );
        continue;
      }
    }

    const uniqueResults = results.filter(
      (item, index, self) =>
        index ===
        self.findIndex(
          (t) => t.businessData?.yelpId === item.businessData?.yelpId
        )
    );

    return uniqueResults;
  } catch (error) {
    console.error(`[HK Category] Error fetching ${categoryKey}:`, error);
    return [];
  }
};

export const getActivitiesAPIStatus = async () => {
  const yelpRemaining = yelpRateLimiter.getRemainingRequests();
  const categoriesCount = Object.keys(HONG_KONG_CATEGORIES).length;

  return {
    yelp: {
      provider: "Yelp Fusion API (Enhanced Multi-Category)",
      apiKey: API_KEYS.YELP_API_KEY ? "✓ Configured" : "✗ Missing",
      apiKeyLength: API_KEYS.YELP_API_KEY?.length || 0,
      dailyLimit: YELP_CONFIG.REQUESTS_PER_DAY,
      remainingRequests: yelpRemaining,
      status: yelpRemaining > 0 ? "Available" : "Limit Reached",
      coverage: `${categoriesCount} Activity Categories`,
      categories: Object.keys(HONG_KONG_CATEGORIES),
      areas: HK_AREAS.length,
    },
  };
};

export { HONG_KONG_CATEGORIES };
