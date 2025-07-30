import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './firebase-config';

// Flag to check if Firebase is configured by checking for a valid apiKey.
export const isFirebaseConfigured = firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

let auth: Auth | null = null;
let app: FirebaseApp | null = null;

// This function now handles initialization internally and ensures it only runs once.
// It will return null if Firebase is not configured, instead of throwing an error.
export const getFirebaseAuth = (): Auth | null => {
    // If auth is already initialized, just return it.
    if (auth) {
        return auth;
    }

    // Only try to initialize if the config is valid and we're on the client.
    if (isFirebaseConfigured && typeof window !== 'undefined') {
        if (!getApps().length) {
            app = initializeApp(firebaseConfig);
        } else {
            app = getApp();
        }
        auth = getAuth(app);
        return auth;
    }

    // If we can't initialize, return null. The hook will handle this.
    return null;
};
