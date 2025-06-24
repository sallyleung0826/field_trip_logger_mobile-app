import { Dimensions, StyleSheet, Platform, StatusBar } from "react-native";

const { width, height } = Dimensions.get("window");

const isIphoneX = () => {
  const dimen = Dimensions.get("window");
  return (
    Platform.OS === "ios" &&
    (dimen.height === 780 ||
      dimen.width === 780 ||
      dimen.height === 812 ||
      dimen.width === 812 ||
      dimen.height === 844 ||
      dimen.width === 844 ||
      dimen.height === 896 ||
      dimen.width === 896 ||
      dimen.height === 926 ||
      dimen.width === 926 ||
      dimen.height === 932 ||
      dimen.width === 932 ||
      dimen.height === 956 ||
      dimen.width === 956)
  );
};

const statusBarHeight =
  Platform.OS === "ios"
    ? isIphoneX()
      ? 59
      : 20
    : StatusBar.currentHeight || 0;

export const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  safeAreaContent: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  screenContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: Platform.OS === "android" ? statusBarHeight : 0,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    paddingTop: Platform.OS === "android" ? statusBarHeight + 20 : 20,
  },

  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? statusBarHeight : 0,
    backgroundColor: "#f5f5f5",
  },
  homeOverlay: {
    backgroundColor: "rgba(0,0,0,0.6)",
    width: width * 0.9,
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    marginTop: Platform.OS === "android" ? 20 : 0,
    marginBottom: 40,
  },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 30,
    borderRadius: 12,
    width: "80%",
  },
  loginOverlay: {
    backgroundColor: "rgba(0,0,0,0.6)",
    width: width * 0.9,
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },

  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? statusBarHeight + 10 : 50,
    paddingBottom: 15,
    backgroundColor: "#f5f5f5",
  },
  simpleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? (isIphoneX() ? 25 : 15) : 15,
    paddingBottom: 15,
    backgroundColor: "#f5f5f5",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  headerActions: {
    marginLeft: 12,
  },

  professionalHeader: {
    backgroundColor: "#1a365d",
    paddingTop: statusBarHeight + 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  professionalHeaderTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    marginBottom: 2,
  },
  professionalHeaderSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  iconContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 50,
    padding: 20,
    marginBottom: 15,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
    marginHorizontal: 20,
    marginTop: 10,
  },

  buttonContainer: {
    width: "100%",
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: "#007bff",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#007bff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#007bff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  secondaryButtonText: {
    color: "#007bff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  buttonWrapper: {
    marginVertical: 8,
    width: 200,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  addButton: {
    padding: 10,
    backgroundColor: "#eff6ff",
    borderRadius: 12,
  },
  helpButton: {
    padding: 8,
  },

  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 15,
    borderRadius: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputWithIcon: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  passwordVisibilityToggle: {
    padding: 10,
  },

  authMethodContainer: {
    width: "100%",
  },
  createAccountLink: {
    marginTop: 20,
  },
  createAccountText: {
    color: "#fff",
    textDecorationLine: "underline",
    fontSize: 16,
    textAlign: "center",
  },
  backButtonAuth: {
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  backButtonAuthText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 5,
    fontWeight: "600",
  },

  keyboardAvoidContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? (isIphoneX() ? 44 : 34) : 20,
    backgroundColor: "transparent",
  },

  sectionContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    margin: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
  },
  sectionOptional: {
    fontSize: 12,
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },

  progressContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: 4,
    backgroundColor: "#007bff",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },

  statusBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadgeText: {
    fontSize: 12,
    color: "white",
    fontWeight: "600",
  },

  tripCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  tripCardImage: {
    width: 100,
    height: 120,
    resizeMode: "cover",
  },
  tripCardImagePlaceholder: {
    width: 100,
    height: 120,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  tripCardContent: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  tripCardLocation: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  tripCardDescription: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 18,
    marginBottom: 8,
  },
  tripCardRating: {
    marginBottom: 8,
  },
  tripCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tripCardIcons: {
    flexDirection: "row",
    gap: 8,
  },
  tripCardTime: {
    fontSize: 12,
    color: "#94a3b8",
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 12,
    color: "#666",
  },

  calendarContainer: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  calendar: {
    paddingVertical: 10,
  },
  selectedDateContainer: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  selectedDateSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },

  dateCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dateContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 16,
    color: "#1e293b",
    marginLeft: 12,
    fontWeight: "500",
  },

  locationCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  locationAddress: {
    fontSize: 16,
    color: "#1e293b",
    lineHeight: 24,
    marginBottom: 12,
  },
  locationActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  changeLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  changeLocationText: {
    color: "#007bff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  useCurrentButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 8,
  },
  useCurrentText: {
    color: "#007bff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },

  actionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionCardContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 2,
  },
  actionCardSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },

  mediaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mediaItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  mediaLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 8,
  },
  mediaPreview: {
    position: "relative",
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  mediaImage: {
    width: "100%",
    height: 120,
  },
  mediaRemoveButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaPlaceholder: {
    backgroundColor: "white",
    borderRadius: 12,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
  },
  mediaPlaceholderText: {
    color: "#007bff",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },

  audioPreview: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    height: 120,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  audioPreviewText: {
    color: "#28a745",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
    marginBottom: 8,
  },
  audioActions: {
    flexDirection: "row",
  },
  audioActionButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  recordButton: {
    backgroundColor: "#28a745",
    borderRadius: 12,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  recordButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  playAudioButton: {
    flexDirection: "row",
    backgroundColor: "#28a745",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    shadowColor: "#28a745",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  playAudioButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },

  descriptionInput: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 100,
    textAlignVertical: "top",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  starButton: {
    padding: 5,
  },
  ratingLabel: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  ratingCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  ratingCardText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    textAlign: "center",
  },

  bottomActions: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButton: {
    backgroundColor: "#007bff",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#007bff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: statusBarHeight + 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "white",
  },
  modalHeaderButton: {
    padding: 8,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    maxHeight: height * 0.85,
  },

  photoModal: {
    backgroundColor: "white",
    borderRadius: 20,
    margin: 20,
    overflow: "hidden",
    width: width * 0.9,
  },
  photoModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  photoModalCloseButton: {
    padding: 4,
  },
  photoOptions: {
    flexDirection: "row",
    padding: 20,
  },
  photoOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 20,
    marginHorizontal: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
  },
  photoOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  photoOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  photoOptionSubtext: {
    fontSize: 12,
    color: "#64748b",
  },

  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    width: width * 0.8,
    maxWidth: 300,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
  },
  loadingProgressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    overflow: "hidden",
  },
  loadingProgressFill: {
    width: "100%",
    height: "100%",
    backgroundColor: "#007bff",
    borderRadius: 2,
  },

  tripDetailImage: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  tripDetailImagePlaceholder: {
    width: "100%",
    height: 300,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  tripDetailImagePlaceholderText: {
    color: "#94a3b8",
    marginTop: 10,
    fontSize: 16,
  },
  quickInfoContainer: {
    flexDirection: "row",
    padding: 20,
    paddingBottom: 10,
    gap: 12,
  },
  quickInfoCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  quickInfoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  quickInfoContent: {
    flex: 1,
  },
  quickInfoLabel: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 2,
    textTransform: "uppercase",
    fontWeight: "500",
  },
  quickInfoValue: {
    fontSize: 13,
    color: "#1e293b",
    fontWeight: "600",
  },
  tripDetailSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tripDetailSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  tripDetailSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 12,
  },
  tripDetailSectionContent: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  tripDetailRatingContainer: {
    alignItems: "flex-start",
  },
  tripDetailRatingText: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 8,
  },

  weatherDetailContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
  },
  weatherMainCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  weatherMainInfo: {
    flex: 1,
  },
  weatherTemperature: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  weatherCondition: {
    fontSize: 16,
    color: "#64748b",
    textTransform: "capitalize",
  },
  weatherDetailsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  weatherDetailItem: {
    alignItems: "center",
    flex: 1,
  },
  weatherDetailLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    marginBottom: 2,
  },
  weatherDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },

  metadataContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
  },
  metadataItem: {
    marginBottom: 12,
  },
  metadataLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
    textTransform: "uppercase",
    fontWeight: "500",
  },
  metadataValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "500",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  enhancedEmptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    margin: 20,
  },
  emptyStateIcon: {
    marginBottom: 15,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyStateText: {
    textAlign: "center",
    color: "#888",
    marginTop: 20,
    fontSize: 16,
  },

  createTripButton: {
    flexDirection: "row",
    backgroundColor: "#007bff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#007bff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  createTripButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },

  tripsList: {
    flex: 1,
  },
  tripsListContent: {
    paddingBottom: Platform.OS === "ios" ? 100 : 80,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  loadingContainerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingTextCenter: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 12,
  },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    marginHorizontal: 20,
    marginBottom: 15,
    marginTop: 10,
    borderRadius: 10,
    padding: 5,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#007bff",
  },

  weatherContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    margin: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weatherHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  weatherIcon: {
    width: 50,
    height: 50,
  },
  weatherInfo: {
    flex: 1,
    marginLeft: 15,
  },
  weatherTemp: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  weatherDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  weatherDetailItemWidget: {
    alignItems: "center",
  },
  weatherDetailLabelWidget: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  weatherDetailValueWidget: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },

  articleContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    margin: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  articleHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  articleHeaderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  articleTabContainer: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  articleTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeArticleTab: {
    backgroundColor: "#007bff",
  },
  articleTabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  activeArticleTabText: {
    color: "white",
  },
  articleCard: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "flex-start",
  },
  articleImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  articleContent: {
    flex: 1,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  articleDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  articleMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  articleSource: {
    fontSize: 12,
    color: "#007bff",
    fontWeight: "600",
  },
  articleDate: {
    fontSize: 12,
    color: "#999",
  },

  locationRatingCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    marginHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  locationRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  locationRatingCount: {
    marginLeft: 10,
    fontSize: 12,
    color: "#666",
  },
  locationCoords: {
    fontSize: 12,
    color: "#999",
  },

  bottomPadding: {
    height: Platform.OS === "ios" ? (isIphoneX() ? 44 : 20) : 20,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffebee",
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: "#d32f2f",
    marginLeft: 8,
  },
  retryButton: {
    backgroundColor: "#f44336",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  retryButtonLarge: {
    backgroundColor: "#007bff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonLargeText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  headerInfo: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subHeaderText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  cacheIndicator: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },

  enhancedTripCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 15,
    marginHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  tripCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    paddingBottom: 10,
  },

  weatherSection: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
  },
  weatherSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  weatherSectionContent: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },

  tripDetailsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tripDetailsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },

  deleteButton: {
    backgroundColor: "#d9534f",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    margin: 20,
    borderRadius: 10,
    marginBottom: Platform.OS === "ios" ? 34 : 20,
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 10,
  },

  tripScreenContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  tripScreenTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    marginTop: Platform.OS === "android" ? statusBarHeight : 0,
  },
  tripScreenSection: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripScreenSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  tripScreenPlaceholder: {
    color: "#888",
    textAlign: "center",
    marginBottom: 10,
  },

  mainScreenContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  mainScreenContent: {
    flex: 1,
    paddingBottom: Platform.OS === "ios" ? 90 : 70,
  },

  enhancedModalContainer: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: Platform.OS === "android" ? statusBarHeight : 0,
  },
  modalScrollContent: {
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },

  showMoreButton: {
    alignSelf: "flex-end",
    backgroundColor: "#007bff",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  showMoreButtonText: {
    color: "white",
    fontWeight: "bold",
  },

  closeButton: {
    backgroundColor: "#6c757d",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  logoutButton: {
    padding: 10,
  },

  placeholderText: {
    fontSize: 16,
    color: "#888",
    marginBottom: 20,
    textAlign: "center",
  },

  captureButton: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  captureButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  map: {
    width: "100%",
    height: 300,
    marginBottom: 20,
    borderRadius: 10,
  },
  locationModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },

  photoModalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: height * 0.8,
  },
  photoOptionButton: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "48%",
  },
  photoOptionButtonText: {
    color: "white",
    marginLeft: 10,
    fontWeight: "bold",
  },
});
