import admin from "firebase-admin";

// Initialize Firebase Admin SDK for backend phone authentication
// Using the Firebase private key token from .env

let firebaseApp: admin.app.App;

try {
  // Check if we have Firebase credentials
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (privateKey && projectId && clientEmail) {
    // Initialize Firebase Admin with service account credentials
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
    console.log("✅ Firebase Admin SDK initialized with custom credentials");
  } else {
    console.log(
      "⚠️ Firebase Admin credentials not fully configured. Phone auth via Firebase will use frontend-only verification."
    );
  }
} catch (error) {
  console.log(
    "⚠️ Firebase Admin SDK initialization skipped. Using fallback OTP verification."
  );
}

// Export auth instance for phone verification
export const auth = firebaseApp ? admin.auth(firebaseApp) : null;

// Verify phone number with custom token
export async function verifyPhoneWithFirebase(
  phoneNumber: string,
  idToken: string
): Promise<boolean> {
  try {
    if (!auth) {
      console.log("Firebase Auth not available, skipping Firebase verification");
      return true; // Allow fallback to OTP verification
    }

    // Verify Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log("✅ Firebase token verified for user:", decodedToken.uid);

    return true;
  } catch (error: any) {
    console.log("Firebase token verification failed:", error.message);
    return false;
  }
}

// Create custom token for phone auth (if needed)
export async function createCustomTokenForPhone(
  uid: string
): Promise<string | null> {
  try {
    if (!auth) {
      return null;
    }

    const customToken = await auth.createCustomToken(uid);
    return customToken;
  } catch (error) {
    console.error("Failed to create custom token:", error);
    return null;
  }
}

export default firebaseApp;
