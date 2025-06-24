import { useState, useEffect, useCallback, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  RefreshControl,
  FlatList,
  Linking,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  fetchLocalActivities,
  fetchTravelActivities,
} from "../lib/services/apis/activitiesApi";
import { activitiesCacheService } from "../firebase/activitiesCacheService";
import { Activity } from "../lib/services/apis/types/apiTypes";

interface ActivityItemProps {
  item: Activity;
  onPress: (url: string, title: string) => void;
}

const ACTIVITY_CATEGORIES = {
  dining: {
    icon: "🍴",
    name: "Dining & Food",
    color: "#e91e63",
    description: "From street food to fine dining",
    gradient: ["#e91e63", "#ad1457"],
  },
  attractions: {
    icon: "🏛️",
    name: "Attractions & Culture",
    color: "#9c27b0",
    description: "Museums, temples, and landmarks",
    gradient: ["#9c27b0", "#6a1b9a"],
  },
  activities: {
    icon: "🎯",
    name: "Activities & Recreation",
    color: "#ff9800",
    description: "Adventures and entertainment",
    gradient: ["#ff9800", "#f57c00"],
  },
  shopping: {
    icon: "🛍️",
    name: "Shopping & Markets",
    color: "#4caf50",
    description: "Markets, malls, and unique finds",
    gradient: ["#4caf50", "#388e3c"],
  },
  nightlife: {
    icon: "🌃",
    name: "Nightlife",
    color: "#3f51b5",
    description: "Bars, clubs, and evening fun",
    gradient: ["#3f51b5", "#303f9f"],
  },
  wellness: {
    icon: "💆‍♀️",
    name: "Wellness & Spa",
    color: "#009688",
    description: "Relaxation and self-care",
    gradient: ["#009688", "#00695c"],
  },
  transport: {
    icon: "🚢",
    name: "Transport & Tours",
    color: "#607d8b",
    description: "Getting around Hong Kong",
    gradient: ["#607d8b", "#455a64"],
  },
  services: {
    icon: "🏪",
    name: "Local Services",
    color: "#795548",
    description: "Essential traveler services",
    gradient: ["#795548", "#5d4037"],
  },
};

const getBusinessIcon = (
  businessType?: string
): keyof typeof MaterialIcons.glyphMap => {
  const iconMap: { [key: string]: keyof typeof MaterialIcons.glyphMap } = {
    dining: "restaurant",
    attractions: "museum",
    activities: "local-activity",
    shopping: "shopping-cart",
    nightlife: "local-bar",
    wellness: "spa",
    transport: "directions-boat",
    services: "business",
  };
  return iconMap[businessType || ""] || "place";
};

const getRatingStars = (rating?: number): string => {
  if (!rating) return "";
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  return "★".repeat(fullStars) + (hasHalfStar ? "☆" : "");
};

const getCategoryConfig = (businessType?: string) => {
  return (
    ACTIVITY_CATEGORIES[businessType as keyof typeof ACTIVITY_CATEGORIES] || {
      icon: "📍",
      name: "Local Business",
      color: "#2196f3",
      description: "Local business",
      gradient: ["#2196f3", "#1976d2"],
    }
  );
};

