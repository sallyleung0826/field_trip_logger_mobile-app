import { StatusBar, View, Text, Platform } from "react-native";
import ArticleFeed from "../components/ArticleFeed";
import { styles } from "../styles";

const statusBarHeight =
  Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 24;

export default function NewsScreen() {
  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <View style={styles.simpleHeader}>
        <View>
          <Text style={styles.headerTitle}>📰 News & Articles</Text>
          <Text style={styles.headerSubtitle}>
            Stay updated with local news and travel articles
          </Text>
        </View>
      </View>

      <ArticleFeed />
    </View>
  );
}
