import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  AuthError,
  AuthErrorCodes,
  User,
} from "firebase/auth";
import { auth } from "./config";

/**
 * Custom error class for authentication errors
 */
class AuthenticationError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "AuthenticationError";
    this.code = code;
  }
}

/**
 * Validate email format
 * @param email email to validate
 * @returns boolean indicating if email is valid
 */
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param password password to validate
 * @returns boolean indicating if password is strong enough
 */
const validatePassword = (password: string): boolean => {
  // At least 8 characters
  return password.length >= 8;
};

/**
 * Create a new user account using email and password.
 * @param email user email
 * @param password user password
 * @param displayName optional display name
 * @throws {AuthenticationError} for validation or Firebase auth errors
 */
export const createAccount = async (
  email: string,
  password: string,
  displayName?: string
): Promise<User> => {
  if (!email) {
    throw new AuthenticationError("Email is required", "auth/empty-email");
  }

  if (!validateEmail(email)) {
    throw new AuthenticationError("Invalid email format", "auth/invalid-email");
  }

  if (!password) {
    throw new AuthenticationError(
      "Password is required",
      "auth/empty-password"
    );
  }

  if (!validatePassword(password)) {
    throw new AuthenticationError(
      "Password must be at least 8 characters long",
      "auth/weak-password"
    );
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Update profile with display name if provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: displayName,
      });
    }

    return userCredential.user;
  } catch (error) {
    const authError = error as AuthError;

    switch (authError.code) {
      case "auth/email-already-in-use":
        throw new AuthenticationError(
          "An account already exists with this email",
          "auth/email-already-in-use"
        );
      case "auth/invalid-email":
        throw new AuthenticationError(
          "Invalid email address",
          "auth/invalid-email"
        );
      case "auth/weak-password":
        throw new AuthenticationError(
          "Password should be at least 8 characters",
          "auth/weak-password"
        );
      case "auth/network-request-failed":
        throw new AuthenticationError(
          "Network error - please check your connection",
          "auth/network-request-failed"
        );
      default:
        throw new AuthenticationError(
          "Account creation failed",
          authError.code
        );
    }
  }
};

/**
 * Log in using Authentication with email and password.
 * @param email user email
 * @param password user password
 * @throws {AuthenticationError} for validation or Firebase auth errors
 */
export const login = async (email: string, password: string): Promise<User> => {
  if (!email) {
    throw new AuthenticationError("Email is required", "auth/empty-email");
  }

  if (!password) {
    throw new AuthenticationError(
      "Password is required",
      "auth/empty-password"
    );
  }

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    const authError = error as AuthError;

    switch (authError.code) {
      case "auth/user-not-found":
        throw new AuthenticationError(
          "No account found with this email",
          "auth/user-not-found"
        );
      case "auth/wrong-password":
        throw new AuthenticationError(
          "Incorrect password",
          "auth/wrong-password"
        );
      case "auth/invalid-email":
        throw new AuthenticationError(
          "Invalid email address",
          "auth/invalid-email"
        );
      case "auth/too-many-requests":
        throw new AuthenticationError(
          "Too many failed attempts - please try again later",
          "auth/too-many-requests"
        );
      case "auth/network-request-failed":
        throw new AuthenticationError(
          "Network error - please check your connection",
          "auth/network-request-failed"
        );
      default:
        throw new AuthenticationError("Login failed", authError.code);
    }
  }
};

/**
 * Sign in with email and password (alias for login)
 * @param email user email
 * @param password user password
 */
export const signIn = login;

/**
 * Log out the current user.
 * @throws {AuthenticationError} if logout fails
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    const authError = error as AuthError;
    throw new AuthenticationError("Logout failed", authError.code);
  }
};

/**
 * Send password reset email
 * @param email user email
 * @throws {AuthenticationError} if reset fails
 */
export const resetPassword = async (email: string): Promise<void> => {
  if (!email) {
    throw new AuthenticationError("Email is required", "auth/empty-email");
  }

  if (!validateEmail(email)) {
    throw new AuthenticationError("Invalid email format", "auth/invalid-email");
  }

  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    const authError = error as AuthError;

    switch (authError.code) {
      case "auth/user-not-found":
        throw new AuthenticationError(
          "No account found with this email",
          "auth/user-not-found"
        );
      case "auth/invalid-email":
        throw new AuthenticationError(
          "Invalid email address",
          "auth/invalid-email"
        );
      default:
        throw new AuthenticationError("Password reset failed", authError.code);
    }
  }
};

/**
 * Check if a user is currently signed in
 * @returns boolean indicating if a user is signed in
 */
export const isUserSignedIn = (): boolean => {
  return !!auth.currentUser;
};

/**
 * Get current user
 * @returns current user or null
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Check if user is authenticated (alias for isUserSignedIn)
 * @returns boolean indicating if a user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return isUserSignedIn();
};
