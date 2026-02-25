import { initializeApp, getApps, getApp, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

/**
 * Returns a lazily-initialized Firebase Admin Auth instance.
 *
 * This function is called at request-time, NOT at module load time,
 * so Next.js can build the project without Admin credentials.
 *
 * Required env vars (set in Vercel / .env.local):
 *   FIREBASE_ADMIN_PROJECT_ID
 *   FIREBASE_ADMIN_CLIENT_EMAIL
 *   FIREBASE_ADMIN_PRIVATE_KEY   (paste the full PEM with \n for newlines)
 */
export function getAdminAuth(): Auth {
    // Reuse existing app if already initialized (handles Next.js hot-reload)
    if (getApps().length > 0) {
        return getAuth(getApp());
    }

    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
            "Firebase Admin SDK is not configured. " +
            "Add FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, " +
            "and FIREBASE_ADMIN_PRIVATE_KEY to your environment variables."
        );
    }

    const app: App = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
    });

    return getAuth(app);
}
