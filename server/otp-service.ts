import dns from "node:dns";
import { getDb } from "./db";

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const isRender = Boolean(process.env.RENDER);
const resendApiKey = process.env.RESEND_API_KEY || "";
const resendFrom =
  process.env.RESEND_FROM || "FairFoods <onboarding@resend.dev>";

const smtpEmail = process.env.SMTP_EMAIL || "";
const smtpPassword = (process.env.SMTP_PASSWORD || "").replace(/\s/g, "");
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE =
  (process.env.SMTP_SECURE ?? (SMTP_PORT === 465 ? "true" : "false")) === "true";
const MAIL_TIMEOUT_MS = 25_000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let nodemailer: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let transporter: any = null;

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
    auth: { user: smtpEmail, pass: smtpPassword },
    connectionTimeout: MAIL_TIMEOUT_MS,
    greetingTimeout: 15_000,
    socketTimeout: MAIL_TIMEOUT_MS,
    tls: { minVersion: "TLSv1.2", servername: SMTP_HOST },
    lookup: ipv4Lookup,
  });
}

async function initSmtpMailer() {
  if (transporter || resendApiKey || !smtpEmail || !smtpPassword) return;

  try {
    const nodemailerModule = await import("nodemailer");
    nodemailer = nodemailerModule.default;
    transporter = createSmtpTransporter(SMTP_PORT, SMTP_SECURE);
    console.log("[INIT] SMTP available for local dev (port", SMTP_PORT + ")");
  } catch (error: unknown) {
    console.error("❌ Failed to initialize nodemailer:", (error as Error).message);
    transporter = null;
  }
}

if (resendApiKey) {
  console.log("✅ Email OTP: Resend API (works on Render)");
} else if (isRender) {
  console.warn(
    "⚠️ Email OTP: Render blocks SMTP ports 587/465. Add RESEND_API_KEY in Render Environment."
  );
} else {
  void initSmtpMailer();
}

const OTP_EXPIRY = 5 * 60 * 1000;
const OTP_SUBJECT = "FairFoods - Your OTP Verification Code";

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function buildOtpHtml(otp: string): string {
  return `
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
}

async function sendViaResend(to: string, html: string): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [to],
      subject: OTP_SUBJECT,
      html,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
    id?: string;
  };

  if (!response.ok) {
    const detail = data.message || `Resend HTTP ${response.status}`;
    throw new Error(detail);
  }

  console.log(`✅ [Resend] OTP email sent to ${to}`, data.id ? `(id: ${data.id})` : "");
}

async function sendViaSmtp(to: string, html: string): Promise<void> {
  await initSmtpMailer();
  if (!transporter) {
    throw new Error("SMTP not configured");
  }

  const mailOptions = {
    from: `"FairFoods" <${smtpEmail}>`,
    to,
    subject: OTP_SUBJECT,
    html,
  };

  await Promise.race([
    transporter.sendMail(mailOptions),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Email send timed out")), MAIL_TIMEOUT_MS)
    ),
  ]);

  console.log(`✅ [SMTP] OTP email sent to ${to}`);
}

async function deliverOtpEmail(to: string, html: string): Promise<void> {
  if (resendApiKey) {
    console.log(`[OTP] Sending via Resend API → ${to}`);
    await sendViaResend(to, html);
    return;
  }

  if (isRender) {
    throw new Error(
      "Email OTP is not available: Render blocks Gmail SMTP. Add RESEND_API_KEY in Render dashboard (see .env.example)."
    );
  }

  if (smtpEmail && smtpPassword) {
    console.log(`[OTP] Sending via SMTP → ${to}`);
    await sendViaSmtp(to, html);
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Email service not configured");
  }

  throw new Error("EMAIL_DEMO_MODE");
}

export async function sendEmailOtp(email: string): Promise<string> {
  const db = await getDb();
  const otpCollection = db.collection("otp_store");

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY);
  const normalizedEmail = email.toLowerCase();

  console.log(`[OTP] Preparing OTP for ${normalizedEmail}...`);

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

  const html = buildOtpHtml(otp);

  try {
    await deliverOtpEmail(normalizedEmail, html);
    return "OTP sent successfully to your email";
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "EMAIL_DEMO_MODE") {
      console.log(`[DEMO] Email OTP for ${normalizedEmail}: ${otp}`);
      return "OTP sent (demo mode - check server logs)";
    }
    console.error(`❌ [OTP] Email delivery failed for ${normalizedEmail}:`, err.message);
    throw err;
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

  console.log(`[Phone OTP] Code for ${phone}: ${otp} (check server logs on Render)`);
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