const ActivityItem = memo(({ item, onPress }: ActivityItemProps) => {
  const isYelpBusiness = item.businessType && item.businessType !== "news";
  const categoryConfig = getCategoryConfig(item.businessType);

  return (
    <TouchableOpacity
      style={[styles.enhancedActivityCard]}
      onPress={() => onPress(item.url, item.title)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.activityImage}
            onError={() => console.log("Failed to load image:", item.imageUrl)}
          />
        ) : (
          <View
            style={[
              styles.placeholderImage,
              { backgroundColor: categoryConfig.color + "20" },
            ]}
          >
            <MaterialIcons
              name={getBusinessIcon(item.businessType)}
              size={48}
              color={categoryConfig.color}
            />
          </View>
        )}

        {isYelpBusiness && (
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: categoryConfig.color },
            ]}
          >
            <Text style={styles.categoryBadgeText}>
              {categoryConfig.icon} {categoryConfig.name.toUpperCase()}
            </Text>
          </View>
        )}

        {item.rating && (
          <View style={styles.ratingBadge}>
            <MaterialIcons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingBadgeText}>{item.rating}</Text>
          </View>
        )}
      </View>

      <View style={styles.activityContent}>
        <Text
          style={[
            styles.activityTitle,
            { color: isYelpBusiness ? categoryConfig.color : "#333" },
          ]}
          numberOfLines={2}
        >
          {item.title.replace(/^[🍴🏛️🎯📍🛍️🌃💆‍♀️🚢🏪]\s*/, "")}
        </Text>

        {isYelpBusiness && item.rating && (
          <View style={styles.ratingContainer}>
            <Text style={[styles.ratingStars, { color: categoryConfig.color }]}>
              {getRatingStars(item.rating)}
            </Text>
            <Text style={styles.ratingNumber}>{item.rating}</Text>
            <Text style={styles.reviewCount}>
              ({item.businessData?.reviewCount || 0} reviews)
            </Text>
            {item.priceLevel && (
              <Text style={styles.priceLevel}>{item.priceLevel}</Text>
            )}
          </View>
        )}

        {item.categories && item.categories.length > 0 && (
          <View style={styles.categoriesContainer}>
            <MaterialIcons
              name="local-offer"
              size={14}
              color={categoryConfig.color}
            />
            <Text
              style={[styles.categoriesText, { color: categoryConfig.color }]}
              numberOfLines={1}
            >
              {item.categories.slice(0, 3).join(" • ")}
            </Text>
          </View>
        )}

        <Text style={styles.activityDescription} numberOfLines={3}>
          {item.description}
        </Text>

        {item.address && (
          <View style={styles.addressContainer}>
            <MaterialIcons
              name="location-on"
              size={14}
              color={categoryConfig.color}
            />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.address}
            </Text>
            {item.businessData?.area && (
              <Text style={styles.areaTag}>{item.businessData.area}</Text>
            )}
          </View>
        )}

        <View style={styles.activityFooter}>
          <View style={styles.sourceContainer}>
            <MaterialIcons name="verified" size={12} color="#4caf50" />
            <Text style={styles.sourceText}>Verified • Yelp</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: categoryConfig.color },
            ]}
            onPress={() => onPress(item.url, item.title)}
          >
            <MaterialIcons name="directions" size={14} color="white" />
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const CategoryFilter = memo(
  ({
    selectedCategory,
    onCategorySelect,
    categoryBreakdown,
    totalItems,
  }: {
    selectedCategory: string | null;
    onCategorySelect: (category: string | null) => void;
    categoryBreakdown: { [key: string]: number };
    totalItems: number;
  }) => (
    <View style={styles.categoryFilterSection}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScrollContainer}
      >
        <TouchableOpacity
          style={[
            styles.categoryFilterChip,
            selectedCategory === null && styles.selectedCategoryChip,
          ]}
          onPress={() => onCategorySelect(null)}
        >
          <Text style={styles.categoryFilterEmoji}>🌟</Text>
          <Text
            style={[
              styles.categoryFilterName,
              selectedCategory === null && styles.selectedCategoryText,
            ]}
          >
            All Activities
          </Text>
          <View style={styles.categoryCountBadge}>
            <Text style={styles.categoryCountText}>{totalItems}</Text>
          </View>
        </TouchableOpacity>

        {Object.entries(ACTIVITY_CATEGORIES).map(([key, config]) => {
          const count = categoryBreakdown[key] || 0;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.categoryFilterChip,
                selectedCategory === key && styles.selectedCategoryChip,
                selectedCategory === key && { borderColor: config.color },
              ]}
              onPress={() =>
                onCategorySelect(selectedCategory === key ? null : key)
              }
            >
              <Text style={styles.categoryFilterEmoji}>{config.icon}</Text>
              <Text
                style={[
                  styles.categoryFilterName,
                  selectedCategory === key && styles.selectedCategoryText,
                  selectedCategory === key && { color: config.color },
                ]}
              >
                {config.name}
              </Text>
              <Text style={styles.categoryFilterDesc}>
                {config.description}
              </Text>
              <View
                style={[
                  styles.categoryCountBadge,
                  { backgroundColor: config.color },
                ]}
              >
                <Text style={styles.categoryCountText}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  )
);

