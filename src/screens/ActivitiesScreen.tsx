import { StatusBar, View, Text, Platform, SafeAreaView } from "react-native";
import ActivitiesFeed from "../components/ActivitiesFeed";
import { styles } from "../styles";

const statusBarHeight =
  Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 24;

export default function ActivitiesScreen() {
  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <View style={[styles.simpleHeader, { paddingTop: 30 }]}>
        <View>
          <Text style={styles.headerTitle}>🗺️ Hong Kong Local Guide</Text>
          <Text style={styles.headerSubtitle}>
            Discover activities, dining, attractions, and hidden gems with local
            insights
          </Text>
        </View>
      </View>

      <ActivitiesFeed />
    </SafeAreaView>
  );
}
