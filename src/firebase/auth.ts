import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  AuthError,
  User,
} from "firebase/auth";
import { auth } from "./config";

class AuthenticationError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "AuthenticationError";
    this.code = code;
  }
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};

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

export const signIn = login;

export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    const authError = error as AuthError;
    throw new AuthenticationError("Logout failed", authError.code);
  }
};

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

export const isUserSignedIn = (): boolean => {
  return !!auth.currentUser;
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const isAuthenticated = (): boolean => {
  return isUserSignedIn();
};
