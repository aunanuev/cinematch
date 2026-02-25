import { auth } from "@/lib/firebase/config";

/**
 * Returns the current user's Firebase ID token for use in API calls.
 * Automatically refreshes the token if it is close to expiry.
 *
 * Usage:
 *   const token = await getIdToken();
 *   fetch("/api/movie/...", {
 *     headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
 *   });
 */
export async function getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    try {
        return await user.getIdToken();
    } catch {
        return null;
    }
}
