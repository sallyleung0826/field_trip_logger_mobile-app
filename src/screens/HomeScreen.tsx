import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { styles } from "../styles";

export default function HomeScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <ImageBackground
        source={require("../assets/background.jpeg")}
        style={styles.background}
        blurRadius={3}
      >
        <View style={styles.homeOverlay}>
          <View style={styles.logoContainer}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="hiking" size={60} color="#fff" />
            </View>
            <Text style={styles.mainTitle}>Field Trip Logger</Text>
            <Text style={styles.subtitle}>
              Document your outdoor adventures and explore amazing places
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.8}
            >
              <MaterialIcons name="login" size={24} color="white" />
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate("CreateAccount")}
              activeOpacity={0.8}
            >
              <MaterialIcons name="person-add" size={24} color="#007bff" />
              <Text style={styles.secondaryButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}
