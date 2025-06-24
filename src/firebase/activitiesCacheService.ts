import { ref, set, get, remove, DataSnapshot } from "firebase/database";
import { database, auth } from "./config";
import { Activity } from "../lib/services/apis/types/apiTypes";

const CACHE_CONFIG = {
  CACHE_DURATION_HOURS: 3,
  FALLBACK_CACHE_DURATION_HOURS: 24,
  MAX_ARTICLES_PER_CATEGORY: 50,
  DATABASE_PATH: "enhancedActivitiesCache",
  CONNECTION_TEST_TIMEOUT: 5000,
  QUOTA_EXCEEDED_CACHE_HOURS: 48,
};

export interface EnhancedCachedActivitiesData {
  articles: Activity[];
  metadata: {
    country: string;
    category: string;
    lastFetched: number;
    articleCount: number;
    version: string;
    isRealData: boolean;
    userId: string;
    cachedAt: number;
    quotaExceeded?: boolean;
    apiSource: string;
    categoryBreakdown?: { [key: string]: number };
    totalRequests?: number;
  };
}

const validateAndCleanForFirebase = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (Array.isArray(obj)) {
    return obj.map(validateAndCleanForFirebase).filter((item) => item !== null);
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
        const cleanedValue = validateAndCleanForFirebase(value);
        if (cleanedValue !== null) {
          cleaned[key] = cleanedValue;
        }
      } else {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }

  return obj;
};

const validateArticleForFirebase = (article: Activity): Activity | null => {
  try {
    if (!article.id || !article.title || !article.url) {
      console.warn(
        "[Enhanced Cache] Article missing required fields:",
        article
      );
      return null;
    }

    const cleanArticle: any = {
      id: article.id.toString(),
      title: article.title.toString().trim(),
      description: article.description
        ? article.description.toString().trim()
        : "",
      url: article.url.toString(),
      publishedAt: article.publishedAt || new Date().toISOString(),
      source: article.source || "Yelp Hong Kong",
    };

    if (article.imageUrl && typeof article.imageUrl === "string") {
      cleanArticle.imageUrl = article.imageUrl;
    }

    if (article.businessType && typeof article.businessType === "string") {
      cleanArticle.businessType = article.businessType;
    }

    if (
      article.rating &&
      typeof article.rating === "number" &&
      !isNaN(article.rating)
    ) {
      cleanArticle.rating = Math.min(5, Math.max(0, article.rating));
    }

    if (article.priceLevel && typeof article.priceLevel === "string") {
      cleanArticle.priceLevel = article.priceLevel;
    }

    if (article.address && typeof article.address === "string") {
      cleanArticle.address = article.address;
    }

    if (article.phone && typeof article.phone === "string") {
      cleanArticle.phone = article.phone;
    }

    if (article.categories && Array.isArray(article.categories)) {
      cleanArticle.categories = article.categories.filter(
        (cat) => typeof cat === "string"
      );
    }

    if (article.businessData && typeof article.businessData === "object") {
      const businessData: any = {
        yelpId: article.businessData.yelpId || cleanArticle.id,
        rating:
          typeof article.businessData.rating === "number"
            ? article.businessData.rating
            : 0,
        reviewCount:
          typeof article.businessData.reviewCount === "number"
            ? article.businessData.reviewCount
            : 0,
        priceLevel: article.businessData.priceLevel || "Not specified",
        categories: Array.isArray(article.businessData.categories)
          ? article.businessData.categories.filter(
              (cat) => typeof cat === "string"
            )
          : [],
        hours: "Check website for hours",
        coordinates: {
          latitude:
            typeof article.businessData.coordinates?.latitude === "number"
              ? article.businessData.coordinates.latitude
              : 22.3193,
          longitude:
            typeof article.businessData.coordinates?.longitude === "number"
              ? article.businessData.coordinates.longitude
              : 114.1694,
        },
        photos: Array.isArray(article.businessData.photos)
          ? article.businessData.photos.filter(
              (photo) => typeof photo === "string"
            )
          : [],
      };

      if (
        article.businessData.categoryType &&
        typeof article.businessData.categoryType === "string"
      ) {
        businessData.categoryType = article.businessData.categoryType;
      }

      if (
        article.businessData.area &&
        typeof article.businessData.area === "string"
      ) {
        businessData.area = article.businessData.area;
      }

      if (
        article.businessData.phone &&
        typeof article.businessData.phone === "string"
      ) {
        businessData.phone = article.businessData.phone;
      }

      cleanArticle.businessData = businessData;
    }

    return validateAndCleanForFirebase(cleanArticle) as Activity;
  } catch (error) {
    console.error("[Enhanced Cache] Error validating article:", error, article);
    return null;
  }
};

