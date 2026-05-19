"use server";

import { getCurrentUser, isAuthenticated, removeAuthCookie } from "@/lib/auth";

// Re-export getCurrentUser and isAuthenticated from auth utilities
export { getCurrentUser, isAuthenticated };

// Sign out user by clearing the auth cookie
export async function signOut() {
  await removeAuthCookie();
}
