import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  authenticateWithBiometric,
  checkBiometricSupport,
  isBiometricEnabled,
  promptForBiometricSetup,
} from "../utils/auth";
import { login } from "../firebase/auth";
import { styles } from "../styles";

export default function LoginScreen({ navigation }: any) {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState("Biometric");
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const support = await checkBiometricSupport();
      const enabled = await isBiometricEnabled();

      setBiometricAvailable(support.isAvailable);
      setBiometricType(support.biometricType);
      setBiometricEnabled(enabled);

      console.log("[Login] Biometric available:", support.isAvailable);
      console.log("[Login] Biometric type:", support.biometricType);
      console.log("[Login] Biometric enabled:", enabled);
    } catch (error) {
      console.error("[Login] Error checking biometric:", error);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!email || !password) {
      Alert.alert(
        "Missing Information",
        "Please enter both email and password to proceed."
      );
      return;
    }

    try {
      setIsLoading(true);

      await login(email, password);

      if (biometricAvailable && !biometricEnabled) {
        Alert.alert(
          "Enable Biometric Authentication?",
          "Would you like to use biometric authentication for quick login next time?",
          [
            { text: "Not Now", style: "cancel" },
            {
              text: "Enable",
              onPress: async () => {
                const setupSuccess = await promptForBiometricSetup(
                  email,
                  password
                );
                if (setupSuccess) {
                  Alert.alert(
                    "Success!",
                    "Biometric authentication has been enabled for quick login."
                  );
                  setBiometricEnabled(true);
                }
              },
            },
          ]
        );
      }
    } catch (error: any) {
      let errorMessage = "Login failed. Please try again.";
      let errorTitle = "Login Failed";

      switch (error.code) {
        case "auth/user-not-found":
          errorTitle = "Account Not Found";
          errorMessage =
            "No account is registered with this email. Would you like to create a new account?";
          Alert.alert(errorTitle, errorMessage, [
            { text: "Cancel", style: "cancel" },
            {
              text: "Create Account",
              onPress: () => navigation.navigate("CreateAccount"),
            },
          ]);
          return;
        case "auth/wrong-password":
          errorTitle = "Incorrect Password";
          errorMessage =
            "The password you entered is incorrect. Please try again.";
          break;
        case "auth/invalid-email":
          errorTitle = "Invalid Email";
          errorMessage = "Please enter a valid email address.";
          break;
        case "auth/too-many-requests":
          errorTitle = "Too Many Attempts";
          errorMessage =
            "Too many failed login attempts. Please try again later.";
          break;
        default:
          errorMessage = error.message || errorMessage;
      }

      Alert.alert(errorTitle, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricAvailable) {
      Alert.alert(
        "Not Available",
        "Biometric authentication is not available on this device."
      );
      return;
    }

    if (!biometricEnabled) {
      Alert.alert(
        "Not Enabled",
        "Biometric authentication is not enabled. Please log in with your password first to enable it."
      );
      return;
    }

    try {
      setIsLoading(true);
      console.log("[Login] Starting biometric login");

      const result = await authenticateWithBiometric();

      if (result.success) {
        console.log("[Login] Biometric login successful");
      } else {
        console.log("[Login] Biometric login failed:", result.error);
        Alert.alert(
          "Authentication Failed",
          result.error || "Biometric authentication failed. Please try again."
        );
      }
    } catch (error) {
      console.error("[Login] Biometric login error:", error);
      Alert.alert(
        "Error",
        "An error occurred during biometric authentication. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
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
        <SafeAreaView style={{ flex: 1 }}>
          <TouchableOpacity
            style={{
              position: "absolute",
              top: Platform.OS === "ios" ? 60 : 40,
              left: 20,
              zIndex: 10,
              backgroundColor: "rgba(0,0,0,0.3)",
              borderRadius: 20,
              padding: 8,
            }}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidContainer}
          >
            <ScrollView
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.loginOverlay}>
                <View style={styles.logoContainer}>
                  <View style={styles.iconContainer}>
                    <MaterialIcons name="login" size={60} color="#fff" />
                  </View>
                  <Text style={styles.mainTitle}>Welcome Back</Text>
                  <Text style={styles.subtitle}>
                    Sign in to continue your field trip adventures
                  </Text>
                </View>

                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons
                      name="email"
                      size={20}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      placeholder="Email Address"
                      style={styles.inputWithIcon}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholderTextColor="#999"
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <MaterialIcons
                      name="lock"
                      size={20}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      placeholder="Password"
                      style={styles.inputWithIcon}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      autoCapitalize="none"
                      placeholderTextColor="#999"
                    />
                    <TouchableOpacity
                      style={styles.passwordVisibilityToggle}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <MaterialIcons
                        name={showPassword ? "visibility-off" : "visibility"}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      {
                        opacity: isLoading || !email || !password ? 0.7 : 1,
                      },
                    ]}
                    onPress={handlePasswordSubmit}
                    disabled={isLoading || !email || !password}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="login" size={24} color="white" />
                    <Text style={styles.buttonText}>
                      {isLoading ? "Signing In..." : "Sign In"}
                    </Text>
                  </TouchableOpacity>

                  {biometricAvailable && biometricEnabled && (
                    <TouchableOpacity
                      style={[
                        styles.secondaryButton,
                        { opacity: isLoading ? 0.7 : 1 },
                      ]}
                      onPress={handleBiometricLogin}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons
                        name="fingerprint"
                        size={24}
                        color="#007bff"
                      />
                      <Text style={styles.secondaryButtonText}>
                        {isLoading ? "Authenticating..." : "Use Biometric"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.createAccountLink}
                  onPress={() => navigation.navigate("CreateAccount")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.createAccountText}>
                    Don't have an account? Create one here
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}
