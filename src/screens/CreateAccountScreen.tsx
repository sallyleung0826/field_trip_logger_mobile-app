import { useState } from "react";
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
import { createAccount } from "../firebase/auth";
import { styles } from "../styles";

export default function CreateAccountScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return { text: "Very Weak", color: "#ff4444" };
      case 2:
        return { text: "Weak", color: "#ff8800" };
      case 3:
        return { text: "Fair", color: "#ffbb00" };
      case 4:
        return { text: "Good", color: "#88cc00" };
      case 5:
        return { text: "Strong", color: "#00cc44" };
      default:
        return { text: "Very Weak", color: "#ff4444" };
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Missing Information", "Please fill in all required fields.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Password Mismatch",
        "The passwords you entered do not match. Please try again."
      );
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        "Weak Password",
        "Your password must be at least 8 characters long."
      );
      return;
    }

    if (!agreedToTerms) {
      Alert.alert(
        "Terms Required",
        "Please agree to the Terms of Service and Privacy Policy to continue."
      );
      return;
    }

    try {
      setIsLoading(true);
      await createAccount(email, password);

      Alert.alert(
        "🎉 Account Created Successfully!",
        "Welcome to Field Trip Logger! Your account has been created and you're ready to start documenting your adventures."
      );
    } catch (error: any) {
      let errorMessage = "Account creation failed. Please try again.";
      let errorTitle = "Registration Failed";

      switch (error.code) {
        case "auth/email-already-in-use":
          errorTitle = "Account Already Exists";
          errorMessage =
            "An account with this email already exists. Would you like to sign in instead?";
          Alert.alert(errorTitle, errorMessage, [
            { text: "Cancel", style: "cancel" },
            { text: "Sign In", onPress: () => navigation.navigate("Login") },
          ]);
          return;
        case "auth/invalid-email":
          errorTitle = "Invalid Email";
          errorMessage = "Please enter a valid email address.";
          break;
        case "auth/weak-password":
          errorTitle = "Weak Password";
          errorMessage =
            "Please choose a stronger password with at least 8 characters.";
          break;
        case "auth/network-request-failed":
          errorTitle = "Network Error";
          errorMessage = "Please check your internet connection and try again.";
          break;
        default:
          errorMessage = error.message || errorMessage;
      }

      Alert.alert(errorTitle, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthInfo = getPasswordStrengthText(passwordStrength);

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <ImageBackground
        source={require("../assets/background.jpeg")}
        style={{ flex: 1 }}
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
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
                paddingHorizontal: 20,
                paddingVertical: 40,
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.loginOverlay}>
                <View style={styles.logoContainer}>
                  <MaterialIcons name="person-add" size={48} color="#fff" />
                  <Text style={styles.mainTitle}>Create Account</Text>
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
                    {email.length > 0 && (
                      <MaterialIcons
                        name={
                          email.includes("@") && email.includes(".")
                            ? "check-circle"
                            : "error"
                        }
                        size={20}
                        color={
                          email.includes("@") && email.includes(".")
                            ? "#00cc44"
                            : "#ff4444"
                        }
                      />
                    )}
                  </View>

                  <View style={styles.inputWrapper}>
                    <MaterialIcons
                      name="lock"
                      size={20}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      placeholder="Password (8+ characters)"
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

                  {password.length > 0 && (
                    <View style={{ marginBottom: 15 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 5,
                        }}
                      >
                        <Text style={{ color: "#fff", fontSize: 12 }}>
                          Password Strength:
                        </Text>
                        <Text
                          style={{
                            color: strengthInfo.color,
                            fontSize: 12,
                            fontWeight: "600",
                          }}
                        >
                          {strengthInfo.text}
                        </Text>
                      </View>
                      <View
                        style={{
                          height: 4,
                          backgroundColor: "rgba(255,255,255,0.3)",
                          borderRadius: 2,
                        }}
                      >
                        <View
                          style={{
                            height: "100%",
                            width: `${(passwordStrength / 5) * 100}%`,
                            backgroundColor: strengthInfo.color,
                            borderRadius: 2,
                          }}
                        />
                      </View>
                    </View>
                  )}

                  <View style={styles.inputWrapper}>
                    <MaterialIcons
                      name="lock-outline"
                      size={20}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      placeholder="Confirm Password"
                      style={styles.inputWithIcon}
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      autoCapitalize="none"
                      placeholderTextColor="#999"
                    />
                    <TouchableOpacity
                      style={styles.passwordVisibilityToggle}
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      <MaterialIcons
                        name={
                          showConfirmPassword ? "visibility-off" : "visibility"
                        }
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                    {confirmPassword.length > 0 && (
                      <MaterialIcons
                        name={
                          password === confirmPassword
                            ? "check-circle"
                            : "error"
                        }
                        size={20}
                        color={
                          password === confirmPassword ? "#00cc44" : "#ff4444"
                        }
                        style={{ marginLeft: 5 }}
                      />
                    )}
                  </View>

                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 20,
                    }}
                    onPress={() => setAgreedToTerms(!agreedToTerms)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons
                      name={
                        agreedToTerms ? "check-box" : "check-box-outline-blank"
                      }
                      size={24}
                      color={agreedToTerms ? "#007bff" : "#ccc"}
                    />
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 12,
                        marginLeft: 10,
                        flex: 1,
                        lineHeight: 16,
                      }}
                    >
                      I agree to the Terms of Service and Privacy Policy
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      opacity:
                        isLoading ||
                        !email ||
                        !password ||
                        !confirmPassword ||
                        !agreedToTerms
                          ? 0.7
                          : 1,
                    },
                  ]}
                  onPress={handleRegister}
                  disabled={
                    isLoading ||
                    !email ||
                    !password ||
                    !confirmPassword ||
                    !agreedToTerms
                  }
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="person-add" size={24} color="white" />
                  <Text style={styles.buttonText}>
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.createAccountLink}
                  onPress={() => navigation.navigate("Login")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.createAccountText}>
                    Already have an account? Sign in here
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
