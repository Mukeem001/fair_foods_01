import type { Express } from "express";
import type { Server } from "http";
import { signToken, protectUserRoute } from "./auth";
import { getDb } from "./db";
import crypto from "crypto";
import { sendEmailOtp, sendSmsOtp, verifyOtp, clearOtp } from "./otp-service";

export async function registerAuthRoutes(httpServer: Server, app: Express): Promise<Server> {
  /**
   * ⚠️ DEMO ENDPOINT ONLY
   * This endpoint accepts userId from client - suitable only for demo/development.
   * 
   * In production, you should:
   * 1. Validate userId against database/session
   * 2. Use server-side authentication (session validation)
   * 3. Never trust userId from client request body
   * 4. Consider using OAuth2 or similar auth flows
   */
  app.post("/api/auth/token", async (req, res) => {
    try {
      const { userId } = req.body ?? {};
      if (!userId) return res.status(400).json({ message: "userId required" });

      const token = signToken(String(userId));
      res.json({ token });
    } catch (e) {
      res.status(500).json({ message: "Failed to sign token" });
    }
  });

  // Simple admin login for the admin UI.
  // Accepts { email, password } and returns a JWT token when valid.
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body ?? {};
      const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@fairfood.com";
      const ADMIN_PASS = process.env.ADMIN_PASS ?? "fairfood@123";
      const ADMIN_KEY = process.env.ADMIN_KEY ?? "admin123";

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      // Support both ADMIN_PASS and ADMIN_KEY as password (compat with different admin UI configs)
      const passwordOk = password === ADMIN_PASS || password === ADMIN_KEY;

      if (email !== ADMIN_EMAIL || !passwordOk) {
        return res.status(401).json({ message: "Invalid credentials" });
      }


      const token = signToken("admin");
      return res.json({ token });
    } catch (e) {
      return res.status(500).json({ message: "Login failed" });
    }
  });

  // Return authenticated user info when a valid Bearer token is provided
  app.get("/api/auth/me", protectUserRoute, async (req, res) => {
    try {
      // `protectUserRoute` sets `req.authUser`
      const authUser = (req as any).authUser;
      return res.json({ user: authUser || null });
    } catch (e) {
      return res.status(500).json({ message: "Failed to get user" });
    }
  });

  // User login - validate email/password and return token
  app.post("/api/users/login", async (req, res) => {
    try {
      const { email, password } = req.body ?? {};
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const db = await getDb();
      const users = db.collection("users");

      // Find user by email
      const user = await users.findOne({ email: String(email).toLowerCase() });
      if (!user || user.password !== String(password)) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = signToken(String(user.id));
      return res.json({ 
        token, 
        user: { 
          id: user.id, 
          fullName: user.fullName, 
          email: user.email,
          walletBalance: user.walletBalance,
          address: user.address,
          phone: user.phone,
          orders: user.orders,
          createdAt: user.createdAt
        } 
      });
    } catch (e) {
      console.error('Login failed', e);
      return res.status(500).json({ message: 'Login failed' });
    }
  });

  // Signup - persist user to server DB and return token
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { fullName, email, password } = req.body ?? {};
      if (!fullName || !email || !password) {
        return res.status(400).json({ message: "fullName, email and password required" });
      }

      const db = await getDb();
      const users = db.collection("users");

      // Check existing by email
      const existing = await users.findOne({ email: String(email).toLowerCase() });
      if (existing) {
        return res.status(409).json({ message: "User already exists" });
      }

      const newUser = {
        id: crypto.randomUUID(),
        fullName: String(fullName),
        email: String(email).toLowerCase(),
        password: String(password),
        walletBalance: 0,
        address: "",
        phone: "",
        orders: [],
        createdAt: new Date(),
      };

      await users.insertOne(newUser as any);

      const token = signToken(String(newUser.id));
      return res.json({ token, user: { id: newUser.id, fullName: newUser.fullName, email: newUser.email } });
    } catch (e) {
      console.error('Signup failed', e);
      return res.status(500).json({ message: 'Signup failed' });
    }
  });

  // ===== OTP ENDPOINTS =====

  // DEBUG: Test email sending
  app.get("/api/auth/test-email", async (req, res) => {
    try {
      const testEmail = "mohdmukeem9971@gmail.com";
      console.log("\n🧪 TESTING EMAIL SENDING...");
      console.log("To:", testEmail);
      
      const message = await sendEmailOtp(testEmail);
      
      return res.json({ 
        success: true,
        message: "Test email attempted",
        details: message,
        checkServerLogs: "Check server console for OTP code and any errors",
      });
    } catch (e: any) {
      console.error("Test email failed:", e);
      return res.status(500).json({ message: "Test email failed", error: e.message });
    }
  });

  // Send OTP via email or SMS
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { identifier } = req.body ?? {};
      if (!identifier) {
        return res.status(400).json({ message: "Email or phone required" });
      }

      const isEmail = String(identifier).includes("@");

      try {
        if (isEmail) {
          const message = await sendEmailOtp(String(identifier));
          return res.json({ message, type: "email" });

        } else {
          const message = await sendSmsOtp(String(identifier));
          return res.json({ message, type: "sms" });
        }
      } catch (otpError) {
        console.error("OTP send error:", otpError);
        return res.status(500).json({ message: "Failed to send OTP" });
      }
    } catch (e) {
      console.error("Send OTP failed", e);
      return res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  // Verify OTP
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { identifier, otp } = req.body ?? {};
      if (!identifier || !otp) {
        return res.status(400).json({ message: "Identifier and OTP required" });
      }

      const isVerified = await verifyOtp(String(identifier), String(otp));

      if (!isVerified) {
        return res.status(401).json({ message: "Invalid or expired OTP" });
      }

      return res.json({ message: "OTP verified successfully", verified: true });
    } catch (e) {
      console.error("Verify OTP failed", e);
      return res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  // Login after OTP was verified (phone or email)
  app.post("/api/auth/login-after-otp", async (req, res) => {
    try {
      const { identifier } = req.body ?? {};
      if (!identifier) {
        return res.status(400).json({ message: "Identifier required" });
      }

      const id = String(identifier);
      const isEmail = id.includes("@");
      const db = await getDb();
      const otpCollection = db.collection("otp_store");
      const users = db.collection("users");

      const otpQuery = isEmail
        ? { email: id.toLowerCase(), verified: true }
        : { phone: id, verified: true };

      const otpRecord = await otpCollection.findOne(otpQuery);
      if (!otpRecord) {
        return res.status(401).json({ message: "OTP not verified. Please verify OTP first." });
      }

      const userQuery = isEmail ? { email: id.toLowerCase() } : { phone: id };
      const user = await users.findOne(userQuery);
      if (!user) {
        return res.status(404).json({ message: "No account found. Please sign up first." });
      }

      const token = signToken(String(user.id));
      return res.json({
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
        },
      });
    } catch (e) {
      console.error("Login after OTP failed", e);
      return res.status(500).json({ message: "Login failed" });
    }
  });

  // Signup with OTP verification
  app.post("/api/auth/signup-with-otp", async (req, res) => {
    try {
      const { fullName, identifier, password } = req.body ?? {};
      if (!fullName || !identifier || !password) {
        return res.status(400).json({ message: "All fields required" });
      }

      const db = await getDb();
      const users = db.collection("users");

      // For email or phone
      const isEmail = String(identifier).includes("@");
      const email = isEmail ? String(identifier).toLowerCase() : "";
      const phone = !isEmail ? String(identifier) : "";

      // Check existing user
      const query = isEmail ? { email } : { phone };
      const existing = await users.findOne(query);
      if (existing) {
        return res.status(409).json({ message: "User already exists" });
      }

      const newUser = {
        id: crypto.randomUUID(),
        fullName: String(fullName),
        email: email || undefined,
        phone: phone || undefined,
        password: String(password),
        walletBalance: 0,
        address: "",
        orders: [],
        createdAt: new Date(),
      };

      await users.insertOne(newUser as any);

      // Clear OTP after successful signup
      await clearOtp(String(identifier));

      const token = signToken(String(newUser.id));
      return res.json({
        token,
        user: {
          id: newUser.id,
          fullName: newUser.fullName,
          email: newUser.email,
          phone: newUser.phone,
        },
      });
    } catch (e) {
      console.error("Signup with OTP failed", e);
      return res.status(500).json({ message: "Signup failed" });
    }
  });

  // Reset password with OTP verification
  app.post("/api/auth/reset-password-with-otp", async (req, res) => {
    try {
      const { identifier, newPassword } = req.body ?? {};
      if (!identifier || !newPassword) {
        return res.status(400).json({ message: "Identifier and password required" });
      }

      const db = await getDb();
      const users = db.collection("users");

      const isEmail = String(identifier).includes("@");
      const query = isEmail
        ? { email: String(identifier).toLowerCase() }
        : { phone: String(identifier) };

      const user = await users.findOne(query);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update password
      await users.updateOne(query, {
        $set: { password: String(newPassword) },
      });

      // Clear OTP after successful reset
      await clearOtp(String(identifier));

      return res.json({ message: "Password reset successfully" });
    } catch (e) {
      console.error("Reset password failed", e);
      return res.status(500).json({ message: "Password reset failed" });
    }
  });

  // ===== GOOGLE LOGIN ENDPOINT =====
  app.post("/api/auth/google-login", async (req, res) => {
    try {
      const { email, fullName, phone } = req.body ?? {};
      if (!email) {
        return res.status(400).json({ message: "Email required from Google" });
      }

      const db = await getDb();
      const users = db.collection("users");

      // Find existing user by email
      let user: any = await users.findOne({ email: String(email).toLowerCase() });

      if (user) {
        // User exists - update profile if needed
        if (fullName && !user.fullName) {
          await users.updateOne(
            { email: String(email).toLowerCase() },
            { $set: { fullName: String(fullName) } }
          );
        }
        if (phone && !user.phone) {
          await users.updateOne(
            { email: String(email).toLowerCase() },
            { $set: { phone: String(phone) } }
          );
        }
      } else {
        // Create new user
        user = {
          id: crypto.randomUUID(),
          fullName: String(fullName) || "Google User",
          email: String(email).toLowerCase(),
          phone: phone ? String(phone) : "",
          password: "", // No password for Google auth
          walletBalance: 0,
          address: "",
          orders: [],
          createdAt: new Date(),
          loginProvider: "google",
        };

        await users.insertOne(user as any);
      }

      const token = signToken(String(user.id));
      return res.json({
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
        },
      });
    } catch (e) {
      console.error("Google login failed", e);
      return res.status(500).json({ message: "Google login failed" });
    }
  });

  return httpServer;
}

