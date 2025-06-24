import { MaterialIcons } from "@expo/vector-icons";

export interface WeatherOption {
  condition: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
}

export interface SelectedWeather {
  condition: string;
  description: string;
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
}

export const WEATHER_OPTIONS: WeatherOption[] = [
  {
    condition: "sunny",
    description: "Sunny",
    icon: "wb-sunny",
    color: "#FFD700",
  },
  {
    condition: "partly-cloudy",
    description: "Partly Cloudy",
    icon: "wb-cloudy",
    color: "#87CEEB",
  },
  {
    condition: "cloudy",
    description: "Cloudy",
    icon: "cloud",
    color: "#708090",
  },
  {
    condition: "overcast",
    description: "Overcast",
    icon: "cloud",
    color: "#696969",
  },
  {
    condition: "light-rain",
    description: "Light Rain",
    icon: "grain",
    color: "#4682B4",
  },
  {
    condition: "rain",
    description: "Rain",
    icon: "grain",
    color: "#1E90FF",
  },
  {
    condition: "heavy-rain",
    description: "Heavy Rain",
    icon: "grain",
    color: "#000080",
  },
  {
    condition: "thunderstorm",
    description: "Thunderstorm",
    icon: "flash-on",
    color: "#8A2BE2",
  },
  {
    condition: "drizzle",
    description: "Drizzle",
    icon: "grain",
    color: "#6495ED",
  },
  {
    condition: "snow",
    description: "Snow",
    icon: "ac-unit",
    color: "#B0E0E6",
  },
  {
    condition: "fog",
    description: "Fog",
    icon: "foggy",
    color: "#D3D3D3",
  },
  {
    condition: "windy",
    description: "Windy",
    icon: "air",
    color: "#20B2AA",
  },
];

export const getWeatherDescription = (condition: string): string => {
  const descriptions: { [key: string]: string } = {
    sunny: "Clear skies with bright sunshine",
    "partly-cloudy": "Mix of sun and clouds",
    cloudy: "Overcast with cloud cover",
    overcast: "Completely cloudy sky",
    "light-rain": "Light precipitation",
    rain: "Steady rainfall",
    "heavy-rain": "Intense precipitation",
    thunderstorm: "Rain with thunder and lightning",
    drizzle: "Very light rain",
    snow: "Snowfall",
    fog: "Reduced visibility due to fog",
    windy: "Strong wind conditions",
  };
  return descriptions[condition] || "Weather condition";
};

export const getWeatherIcon = (
  condition: string
): keyof typeof MaterialIcons.glyphMap => {
  const iconMap: { [key: string]: keyof typeof MaterialIcons.glyphMap } = {
    clear: "wb-sunny",
    clouds: "cloud",
    rain: "grain",
    snow: "ac-unit",
    thunderstorm: "flash-on",
    drizzle: "grain",
    mist: "foggy",
    fog: "foggy",
  };

  const icon = iconMap[condition.toLowerCase()] || "wb-cloudy";
  console.log("[Weather Widget] Weather icon for", condition, ":", icon);
  return icon;
};

export const getWeatherColor = (condition: string) => {
  const colorMap: { [key: string]: string } = {
    clear: "#FFD700",
    clouds: "#87CEEB",
    rain: "#4682B4",
    snow: "#B0E0E6",
    thunderstorm: "#8A2BE2",
    drizzle: "#4682B4",
    mist: "#D3D3D3",
    fog: "#D3D3D3",
  };

  const color = colorMap[condition.toLowerCase()] || "#87CEEB";
  console.log("[Weather Widget] Weather color for", condition, ":", color);
  return color;
};
