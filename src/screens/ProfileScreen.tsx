import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert,
  StyleSheet,
  Dimensions,
  Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { auth } from "../firebase/config";
import { signOut } from "firebase/auth";
import {
  calculateUserStats,
  getAchievementProgress,
} from "../firebase/firebaseService";
import { UserStats } from "../lib/types/trip";
import AchievementCard from "../components/AchievementCard";
import { OverallProgress } from "../components/ProgressBar";
import {
  Achievement,
  AchievementCategory,
  AchievementProgress,
} from "../lib/types/achievement";

const { width } = Dimensions.get("window");

export default function ProfileScreen({ navigation }: any) {
  const [userStats, setUserStats] = useState<UserStats>({
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

  const [achievementProgress, setAchievementProgress] = useState<
    AchievementProgress[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);
  const [achievementModalVisible, setAchievementModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "achievements">(
    "overview"
  );

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [stats, progress] = await Promise.all([
        calculateUserStats(),
        getAchievementProgress(),
      ]);

      setUserStats(stats);
      setAchievementProgress(progress);
    } catch (error) {
      console.error("Error loading user data:", error);
      Alert.alert("Error", "Failed to load user data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
          } catch (error) {
            console.error("Error signing out:", error);
            Alert.alert("Error", "Failed to sign out. Please try again.");
          }
        },
      },
    ]);
  };

  const handleAchievementPress = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setAchievementModalVisible(true);
  };

  const StatCard = ({
    icon,
    title,
    value,
    subtitle,
  }: {
    icon: string;
    title: string;
    value: string | number;
    subtitle?: string;
  }) => (
    <View style={styles.statCard}>
      <MaterialIcons name={icon as any} size={24} color="#007bff" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderRecentAchievements = () => {
    const recentUnlocked = achievementProgress
      .flatMap((category) => category.achievements)
      .filter((achievement) => achievement.unlocked)
      .sort((a, b) => {
        if (!a.unlockedDate || !b.unlockedDate) return 0;
        return (
          new Date(b.unlockedDate).getTime() -
          new Date(a.unlockedDate).getTime()
        );
      })
      .slice(0, 3);

    if (recentUnlocked.length === 0) {
      return (
        <View style={styles.emptyAchievements}>
          <MaterialIcons name="emoji-events" size={48} color="#ccc" />
          <Text style={styles.emptyAchievementsText}>
            Start your adventure to unlock achievements!
          </Text>
        </View>
      );
    }

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {recentUnlocked.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            onPress={handleAchievementPress}
            compact={true}
          />
        ))}
      </ScrollView>
    );
  };

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <OverallProgress
        totalPoints={userStats.achievementPoints}
        unlockedAchievements={userStats.unlockedAchievements}
        totalAchievements={achievementProgress.reduce(
          (sum, cat) => sum + cat.achievements.length,
          0
        )}
      />

      {/* Adventure Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Your Adventure Stats</Text>

        <View style={styles.statsGrid}>
          <StatCard
            icon="list"
            title="Total Trips"
            value={loading ? "..." : userStats.totalTrips}
          />
          <StatCard
            icon="star"
            title="Avg Rating"
            value={
              loading
                ? "..."
                : userStats.averageRating > 0
                ? userStats.averageRating.toFixed(1)
                : "—"
            }
            subtitle={`${userStats.totalRatings} ratings given`}
          />
          <StatCard
            icon="camera"
            title="Photos"
            value={loading ? "..." : userStats.photosTaken}
          />
          <StatCard
            icon="mic"
            title="Audio"
            value={loading ? "..." : userStats.audioRecorded}
          />
          <StatCard
            icon="place"
            title="Locations"
            value={loading ? "..." : userStats.uniqueLocations}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏆 Recent Achievements</Text>
          <TouchableOpacity
            onPress={() => setActiveTab("achievements")}
            style={styles.viewAllButton}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#007bff" />
          </TouchableOpacity>
        </View>
        {renderRecentAchievements()}
      </View>
    </ScrollView>
  );

  const renderAchievementsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {achievementProgress.map((category) => (
        <View key={category.category} style={styles.section}>
          <Text style={styles.sectionTitle}>
            {getCategoryIcon(category.category)}{" "}
            {category.category.toLowerCase().replace("_", " ")}
          </Text>
          {category.achievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              onPress={handleAchievementPress}
              compact={false}
            />
          ))}
        </View>
      ))}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );

  const getCategoryIcon = (category: AchievementCategory): string => {
    const icons = {
      [AchievementCategory.EXPLORER]: "🚀",
      [AchievementCategory.PHOTOGRAPHER]: "📷",
      [AchievementCategory.WEATHER]: "🌦️",
      [AchievementCategory.DISTANCE]: "🗺️",
      [AchievementCategory.QUALITY]: "⭐",
      [AchievementCategory.SPECIAL]: "✨",
    };
    return icons[category] || "🏆";
  };

  const renderAchievementModal = () => (
    <Modal
      visible={achievementModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setAchievementModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => setAchievementModalVisible(false)}
            style={styles.modalCloseButton}
          >
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Achievement Details</Text>
          <View style={styles.modalHeaderSpacer} />
        </View>

        {selectedAchievement && (
          <View style={styles.modalContent}>
            <AchievementCard
              achievement={selectedAchievement}
              compact={false}
            />

            <View style={styles.modalDetails}>
              <Text style={styles.modalDetailTitle}>Category</Text>
              <Text style={styles.modalDetailText}>
                {selectedAchievement.category.toLowerCase().replace("_", " ")}
              </Text>

              <Text style={styles.modalDetailTitle}>Rarity</Text>
              <Text style={styles.modalDetailText}>
                {selectedAchievement.rarity}
              </Text>

              <Text style={styles.modalDetailTitle}>Points Reward</Text>
              <Text style={styles.modalDetailText}>
                {selectedAchievement.points} points
              </Text>

              {selectedAchievement.unlocked &&
                selectedAchievement.unlockedDate && (
                  <>
                    <Text style={styles.modalDetailTitle}>Unlocked Date</Text>
                    <Text style={styles.modalDetailText}>
                      {new Date(
                        selectedAchievement.unlockedDate
                      ).toLocaleDateString()}
                    </Text>
                  </>
                )}
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>👤 Profile</Text>
          <Text style={styles.headerSubtitle}>
            {auth.currentUser?.email || "Field Trip Explorer"}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#d9534f" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "overview" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("overview")}
        >
          <MaterialIcons
            name="dashboard"
            size={20}
            color={activeTab === "overview" ? "#007bff" : "#6c757d"}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "overview" && styles.activeTabButtonText,
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "achievements" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("achievements")}
        >
          <MaterialIcons
            name="emoji-events"
            size={20}
            color={activeTab === "achievements" ? "#007bff" : "#6c757d"}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "achievements" && styles.activeTabButtonText,
            ]}
          >
            Achievements
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "overview" ? renderOverviewTab() : renderAchievementsTab()}

      {renderAchievementModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 15,
    backgroundColor: "#f5f5f5",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: "#f0f9ff",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6c757d",
    marginLeft: 8,
  },
  activeTabButtonText: {
    color: "#007bff",
  },
  tabContent: {
    flex: 1,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    color: "#007bff",
    marginRight: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    width: (width - 60) / 2,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  statSubtitle: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 2,
  },
  emptyAchievements: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyAchievementsText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
    textAlign: "center",
  },
  bottomPadding: {
    height: 80,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalHeaderSpacer: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalDetails: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalDetailTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  modalDetailText: {
    fontSize: 14,
    color: "#666",
    textTransform: "capitalize",
  },
});