class EnhancedFirebaseActivitiesCacheService {
  private isFirebaseAvailable: boolean | null = null;
  private connectionTestInProgress = false;

  private getCachePath(country: string, category: string): string {
    return `${CACHE_CONFIG.DATABASE_PATH}/${country}_${category}`;
  }

  private checkAuth(): boolean {
    if (!auth.currentUser) {
      console.warn(
        "[Enhanced Cache] User not authenticated - using public cache access"
      );
      return false;
    }
    return true;
  }

  async testConnection(): Promise<boolean> {
    if (this.isFirebaseAvailable !== null && !this.connectionTestInProgress) {
      return this.isFirebaseAvailable;
    }

    if (this.connectionTestInProgress) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return this.isFirebaseAvailable ?? false;
    }

    this.connectionTestInProgress = true;

    try {
      const testRef = ref(database, `${CACHE_CONFIG.DATABASE_PATH}`);
      const testPromise = get(testRef);
      const timeoutPromise = new Promise<DataSnapshot>((_, reject) =>
        setTimeout(
          () => reject(new Error("Connection test timeout")),
          CACHE_CONFIG.CONNECTION_TEST_TIMEOUT
        )
      );

      const snapshot = await Promise.race([testPromise, timeoutPromise]);

      if (snapshot && typeof snapshot === "object" && "exists" in snapshot) {
        this.isFirebaseAvailable = true;
        return true;
      } else {
        this.isFirebaseAvailable = false;
        return false;
      }
    } catch (error: any) {
      console.warn(
        "[Enhanced Cache] ⚠️ Firebase connection failed:",
        error.message
      );
      this.isFirebaseAvailable = false;
      return false;
    } finally {
      this.connectionTestInProgress = false;
    }
  }

  async getArticles(country: string, category: string): Promise<Activity[]> {
    try {
      const cachePath = this.getCachePath(country, category);

      const connectionOk = await this.testConnection();
      if (!connectionOk) {
        return [];
      }

      const cacheRef = ref(database, cachePath);
      const readPromise = get(cacheRef);
      const timeoutPromise = new Promise<DataSnapshot>((_, reject) =>
        setTimeout(() => reject(new Error("Read timeout")), 10000)
      );

      const snapshot = await Promise.race([readPromise, timeoutPromise]);

      if (!snapshot.exists()) {
        return [];
      }

      const cachedData: EnhancedCachedActivitiesData = snapshot.val();

      if (
        cachedData &&
        cachedData.articles &&
        Array.isArray(cachedData.articles)
      ) {
        const validArticles = cachedData.articles.filter(
          (article) => article && article.id && article.title && article.url
        );

        if (validArticles.length !== cachedData.articles.length) {
          console.warn(
            `[Enhanced Cache] ⚠️ Filtered out ${
              cachedData.articles.length - validArticles.length
            } invalid articles`
          );
        }

        return validArticles;
      } else {
        console.warn(`[Enhanced Cache] ⚠️ Invalid cached data structure`);
        return [];
      }
    } catch (error: any) {
      if (error.message === "Read timeout") {
        console.error(
          `[Enhanced Cache] ⏱️ Read operation timed out for ${country}/${category}`
        );
      } else {
        console.error(`[Enhanced Cache] ❌ Error getting articles:`, error);
      }
      return [];
    }
  }

  async needsFreshData(country: string, category: string): Promise<boolean> {
    try {
      const connectionOk = await this.testConnection();
      if (!connectionOk) {
        return true;
      }

      const cachePath = this.getCachePath(country, category);
      const cacheRef = ref(database, cachePath);

      const readPromise = get(cacheRef);
      const timeoutPromise = new Promise<DataSnapshot>((_, reject) =>
        setTimeout(() => reject(new Error("Read timeout")), 8000)
      );

      const snapshot = await Promise.race([readPromise, timeoutPromise]);

      if (!snapshot.exists()) {
        return true;
      }

      const cachedData: EnhancedCachedActivitiesData = snapshot.val();

      if (
        !cachedData ||
        !cachedData.metadata ||
        !cachedData.metadata.lastFetched
      ) {
        return true;
      }

      const lastFetched = cachedData.metadata.lastFetched;
      const now = Date.now();
      const hoursDiff = (now - lastFetched) / (1000 * 60 * 60);

      if (cachedData.metadata.quotaExceeded) {
        const needsFresh = hoursDiff >= CACHE_CONFIG.QUOTA_EXCEEDED_CACHE_HOURS;
        return needsFresh;
      } else {
        if (!cachedData.metadata.isRealData) {
          return true;
        }

        const needsFresh = hoursDiff >= CACHE_CONFIG.CACHE_DURATION_HOURS;
        return needsFresh;
      }
    } catch (error: any) {
      if (error.message === "Read timeout") {
        console.error(`[Enhanced Cache] ⏱️ Freshness check timed out`);
      } else {
        console.error(
          `[Enhanced Cache] ❌ Error checking cache freshness:`,
          error
        );
      }
      return true;
    }
  }

  async storeArticles(
    articles: Activity[],
    country: string,
    category: string,
    isRealData: boolean = true,
    quotaExceeded: boolean = false
  ): Promise<void> {
    try {
      const connectionOk = await this.testConnection();
      if (!connectionOk) {
        return;
      }

      if (articles.length === 0) {
        console.warn("[Enhanced Cache] No articles to store");
        return;
      }

      if (!isRealData && !quotaExceeded) {
        const existing = await this.getArticles(country, category);
        if (existing.length > 0) {
          try {
            const cachePath = this.getCachePath(country, category);
            const cacheRef = ref(database, cachePath);
            const snapshot = await get(cacheRef);

            if (snapshot.exists()) {
              const existingData: EnhancedCachedActivitiesData = snapshot.val();
              if (
                existingData.metadata?.isRealData &&
                !existingData.metadata?.quotaExceeded
              ) {
                return;
              }
            }
          } catch (checkError) {
            console.warn("[Enhanced Cache] Could not check existing data");
          }
        }
      }

      const validatedArticles = articles
        .map((article) => validateArticleForFirebase(article))
        .filter((article) => article !== null)
        .slice(0, CACHE_CONFIG.MAX_ARTICLES_PER_CATEGORY);

      if (validatedArticles.length === 0) {
        console.warn("[Enhanced Cache] No valid articles after validation");
        return;
      }

      const categoryBreakdown: { [key: string]: number } = {};
      validatedArticles.forEach((article) => {
        const type = article.businessType || "other";
        categoryBreakdown[type] = (categoryBreakdown[type] || 0) + 1;
      });

      const enhancedCacheData: EnhancedCachedActivitiesData = {
        articles: validatedArticles,
        metadata: {
          country,
          category,
          lastFetched: Date.now(),
          articleCount: validatedArticles.length,
          version: "3.0_enhanced",
          isRealData: isRealData,
          userId: auth.currentUser?.uid || "anonymous",
          cachedAt: Date.now(),
          quotaExceeded: quotaExceeded,
          apiSource: "Yelp Fusion API Enhanced",
          categoryBreakdown: categoryBreakdown,
          totalRequests: 1,
        },
      };

      const finalValidatedData = validateAndCleanForFirebase(enhancedCacheData);
      const cachePath = this.getCachePath(country, category);
      const cacheRef = ref(database, cachePath);

      const storePromise = set(cacheRef, finalValidatedData);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Storage timeout")), 15000)
      );

      await Promise.race([storePromise, timeoutPromise]);
    } catch (error: any) {
      console.error("[Enhanced Cache] ❌ Error storing articles:", error);

      if (error.code === "PERMISSION_DENIED") {
        console.error(
          "[Enhanced Cache] Permission denied - check Firebase rules"
        );
        this.isFirebaseAvailable = false;
      } else if (error.message === "Storage timeout") {
        console.error("[Enhanced Cache] Storage operation timed out");
      }
    }
  }

  async storeArticlesQuotaExceeded(
    articles: Activity[],
    country: string,
    category: string
  ): Promise<void> {
    await this.storeArticles(articles, country, category, true, true);
  }

  async clearAllCache(): Promise<void> {
    try {
      const connectionOk = await this.testConnection();
      if (!connectionOk) {
        return;
      }

      const cacheRef = ref(database, CACHE_CONFIG.DATABASE_PATH);
      const clearPromise = remove(cacheRef);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Clear timeout")), 10000)
      );

      await Promise.race([clearPromise, timeoutPromise]);
    } catch (error: any) {
      console.error("[Enhanced Cache] Error clearing cache:", error);
    }
  }

  async getEnhancedStatistics(): Promise<{
    totalArticles: number;
    realDataEntries: number;
    fallbackDataEntries: number;
    quotaExceededEntries: number;
    categoryBreakdown: { [key: string]: number };
    oldestCacheDate: string | null;
    newestCacheDate: string | null;
    firebaseAvailable: boolean;
    totalApiRequests: number;
  }> {
    try {
      const connectionOk = await this.testConnection();
      if (!connectionOk) {
        return {
          totalArticles: 0,
          realDataEntries: 0,
          fallbackDataEntries: 0,
          quotaExceededEntries: 0,
          categoryBreakdown: {},
          oldestCacheDate: null,
          newestCacheDate: null,
          firebaseAvailable: false,
          totalApiRequests: 0,
        };
      }

      const cacheRef = ref(database, CACHE_CONFIG.DATABASE_PATH);
      const snapshot = await get(cacheRef);

      if (!snapshot.exists()) {
        return {
          totalArticles: 0,
          realDataEntries: 0,
          fallbackDataEntries: 0,
          quotaExceededEntries: 0,
          categoryBreakdown: {},
          oldestCacheDate: null,
          newestCacheDate: null,
          firebaseAvailable: true,
          totalApiRequests: 0,
        };
      }

      const data = snapshot.val();
      let totalArticles = 0;
      let realDataEntries = 0;
      let fallbackDataEntries = 0;
      let quotaExceededEntries = 0;
      let totalApiRequests = 0;
      let oldestTimestamp = Number.MAX_SAFE_INTEGER;
      let newestTimestamp = 0;
      const categoryBreakdown: { [key: string]: number } = {};

      Object.values(data).forEach((entry: any) => {
        if (entry && entry.metadata && entry.articles) {
          totalArticles += entry.articles.length;

          if (entry.metadata.isRealData) {
            realDataEntries++;
          } else {
            fallbackDataEntries++;
          }

          if (entry.metadata.quotaExceeded) {
            quotaExceededEntries++;
          }

          if (entry.metadata.totalRequests) {
            totalApiRequests += entry.metadata.totalRequests;
          }

          if (entry.metadata.categoryBreakdown) {
            Object.entries(entry.metadata.categoryBreakdown).forEach(
              ([category, count]: [string, any]) => {
                categoryBreakdown[category] =
                  (categoryBreakdown[category] || 0) + count;
              }
            );
          }

          const timestamp = entry.metadata.lastFetched;
          if (timestamp < oldestTimestamp) {
            oldestTimestamp = timestamp;
          }
          if (timestamp > newestTimestamp) {
            newestTimestamp = timestamp;
          }
        }
      });

      return {
        totalArticles,
        realDataEntries,
        fallbackDataEntries,
        quotaExceededEntries,
        categoryBreakdown,
        oldestCacheDate:
          oldestTimestamp === Number.MAX_SAFE_INTEGER
            ? null
            : new Date(oldestTimestamp).toLocaleString(),
        newestCacheDate:
          newestTimestamp === 0
            ? null
            : new Date(newestTimestamp).toLocaleString(),
        firebaseAvailable: true,
        totalApiRequests,
      };
    } catch (error: any) {
      console.error(
        "[Enhanced Cache] Error getting enhanced statistics:",
        error
      );
      return {
        totalArticles: 0,
        realDataEntries: 0,
        fallbackDataEntries: 0,
        quotaExceededEntries: 0,
        categoryBreakdown: {},
        oldestCacheDate: null,
        newestCacheDate: null,
        firebaseAvailable: false,
        totalApiRequests: 0,
      };
    }
  }

  async shouldPrioritizeCachedData(): Promise<boolean> {
    try {
      const stats = await this.getEnhancedStatistics();

      if (stats.quotaExceededEntries > 0 && stats.totalArticles > 0) {
        return true;
      }

      return false;
    } catch (error) {
      console.error("[Enhanced Cache] Error checking cache priority:", error);
      return false;
    }
  }

  resetConnectionStatus(): void {
    this.isFirebaseAvailable = null;
    this.connectionTestInProgress = false;
  }

  async getCacheHealth(): Promise<{
    status: "healthy" | "degraded" | "offline";
    issues: string[];
    recommendations: string[];
    lastUpdate: string | null;
  }> {
    try {
      const connectionOk = await this.testConnection();
      const stats = await this.getEnhancedStatistics();

      const issues: string[] = [];
      const recommendations: string[] = [];

      if (!connectionOk) {
        return {
          status: "offline",
          issues: ["Firebase connection failed"],
          recommendations: [
            "Check internet connection",
            "Verify Firebase configuration",
          ],
          lastUpdate: null,
        };
      }

      if (stats.totalArticles === 0) {
        issues.push("No cached data available");
        recommendations.push("Refresh content to populate cache");
      }

      if (stats.quotaExceededEntries > 0) {
        issues.push(
          `${stats.quotaExceededEntries} entries cached due to quota limits`
        );
        recommendations.push(
          "Consider upgrading API plan for better data freshness"
        );
      }

      if (stats.fallbackDataEntries > stats.realDataEntries) {
        issues.push("More fallback data than real API data");
        recommendations.push("Check API connectivity and quotas");
      }

      const status = issues.length === 0 ? "healthy" : "degraded";

      return {
        status,
        issues,
        recommendations,
        lastUpdate: stats.newestCacheDate,
      };
    } catch (error) {
      return {
        status: "offline",
        issues: ["Cache health check failed"],
        recommendations: ["Check system connectivity"],
        lastUpdate: null,
      };
    }
  }
}

export const activitiesCacheService =
  new EnhancedFirebaseActivitiesCacheService();