export default function ActivitiesFeed() {
  const [allContent, setAllContent] = useState<Activity[]>([]);
  const [filteredContent, setFilteredContent] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<{
    [key: string]: number;
  }>({});

  const loadContent = useCallback(async (isRefresh: boolean = false) => {
    try {
      console.log(`[HK Local Guide] 🚀 Loading all content without tabs`);

      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);

      const [travelContent, localContent] = await Promise.allSettled([
        fetchTravelActivities(),
        fetchLocalActivities("hk", "general"),
      ]);

      const combinedContent: Activity[] = [];

      if (travelContent.status === "fulfilled") {
        const activities = travelContent.value || [];
        combinedContent.push(...activities);
        console.log(`[HK Local Guide] ✅ Travel: ${activities.length} items`);
      } else {
        console.error(
          "[HK Local Guide] ❌ Travel content failed:",
          travelContent.reason
        );
      }

      if (localContent.status === "fulfilled") {
        const activities = localContent.value || [];
        combinedContent.push(...activities);
        console.log(`[HK Local Guide] ✅ Local: ${activities.length} items`);
      } else {
        console.error(
          "[HK Local Guide] ❌ Local content failed:",
          localContent.reason
        );
      }

      const uniqueContent = combinedContent.filter(
        (item, index, self) => index === self.findIndex((t) => t.id === item.id)
      );

      setAllContent(uniqueContent);
      updateCategoryBreakdown(uniqueContent);

      console.log(
        `[HK Local Guide] ✅ Combined: ${uniqueContent.length} unique items`
      );
    } catch (error: any) {
      console.error("[HK Local Guide] ❌ Error:", error);
      setError("Failed to load Hong Kong activity guide");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCategoryBreakdown = (activities: Activity[]) => {
    const breakdown: { [key: string]: number } = {};

    activities.forEach((activity) => {
      const type = activity.businessType || "other";
      breakdown[type] = (breakdown[type] || 0) + 1;
    });

    setCategoryBreakdown(breakdown);
  };

  const handleCategorySelect = useCallback((category: string | null) => {
    setSelectedCategory(category);
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      const filtered = allContent.filter(
        (item) => item.businessType === selectedCategory
      );
      setFilteredContent(filtered);
    } else {
      setFilteredContent(allContent);
    }
  }, [selectedCategory, allContent]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await activitiesCacheService.clearAllCache();
      await loadContent(true);
    } catch (error) {
      console.error("[HK Local Guide] Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [loadContent]);

  const handleRetry = useCallback(async () => {
    await loadContent(false);
  }, [loadContent]);

  const openContent = useCallback(async (url: string, title: string) => {
    try {
      if (url === "#") {
        Alert.alert(
          "Hong Kong Activity Info",
          "This is local Hong Kong activity information. Pull down to refresh for more content.",
          [{ text: "OK" }]
        );
        return;
      }

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open this content.");
      }
    } catch (error) {
      console.error("Error opening content:", error);
      Alert.alert("Error", "Failed to open content.");
    }
  }, []);

  useEffect(() => {
    loadContent(false);
  }, []);

  const renderContent = useCallback(
    ({ item }: { item: Activity }) => (
      <ActivityItem item={item} onPress={openContent} />
    ),
    [openContent]
  );

  const keyExtractor = useCallback((item: Activity) => item.id, []);

  const totalItems = allContent.length;

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredContent}
        renderItem={renderContent}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#007bff"]}
            tintColor="#007bff"
            title="Pull to refresh Hong Kong activities"
          />
        }
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          !loading && filteredContent.length === 0 ? null : (
            <View>
              <CategoryFilter
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategorySelect}
                categoryBreakdown={categoryBreakdown}
                totalItems={totalItems}
              />
            </View>
          )
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loading ? (
              <>
                <ActivityIndicator
                  size="large"
                  color="#007bff"
                  style={{ marginBottom: 15 }}
                />
                <Text style={styles.emptyTitle}>
                  Loading Hong Kong activities...
                </Text>
                <Text style={styles.emptySubtitle}>
                  Fetching the best activities, dining, and attractions from
                  local sources
                </Text>
              </>
            ) : error ? (
              <>
                <MaterialIcons name="error-outline" size={64} color="#ff6b6b" />
                <Text style={styles.emptyTitle}>Failed to load content</Text>
                <Text style={styles.emptySubtitle}>{error}</Text>
                <TouchableOpacity
                  onPress={handleRetry}
                  style={styles.retryButtonLarge}
                >
                  <Text style={styles.retryButtonLargeText}>Try Again</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <MaterialIcons name="explore-off" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>No activities available</Text>
                <Text style={styles.emptySubtitle}>
                  No{" "}
                  {selectedCategory
                    ? getCategoryConfig(selectedCategory).name.toLowerCase()
                    : "activities"}{" "}
                  content found. Pull down to refresh.
                </Text>
                <TouchableOpacity
                  onPress={handleRefresh}
                  style={styles.retryButtonLarge}
                >
                  <Text style={styles.retryButtonLargeText}>Refresh</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        windowSize={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },
  retryButton: {
    backgroundColor: "#f44336",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  categoryStat: {
    alignItems: "center",
    width: "22%",
    marginBottom: 16,
  },
  categoryFilterSection: {
    marginBottom: 24,
  },
  categoryScrollContainer: {
    paddingHorizontal: 8,
  },
  categoryFilterChip: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 140,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  selectedCategoryChip: {
    borderColor: "#007bff",
    backgroundColor: "#f8f9ff",
  },
  categoryFilterEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  categoryFilterName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
    color: "#333",
  },
  selectedCategoryText: {
    color: "#007bff",
  },
  categoryFilterDesc: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    lineHeight: 12,
    marginBottom: 8,
  },
  categoryCountBadge: {
    backgroundColor: "#007bff",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryCountText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  enhancedActivityCard: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  imageContainer: {
    position: "relative",
    height: 200,
  },
  activityImage: {
    width: "100%",
    height: 200,
  },
  placeholderImage: {
    width: "100%",
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
  ratingBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  ratingBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  activityContent: {
    padding: 16,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    lineHeight: 24,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  ratingStars: {
    fontSize: 14,
    marginRight: 4,
  },
  ratingNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: "#666",
    marginRight: 8,
  },
  priceLevel: {
    fontSize: 12,
    color: "#4caf50",
    fontWeight: "600",
    backgroundColor: "#e8f5e8",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoriesContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  categoriesText: {
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
    fontWeight: "500",
  },
  activityDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  addressText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
    flex: 1,
  },
  areaTag: {
    fontSize: 10,
    color: "#007bff",
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  activityFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sourceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sourceText: {
    fontSize: 12,
    color: "#4caf50",
    marginLeft: 4,
    fontWeight: "500",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  actionButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButtonLarge: {
    backgroundColor: "#007bff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonLargeText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
