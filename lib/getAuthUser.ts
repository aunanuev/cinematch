import { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import type { DecodedIdToken } from "firebase-admin/auth";

/**
 * Extracts and verifies the Firebase Auth ID token from the
 * Authorization: Bearer <token> header.
 *
 * Returns the decoded token (with uid, email, etc.) on success,
 * or null if the token is missing, malformed, or invalid.
 *
 * The Admin SDK is initialized lazily inside getAdminAuth() so this
 * module is safe to import at build time without credentials present.
 */
export async function getAuthUser(
    req: NextRequest
): Promise<DecodedIdToken | null> {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return null;

    try {
        const adminAuth = getAdminAuth();
        return await adminAuth.verifyIdToken(token);
    } catch {
        // Token expired, revoked, or malformed — treat as unauthenticated
        return null;
    }
}
