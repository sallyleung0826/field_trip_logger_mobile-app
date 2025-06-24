export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  type: AchievementType;
  target: number;
  current: number;
  unlocked: boolean;
  unlockedDate?: string;
  rarity: AchievementRarity;
  points: number;
  badge?: {
    color: string;
    gradient: string[];
  };
}

export enum AchievementCategory {
  EXPLORER = "EXPLORER",
  PHOTOGRAPHER = "PHOTOGRAPHER",
  WEATHER = "WEATHER",
  DISTANCE = "DISTANCE",
  QUALITY = "QUALITY",
  SPECIAL = "SPECIAL",
}

export enum AchievementType {
  TOTAL_TRIPS = "TOTAL_TRIPS",
  PHOTOS_TAKEN = "PHOTOS_TAKEN",
  AUDIO_RECORDED = "AUDIO_RECORDED",
  HIGH_RATINGS = "HIGH_RATINGS",
  DIFFERENT_LOCATIONS = "DIFFERENT_LOCATIONS",
  WEATHER_CONDITIONS = "WEATHER_CONDITIONS",
  TRIP_STREAK = "TRIP_STREAK",
  LONG_TRIPS = "LONG_TRIPS",
  COMPANION_TRIPS = "COMPANION_TRIPS",
  PERFECT_RATINGS = "PERFECT_RATINGS",
  EARLY_BIRD = "EARLY_BIRD",
  NIGHT_OWL = "NIGHT_OWL",
  SEASONS_COVERED = "SEASONS_COVERED",
}

export enum AchievementRarity {
  COMMON = "COMMON",
  UNCOMMON = "UNCOMMON",
  RARE = "RARE",
  EPIC = "EPIC",
  LEGENDARY = "LEGENDARY",
}

export interface AchievementProgress {
  category: AchievementCategory;
  achievements: Achievement[];
  categoryProgress: number; // 0-100
  nextAchievement?: Achievement;
}
