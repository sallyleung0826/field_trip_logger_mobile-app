import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  AuthError,
  AuthErrorCodes,
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
  // At least 8 characters, one uppercase, one lowercase, one number
  return password.length >= 8;
};

/**
 * Create a new user account using email and password.
 * @param email user email
 * @param password user password
 * @throws {AuthenticationError} for validation or Firebase auth errors
 */
export const createAccount = async (email: string, password: string) => {
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
export const login = async (email: string, password: string) => {
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
      default:
        throw new AuthenticationError("Login failed", authError.code);
    }
  }
};

/**
 * Log out the current user.
 * @throws {AuthenticationError} if logout fails
 */
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    const authError = error as AuthError;
    throw new AuthenticationError("Logout failed", authError.code);
  }
};

/**
 * Check if a user is currently signed in
 * @returns boolean indicating if a user is signed in
 */
export const isUserSignedIn = (): boolean => {
  return !!auth.currentUser;
};
