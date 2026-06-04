import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  Auth
} from "firebase/auth";

// ⚠️ Update these with your Firebase project credentials
// Get from: https://console.firebase.google.com/project/YOUR-PROJECT/settings/general
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDXXXXXXXXXXXXXXXXXXXX",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth: Auth = getAuth(app);
auth.languageCode = 'en';

// DEVELOPMENT: Try to disable app verification for testing phone auth
if (import.meta.env.DEV) {
  try {
    // @ts-ignore - This is a Firebase internal API for testing
    auth.settings.appVerificationDisabledForTesting = true;
    console.log('[Firebase] App verification disabled for testing');
  } catch (e) {
    console.log('[Firebase] Could not disable app verification (normal in dev)');
  }
}

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Google Sign-In function
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    return {
      success: true,
      token: await user.getIdToken(),
      user: {
        id: user.uid,
        email: user.email,
        fullName: user.displayName,
        phone: user.phoneNumber,
        photoURL: user.photoURL,
      },
    };
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ===== PHONE AUTHENTICATION =====

let recaptchaVerifier: RecaptchaVerifier | null = null;
let phoneConfirmationResult: any = null;

// Setup Phone OTP Recaptcha verifier
export function setupPhoneRecaptcha(containerId: string): RecaptchaVerifier {
  try {
    if (recaptchaVerifier) {
      console.log('[Recaptcha] Using existing verifier');
      return recaptchaVerifier;
    }

    // Ensure container exists in DOM
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Recaptcha container #${containerId} not found in DOM`);
    }

    console.log('[Recaptcha] Creating new verifier for container:', containerId);

    // Create recaptcha with auth as first parameter
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: (response: string) => {
        console.log('[Recaptcha] Verified:', response);
      },
      'expired-callback': () => {
        console.log('[Recaptcha] Expired');
        recaptchaVerifier = null;
      }
    });

    console.log('[Recaptcha] Verifier created successfully');
    return recaptchaVerifier;
  } catch (error) {
    console.error('[Recaptcha] Setup error:', error);
    recaptchaVerifier = null;
    throw error;
  }
}

// Send Phone OTP via Firebase or Backend fallback
export async function sendPhoneOtp(phoneNumber: string): Promise<boolean> {
  try {
    console.log('[Firebase Phone] Initializing OTP for:', phoneNumber);

    // IN DEVELOPMENT: Use backend phone OTP to avoid Firebase RecaptchaVerifier issues
    if (import.meta.env.DEV) {
      console.log('[Firebase Phone] Using backend OTP (development mode)');
      return await sendBackendPhoneOtp(phoneNumber);
    }

    // Ensure recaptcha verifier exists
    if (!recaptchaVerifier) {
      console.log('[Firebase Phone] Setting up recaptcha verifier...');
      recaptchaVerifier = setupPhoneRecaptcha("recaptcha-container");
    }

    // Firebase requires E.164 format. If user enters 9990851391 -> convert to +91...
    const normalized = phoneNumber.trim().startsWith("+")
      ? phoneNumber.trim()
      : `+91${phoneNumber.trim()}`;

    console.log('[Firebase Phone] Sending OTP to:', normalized);

    phoneConfirmationResult = await signInWithPhoneNumber(
      auth,
      normalized,
      recaptchaVerifier
    );

    console.log("✅ [Firebase Phone] OTP sent successfully:", { phoneNumber, normalized });
    return true;
  } catch (error: any) {
    console.error("❌ [Firebase Phone] Error:", { phoneNumber, error: error?.message });
    recaptchaVerifier = null;
    
    // Provide helpful error messages
    if (error?.message?.includes('app-verification')) {
      throw new Error('Firebase app verification failed. Please refresh and try again.');
    }
    if (error?.message?.includes('captcha')) {
      throw new Error('Recaptcha verification failed. Please try again.');
    }
    
    throw new Error(error?.message || "Failed to send phone OTP");
  }
}

// Backend phone OTP fallback
async function sendBackendPhoneOtp(phoneNumber: string): Promise<boolean> {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    
    // Format phone number
    const normalized = phoneNumber.trim().startsWith("+")
      ? phoneNumber.trim()
      : `+91${phoneNumber.trim().replace(/\D/g, '')}`;

    const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: normalized }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to send OTP");
    }

    console.log("✅ [Backend Phone] OTP sent successfully:", { phoneNumber, normalized });
    return true;
  } catch (error: any) {
    console.error("❌ [Backend Phone] Error:", error);
    throw error;
  }
}


// Verify Phone OTP code
export async function verifyPhoneOtp(code: string, phoneNumber?: string): Promise<any> {
  try {
    // IN DEVELOPMENT: Verify against backend
    if (import.meta.env.DEV && phoneNumber) {
      return await verifyBackendPhoneOtp(code, phoneNumber);
    }

    // Production: Verify with Firebase
    if (!phoneConfirmationResult) {
      throw new Error('No confirmation result. Please send OTP first.');
    }

    const result = await phoneConfirmationResult.confirm(code);
    const user = result.user;

    return {
      success: true,
      token: await user.getIdToken(),
      user: {
        id: user.uid,
        phone: user.phoneNumber,
        email: user.email,
      },
    };
  } catch (error: any) {
    console.error('Phone verification error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Backend phone OTP verification
async function verifyBackendPhoneOtp(code: string, phoneNumber: string): Promise<any> {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    
    // Format phone number
    const normalized = phoneNumber.trim().startsWith("+")
      ? phoneNumber.trim()
      : `+91${phoneNumber.trim().replace(/\D/g, '')}`;

    const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: normalized, otp: code }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Invalid OTP");
    }

    console.log("✅ [Backend Phone] OTP verified successfully");
    return {
      success: true,
      token: null, // Backend JWT will be created later
      user: {
        phone: normalized,
      },
    };
  } catch (error: any) {
    console.error("❌ [Backend Phone] Verification error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Clear phone confirmation result
export function clearPhoneConfirmation() {
  phoneConfirmationResult = null;
  recaptchaVerifier = null;
}

export default app;

