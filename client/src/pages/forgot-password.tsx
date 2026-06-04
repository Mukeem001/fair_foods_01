import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, Eye, EyeOff, Loader } from "lucide-react";
import logo from "@/assets/logo.png";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: email/phone, 2: OTP, 3: new password

  const [identifier, setIdentifier] = useState(""); // email OR phone
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [loading, setLoading] = useState(false);

  // Format phone number to international format
  const formatPhoneNumber = (phone: string): string => {
    // If it's an email, return as is
    if (phone.includes("@")) {
      return phone;
    }

    // Remove all spaces, dashes, and special characters
    let cleaned = phone.replace(/\D/g, "");

    // If it's a 10-digit Indian number, add +91
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }

    // If it already starts with 91 but no +, add +
    if (cleaned.length === 12 && cleaned.startsWith("91")) {
      return `+${cleaned}`;
    }

    // If it has + prefix, return as is
    if (phone.startsWith("+")) {
      return phone;
    }

    // Otherwise, assume it's +91
    if (cleaned.length > 0) {
      return `+91${cleaned}`;
    }

    return phone;
  };

  // STEP 1 → send OTP
  const sendOtp = async () => {
    if (!identifier) {
      setMessage("Enter email or phone number");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      // Format phone number if it's a phone (not email)
      const formattedIdentifier = formatPhoneNumber(identifier);

      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: formattedIdentifier }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      // Store formatted identifier for verification
      setIdentifier(formattedIdentifier);
      setStep(2);
      setMessage(`OTP sent to your ${data.type}`);
      setMessageType("success");
    } catch (error: any) {
      setMessage(error.message || "Failed to send OTP");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2 → verify OTP
  const verifyOtp = async () => {
    if (!otp) {
      setMessage("Enter OTP");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid OTP");
      }

      setStep(3);
      setMessage("");
    } catch (error: any) {
      setMessage(error.message || "Failed to verify OTP");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // STEP 3 → reset password
  const resetPassword = async () => {
    if (!newPassword) {
      setMessage("Enter new password");
      setMessageType("error");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/reset-password-with-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, newPassword }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setMessage("Password reset successful! Redirecting to login...");
      setMessageType("success");

      setTimeout(() => {
        // Redirect to login
        window.location.href = "/login";
      }, 1500);
    } catch (error: any) {
      setMessage(error.message || "Failed to reset password");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6fb] px-4">

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 space-y-5">

        {/* HEADER */}
        <div className="text-center space-y-2">

          <div className="flex justify-center">
            <img
              src={logo}
              alt="FairFoods"
              className="w-14 h-14 object-contain"
            />
          </div>

          <h1 className="text-2xl font-bold">
            Forgot Password 🔐
          </h1>

          <p className="text-xs text-gray-500">
            Enter email or phone to reset your password
          </p>

        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-3">

            <Input
              placeholder="Email or Phone Number"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />

            <Button
              onClick={sendOtp}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              Send OTP
            </Button>

          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-3">

            <p className="text-xs text-green-600 font-medium">
              ✓ OTP sent to your account
            </p>

            <Input
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.slice(0, 6))}
              maxLength={6}
            />

            <Button
              onClick={verifyOtp}
              disabled={loading || otp.length !== 6}
              className="w-full bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              Verify OTP
            </Button>

            <button
              onClick={() => setStep(1)}
              className="w-full text-xs text-gray-500 hover:text-green-600"
            >
              Send OTP to different address?
            </button>

          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-3">

            <p className="text-xs text-green-600 font-medium">
              ✓ OTP verified. Set your new password
            </p>

            <div className="relative">
              <Input
                placeholder="New Password"
                type={showPass ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-2.5 text-gray-500"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button
              onClick={resetPassword}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              <KeyRound size={16} />
              Reset Password
            </Button>

          </div>
        )}

        {/* MESSAGE */}
        {message && (
          <div
            className={`text-xs text-center p-2 rounded-lg border ${
              messageType === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-500 border-red-100"
            }`}
          >
            {message}
          </div>
        )}

        {/* LOGIN LINK */}
        <p className="text-center text-xs text-gray-500">
          Back to{" "}
          <Link href="/login" className="text-green-600 font-medium">
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}