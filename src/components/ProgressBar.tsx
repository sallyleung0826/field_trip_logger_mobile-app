import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

interface ProgressBarProps {
  progress: number;
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  borderRadius?: number;
}

export default function ProgressBar({
  progress,
  height = 8,
  backgroundColor = "#e9ecef",
  fillColor = "#007bff",
  showLabel = false,
  label,
  animated = true,
  borderRadius = 4,
}: ProgressBarProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const clampedProgress = Math.max(0, Math.min(100, progress));

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: clampedProgress,
        duration: 800,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(clampedProgress);
    }
  }, [clampedProgress, animated]);

  const widthInterpolation = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label || `${Math.round(clampedProgress)}%`}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.progressBar,
          {
            height,
            backgroundColor,
            borderRadius,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: widthInterpolation,
              backgroundColor: fillColor,
              borderRadius,
            },
          ]}
        />
      </View>
    </View>
  );
}

interface CategoryProgressProps {
  categoryName: string;
  progress: number;
  unlockedCount: number;
  totalCount: number;
  color?: string;
}

export function CategoryProgress({
  categoryName,
  progress,
  unlockedCount,
  totalCount,
  color = "#007bff",
}: CategoryProgressProps) {
  return (
    <View style={styles.categoryContainer}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryName}>{categoryName}</Text>
        <Text style={styles.categoryCount}>
          {unlockedCount}/{totalCount}
        </Text>
      </View>

      <ProgressBar
        progress={progress}
        fillColor={color}
        height={6}
        animated={true}
      />

      <Text style={styles.categoryPercent}>
        {Math.round(progress)}% Complete
      </Text>
    </View>
  );
}

interface OverallProgressProps {
  totalPoints: number;
  unlockedAchievements: number;
  totalAchievements: number;
}

export function OverallProgress({
  totalPoints,
  unlockedAchievements,
  totalAchievements,
}: OverallProgressProps) {
  const overallProgress = (unlockedAchievements / totalAchievements) * 100;

  return (
    <View style={styles.overallContainer}>
      <View style={styles.overallHeader}>
        <Text style={styles.overallTitle}>Achievement Progress</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{unlockedAchievements}</Text>
          <Text style={styles.statLabel}>Unlocked</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalPoints}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.round(overallProgress)}%</Text>
          <Text style={styles.statLabel}>Complete</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  labelContainer: {
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  progressBar: {
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  categoryContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textTransform: "capitalize",
  },
  categoryCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6c757d",
  },
  categoryPercent: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 4,
    textAlign: "center",
  },
  overallContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  overallHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  overallTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007bff",
  },
  statLabel: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 4,
  },
});
