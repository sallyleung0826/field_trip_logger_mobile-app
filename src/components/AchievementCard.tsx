import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Achievement, AchievementRarity } from "../lib/types/achievement";

const { width } = Dimensions.get("window");

interface AchievementCardProps {
  achievement: Achievement;
  onPress?: (achievement: Achievement) => void;
  compact?: boolean;
}

const RARITY_COLORS = {
  [AchievementRarity.COMMON]: {
    background: "#f0f9ff",
    border: "#0ea5e9",
    text: "#0369a1",
    gradient: ["#0ea5e9", "#0284c7"],
  },
  [AchievementRarity.UNCOMMON]: {
    background: "#f0fdf4",
    border: "#22c55e",
    text: "#15803d",
    gradient: ["#22c55e", "#16a34a"],
  },
  [AchievementRarity.RARE]: {
    background: "#fefce8",
    border: "#eab308",
    text: "#a16207",
    gradient: ["#eab308", "#ca8a04"],
  },
  [AchievementRarity.EPIC]: {
    background: "#fdf4ff",
    border: "#d946ef",
    text: "#a21caf",
    gradient: ["#d946ef", "#c026d3"],
  },
  [AchievementRarity.LEGENDARY]: {
    background: "#fdf2f8",
    border: "#f97316",
    text: "#ea580c",
    gradient: ["#f97316", "#dc2626"],
  },
};

export default function AchievementCard({
  achievement,
  onPress,
  compact = false,
}: AchievementCardProps) {
  const rarityStyle = RARITY_COLORS[achievement.rarity];
  const progress = (achievement.current / achievement.target) * 100;
  const isUnlocked = achievement.unlocked;

  const handlePress = () => {
    if (onPress) {
      onPress(achievement);
    }
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactCard,
          {
            backgroundColor: isUnlocked ? rarityStyle.background : "#f8f9fa",
            borderColor: isUnlocked ? rarityStyle.border : "#e9ecef",
            opacity: isUnlocked ? 1 : 0.7,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.compactContent}>
          <View
            style={[
              styles.compactIcon,
              {
                backgroundColor: isUnlocked ? rarityStyle.border : "#6c757d",
              },
            ]}
          >
            <Text style={styles.compactIconText}>{achievement.icon}</Text>
          </View>
          <View style={styles.compactDetails}>
            <Text
              style={[
                styles.compactTitle,
                { color: isUnlocked ? rarityStyle.text : "#6c757d" },
              ]}
              numberOfLines={1}
            >
              {achievement.title}
            </Text>
            <Text style={styles.compactProgress}>
              {achievement.current}/{achievement.target}
            </Text>
          </View>
        </View>
        {isUnlocked && (
          <MaterialIcons
            name="check-circle"
            size={16}
            color={rarityStyle.border}
            style={styles.compactCheck}
          />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isUnlocked ? rarityStyle.background : "#f8f9fa",
          borderColor: isUnlocked ? rarityStyle.border : "#e9ecef",
          opacity: isUnlocked ? 1 : 0.8,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isUnlocked ? rarityStyle.border : "#6c757d",
            },
          ]}
        >
          <Text style={styles.icon}>{achievement.icon}</Text>
        </View>

        <View style={styles.headerInfo}>
          <Text
            style={[
              styles.title,
              { color: isUnlocked ? rarityStyle.text : "#6c757d" },
            ]}
            numberOfLines={1}
          >
            {achievement.title}
          </Text>
          <Text style={styles.rarity}>
            {achievement.rarity} • {achievement.points} pts
          </Text>
        </View>

        {isUnlocked && (
          <MaterialIcons
            name="check-circle"
            size={24}
            color={rarityStyle.border}
          />
        )}
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {achievement.description}
      </Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {achievement.current} / {achievement.target}
          </Text>
          <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: isUnlocked ? rarityStyle.border : "#007bff",
              },
            ]}
          />
        </View>
      </View>

      {isUnlocked && achievement.unlockedDate && (
        <Text style={styles.unlockedDate}>
          Unlocked on {new Date(achievement.unlockedDate).toLocaleDateString()}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactCard: {
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginRight: 12,
    width: width * 0.4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  rarity: {
    fontSize: 12,
    color: "#6c757d",
    textTransform: "capitalize",
  },
  description: {
    fontSize: 14,
    color: "#6c757d",
    lineHeight: 20,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  progressPercentage: {
    fontSize: 12,
    color: "#6c757d",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#e9ecef",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  unlockedDate: {
    fontSize: 12,
    color: "#6c757d",
    fontStyle: "italic",
    marginTop: 8,
  },
  compactContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  compactIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  compactIconText: {
    fontSize: 16,
  },
  compactDetails: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  compactProgress: {
    fontSize: 12,
    color: "#6c757d",
  },
  compactCheck: {
    position: "absolute",
    top: 8,
    right: 8,
  },
});
