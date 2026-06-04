import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, Eye, EyeOff, Loader } from "lucide-react";
import logo from "@/assets/logo.png";
import { apiUrl } from "@/lib/api";
import { formatIdentifier } from "@/lib/phone";

type ForgotPasswordFormProps = {
  onLoginClick?: () => void;
};

export function ForgotPasswordForm({ onLoginClick }: ForgotPasswordFormProps) {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!identifier) {
      setMessage("Enter email or phone number");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const formattedIdentifier = formatIdentifier(identifier);

      const response = await fetch(apiUrl("/api/auth/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: formattedIdentifier }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to send OTP");

      setIdentifier(formattedIdentifier);
      setStep(2);
      setMessage(`OTP sent to your ${data.type}`);
      setMessageType("success");
    } catch (error: unknown) {
      const err = error as { message?: string };
      setMessage(err.message || "Failed to send OTP");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) {
      setMessage("Enter OTP");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(apiUrl("/api/auth/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Invalid OTP");

      setStep(3);
      setMessage("");
    } catch (error: unknown) {
      const err = error as { message?: string };
      setMessage(err.message || "Failed to verify OTP");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

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
      const response = await fetch(apiUrl("/api/auth/reset-password-with-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to reset password");

      setMessage("Password reset successful! Redirecting to login...");
      setMessageType("success");

      setTimeout(() => onLoginClick?.(), 1500);
    } catch (error: unknown) {
      const err = error as { message?: string };
      setMessage(err.message || "Failed to reset password");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <img src={logo} alt="FairFoods" className="w-14 h-14 object-contain" />
        </div>
        <h2 className="text-2xl font-bold">Forgot Password 🔐</h2>
        <p className="text-xs text-gray-500">Enter email or phone to reset your password</p>
      </div>

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

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-xs text-green-600 font-medium">✓ OTP sent to your account</p>
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
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-xs text-gray-500 hover:text-green-600"
          >
            Send OTP to different address?
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <p className="text-xs text-green-600 font-medium">✓ OTP verified. Set your new password</p>
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

      <p className="text-center text-xs text-gray-500">
        Back to{" "}
        <button type="button" onClick={onLoginClick} className="text-green-600 font-medium">
          Login
        </button>
      </p>
    </div>
  );
}
