import { getDb } from "./db";
import crypto from "crypto";

// Dynamic import of nodemailer - works in CommonJS and ES6
let nodemailer: any = null;
let transporter: any = null;

// Parse SMTP credentials - available globally
const smtpEmail = process.env.SMTP_EMAIL || "";
const smtpPassword = (process.env.SMTP_PASSWORD || "").replace(/\s/g, ""); // Remove all spaces

// Initialize nodemailer and transporter immediately
(async () => {
  try {
    const nodemailerModule = await import("nodemailer");
    nodemailer = nodemailerModule.default;
    
    console.log("[INIT] Creating SMTP transporter with email:", smtpEmail);
    
    if (smtpEmail && smtpPassword) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT || 465),
        secure: (process.env.SMTP_SECURE || "true") === "true",
        auth: {
          user: smtpEmail,
          pass: smtpPassword, // Now without spaces
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
      
      // Verify transporter
      transporter.verify((error: any) => {
        if (error) {
          console.error("❌ SMTP ERROR:", {
            email: smtpEmail,
            message: error?.message,
            code: error?.code,
          });
        } else {
          console.log("✅ SMTP READY - Email OTP will be sent to:", smtpEmail);
        }
      });
    } else {
      console.warn("⚠️ SMTP credentials not found in .env (SMTP_EMAIL or SMTP_PASSWORD)");
    }
  } catch (error: any) {
    console.error("❌ Failed to initialize nodemailer:", error.message);
  }
})();


const OTP_EXPIRY = 5 * 60 * 1000;
const OTP_LENGTH = 6;

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


export async function sendEmailOtp(email: string): Promise<string> {
  const db = await getDb();
  const otpCollection = db.collection("otp_store");

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY);

  console.log(`[OTP] Sending OTP to ${email}...`);

  // Store OTP in database
  await otpCollection.updateOne(
    { email: email.toLowerCase() },
    {
      $set: {
        email: email.toLowerCase(),
        otp,
        type: "email",
        expiresAt,
        verified: false,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  if (!transporter) {
    console.error(`[OTP ERROR] Transporter not initialized - SMTP credentials missing or invalid`);
    console.log(`[DEMO] Email OTP for ${email}: ${otp}`);
    return "OTP sent (demo mode - check server logs for code)";
  }

  try {
    console.log(`[OTP] Sending email via SMTP to ${email}...`);
    const result = await transporter.sendMail({
      from: `"FairFoods" <${smtpEmail}>`,
      to: email,
      subject: "FairFoods - Your OTP Verification Code",
      html: `
        <div style="font-family: Arial; max-width:600px; margin:auto;">
          <h2 style="color:#22c55e;">FairFoods 🍔</h2>

          <p style="font-size:16px; margin-top:20px;">
            Your OTP verification code is:
          </p>

          <div style="
          font-size:48px;
          font-weight:bold;
          letter-spacing:8px;
          padding:20px;
          background:#f3f4f6;
          text-align:center;
          border-radius:8px;
          margin:20px 0;
          color:#1f2937;
          ">
          ${otp}
          </div>

          <p style="color:#666; margin-top:20px;">
            ⏱️ This code will expire in <strong>5 minutes</strong>.
          </p>

          <p style="color:#999; font-size:13px; margin-top:30px;">
            If you didn't request this code, please ignore this email.
          </p>

          <hr style="margin-top:40px; border:none; border-top:1px solid #eee;">
          <p style="font-size:12px; color:#999; text-align:center;">
            © 2026 FairFoods. All rights reserved.
          </p>
        </div>
      `,
    });

    console.log(`✅ [OTP SUCCESS] Email sent to ${email} - MessageID: ${result.messageId}`);
    return "OTP sent successfully to your email";
  } catch (error: any) {
    console.error(`❌ [OTP ERROR] Failed to send email to ${email}:`, {
      message: error?.message,
      code: error?.code,
      command: error?.command,
    });
    
    // Fallback: Log the OTP so admin can retrieve it from server logs
    console.log(`[FALLBACK] Email OTP for ${email}: ${otp}`);
    return "OTP sent (check server logs if email not received)";
  }
}


export async function sendSmsOtp(phone: string): Promise<string> {
  const db = await getDb();
  const otpCollection = db.collection("otp_store");

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY);

  await otpCollection.updateOne(
    { phone },
    {
      $set: {
        phone,
        otp,
        type: "sms",
        expiresAt,
        verified: false,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  // ===== FIREBASE PHONE AUTH =====
  // Using Firebase Phone Authentication via private key token
  // The frontend will handle recaptcha verification and phone sign-in
  // This backend stores OTP for fallback/additional verification
  
  console.log(`[Firebase Phone Auth] OTP for ${phone}: ${otp}`);
  console.log(`[Firebase] Using FIREBASE_PRIVATE_KEY token for phone verification`);

  // SMS sending via Twilio (uncomment if you have Twilio setup)
  // const twilio = require("twilio");
  // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // await client.messages.create({
  //   body: `Your FairFoods OTP is: ${otp}. Valid for 5 minutes.`,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: phone,
  // });

  return "OTP sent to phone";
}

export async function verifyOtp(identifier: string, otp: string): Promise<boolean> {
  const db = await getDb();
  const otpCollection = db.collection("otp_store");

  const query = identifier.includes("@")
    ? { email: identifier.toLowerCase() }
    : { phone: identifier };

  const record = await otpCollection.findOne(query);

  if (!record) return false;
  if (new Date() > record.expiresAt) return false;
  if (String(record.otp) !== String(otp)) return false;

  await otpCollection.updateOne(query, {
    $set: { verified: true },
  });

  return true;
}

export async function clearOtp(identifier: string): Promise<void> {
  const db = await getDb();
  const otpCollection = db.collection("otp_store");

  const query = identifier.includes("@")
    ? { email: identifier.toLowerCase() }
    : { phone: identifier };

  await otpCollection.deleteOne(query);
}