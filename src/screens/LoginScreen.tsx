import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { biometricAuth } from "../utils/auth";
import { login } from "../firebase/auth";
import { styles } from "../styles";

export default function LoginScreen({ navigation }: any) {
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleBiometricLogin = async () => {
    try {
      setIsLoading(true);
      const success = await biometricAuth();
      if (success) {
        navigation.replace("MainTabs");
      } else {
        Alert.alert(
          "Authentication Failed",
          "Biometric authentication failed. Please try again or use your password.",
          [
            { text: "Try Again", onPress: handleBiometricLogin },
            { text: "Use Password", onPress: () => setShowPasswordInput(true) },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Biometric authentication is not available on this device."
      );
      setShowPasswordInput(true);
    } finally {
      setIsLoading(false);
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
      navigation.replace("MainTabs");
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

              <View style={styles.buttonContainer}>
                {!showPasswordInput ? (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        { opacity: isLoading ? 0.7 : 1 },
                      ]}
                      onPress={handleBiometricLogin}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons
                        name="fingerprint"
                        size={24}
                        color="white"
                      />
                      <Text style={styles.buttonText}>
                        {isLoading
                          ? "Authenticating..."
                          : "Login with Biometric"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => setShowPasswordInput(true)}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons
                        name="password"
                        size={24}
                        color="#007bff"
                      />
                      <Text style={styles.secondaryButtonText}>
                        Login with Password
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
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
                            name={
                              showPassword ? "visibility-off" : "visibility"
                            }
                            size={20}
                            color="#666"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

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

                    <TouchableOpacity
                      style={styles.backButtonAuth}
                      onPress={() => setShowPasswordInput(false)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="arrow-back" size={18} color="#fff" />
                      <Text style={styles.backButtonAuthText}>Back</Text>
                    </TouchableOpacity>
                  </>
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
      </ImageBackground>
    </SafeAreaView>
  );
}
