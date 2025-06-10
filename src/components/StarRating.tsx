import { View, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
  color?: string;
}

export default function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = 24,
  color = "#FFD700",
}: StarRatingProps) {
  const handleStarPress = (selectedRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(selectedRating);
    }
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => handleStarPress(star)}
          disabled={readonly}
          style={{ padding: 2 }}
        >
          <MaterialIcons
            name={star <= rating ? "star" : "star-border"}
            size={size}
            color={star <= rating ? color : "#ccc"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}
