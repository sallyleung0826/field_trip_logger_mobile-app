import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "./config";

/**
 * Create a new user account using email and password.
 * @param email user email
 * @param password user password
 */
export const createAccount = async (email: string, password: string) => {
  await createUserWithEmailAndPassword(auth, email, password);
};

/**
 * Log in using Authentication with email and password.
 * @param email user email
 * @param password user password
 */
export const login = async (email: string, password: string) => {
  await signInWithEmailAndPassword(auth, email, password);
};

/**
 * Log out the current user.
 */
export const logout = async () => {
  await signOut(auth);
};
