import { StatusBar, View, Text, Platform, SafeAreaView } from "react-native";
import ArticleFeed from "../components/ArticleFeed";
import { styles } from "../styles";

const statusBarHeight =
  Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 24;

export default function NewsScreen() {
  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <View style={[styles.simpleHeader, { paddingTop: 30 }]}>
        <View>
          <Text style={styles.headerTitle}>📰 News & Articles</Text>
          <Text style={styles.headerSubtitle}>
            Stay updated with local news and travel articles
          </Text>
        </View>
      </View>

      <ArticleFeed />
    </SafeAreaView>
  );
}
