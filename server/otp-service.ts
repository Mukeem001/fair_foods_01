import dns from "node:dns";
import { getDb } from "./db";

// Render/cloud hosts often fail Gmail SMTP over IPv6 (ENETUNREACH).
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let nodemailer: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let transporter: any = null;

const smtpEmail = process.env.SMTP_EMAIL || "";
const smtpPassword = (process.env.SMTP_PASSWORD || "").replace(/\s/g, "");

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE =
  (process.env.SMTP_SECURE ?? (SMTP_PORT === 465 ? "true" : "false")) === "true";

const MAIL_TIMEOUT_MS = 25_000;

function ipv4Lookup(
  hostname: string,
  _options: dns.LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void
) {
  dns.lookup(hostname, { family: 4 }, callback);
}

function createSmtpTransporter(port: number, secure: boolean) {
  if (!nodemailer) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    requireTLS: port === 587,
    auth: {
      user: smtpEmail,
      pass: smtpPassword,
    },
    connectionTimeout: MAIL_TIMEOUT_MS,
    greetingTimeout: 15_000,
    socketTimeout: MAIL_TIMEOUT_MS,
    tls: {
      minVersion: "TLSv1.2",
      servername: SMTP_HOST,
    },
    lookup: ipv4Lookup,
  });
}

async function initMailer() {
  if (transporter || !smtpEmail || !smtpPassword) return;

  try {
    const nodemailerModule = await import("nodemailer");
    nodemailer = nodemailerModule.default;

    console.log("[INIT] Creating SMTP transporter (IPv4)", {
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      email: smtpEmail,
    });

    transporter = createSmtpTransporter(SMTP_PORT, SMTP_SECURE);

    if (!transporter) return;

    await new Promise<void>((resolve) => {
      transporter!.verify((error: Error | null) => {
        if (error) {
          console.error("❌ SMTP verify failed:", {
            message: error.message,
            code: (error as NodeJS.ErrnoException).code,
          });
        } else {
          console.log("✅ SMTP READY - Email OTP via", SMTP_HOST, "port", SMTP_PORT);
        }
        resolve();
      });
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("❌ Failed to initialize nodemailer:", err.message);
    transporter = null;
  }
}

void initMailer();

const OTP_EXPIRY = 5 * 60 * 1000;

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendMailWithTimeout(mailOptions: Record<string, unknown>) {
  if (!transporter) throw new Error("Email service not configured");

  return Promise.race([
    transporter.sendMail(mailOptions),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Email send timed out")), MAIL_TIMEOUT_MS)
    ),
  ]);
}

async function deliverEmail(to: string, html: string): Promise<void> {
  await initMailer();

  if (!transporter) {
    throw new Error("Email service not configured on server");
  }

  const mailOptions = {
    from: `"FairFoods" <${smtpEmail}>`,
    to,
    subject: "FairFoods - Your OTP Verification Code",
    html,
  };

  const attempts: { port: number; secure: boolean }[] = [
    { port: SMTP_PORT, secure: SMTP_SECURE },
    ...(SMTP_PORT === 587
      ? [{ port: 465, secure: true }]
      : [{ port: 587, secure: false }]),
  ];

  let lastError: Error | null = null;

  for (const attempt of attempts) {
    try {
      if (attempt.port !== SMTP_PORT || attempt.secure !== SMTP_SECURE) {
        console.log(`[OTP] Retrying SMTP on port ${attempt.port} (IPv4)...`);
        transporter = createSmtpTransporter(attempt.port, attempt.secure);
      }

      const result = await sendMailWithTimeout(mailOptions);
      console.log(`✅ [OTP SUCCESS] Email sent to ${to} - MessageID: ${result.messageId}`);
      return;
    } catch (error: unknown) {
      const err = error as Error & { code?: string };
      lastError = err;
      console.error(`❌ [OTP ERROR] SMTP port ${attempt.port} failed:`, {
        message: err.message,
        code: err.code,
      });
    }
  }

  throw lastError ?? new Error("Failed to send verification email");
}

export async function sendEmailOtp(email: string): Promise<string> {
  const db = await getDb();
  const otpCollection = db.collection("otp_store");

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY);
  const normalizedEmail = email.toLowerCase();

  console.log(`[OTP] Sending OTP to ${normalizedEmail}...`);

  await otpCollection.updateOne(
    { email: normalizedEmail },
    {
      $set: {
        email: normalizedEmail,
        otp,
        type: "email",
        expiresAt,
        verified: false,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  const html = `
    <div style="font-family: Arial; max-width:600px; margin:auto;">
      <h2 style="color:#22c55e;">FairFoods 🍔</h2>
      <p style="font-size:16px; margin-top:20px;">Your OTP verification code is:</p>
      <div style="font-size:48px;font-weight:bold;letter-spacing:8px;padding:20px;background:#f3f4f6;text-align:center;border-radius:8px;margin:20px 0;color:#1f2937;">
        ${otp}
      </div>
      <p style="color:#666;">⏱️ This code expires in <strong>5 minutes</strong>.</p>
      <p style="color:#999;font-size:13px;">If you didn't request this, ignore this email.</p>
    </div>
  `;

  if (!smtpEmail || !smtpPassword) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email service not configured");
    }
    console.log(`[DEMO] Email OTP for ${normalizedEmail}: ${otp}`);
    return "OTP sent (demo mode - check server logs)";
  }

  console.log(`[OTP] Sending email via SMTP to ${normalizedEmail}...`);
  await deliverEmail(normalizedEmail, html);
  return "OTP sent successfully to your email";
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

  console.log(`[Firebase Phone Auth] OTP for ${phone}: ${otp}`);
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
