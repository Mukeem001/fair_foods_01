import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { sendPhoneOtp, signInWithGoogle } from "@/lib/firebase";
import { Eye, EyeOff, Loader } from "lucide-react";
import logo from "@/assets/logo.png";
import { apiUrl } from "@/lib/api";
import { formatIdentifier } from "@/lib/phone";

type LoginFormProps = {
  onSuccess?: () => void;
  onSignupClick?: () => void;
  onForgotPasswordClick?: () => void;
};

export function LoginForm({ onSuccess, onSignupClick, onForgotPasswordClick }: LoginFormProps) {
  const { login, setAuthSession } = useStore();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  const handleSubmit = async () => {
    if (otpSent) return;

    const v = identifier.trim();
    const looksLikePhone = v && /^\d{8,15}$/.test(v);

    if (looksLikePhone) {
      setOtpSent(false);
      setOtp("");
      setMessage("");
      return;
    }

    const success = await login(v, password);

    if (!success) {
      setMessage("Invalid email or password");
      setMessageType("error");
      return;
    }

    setMessage("Login successful!");
    setMessageType("success");
    setTimeout(() => onSuccess?.(), 500);
  };

  const googleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();

      if (!result.success) {
        throw new Error(result.error || "Google login failed");
      }

      const response = await fetch(apiUrl("/api/auth/google-login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseToken: result.token,
          email: result.user?.email || "",
          fullName: result.user?.fullName || "",
          phone: result.user?.phone || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Google login failed");
      }

      setAuthSession(data.token, {
        id: data.user.id,
        fullName: data.user.fullName,
        email: data.user.email || "",
        phone: data.user.phone,
      });
      setMessage("Login successful!");
      setMessageType("success");
      setTimeout(() => onSuccess?.(), 800);
    } catch (error: unknown) {
      const err = error as { message?: string };
      setMessage(err.message || "Google login failed");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async () => {
    const phoneCandidate = identifier.trim();
    if (!phoneCandidate) {
      setMessage("Enter phone number");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const ok = await sendPhoneOtp(phoneCandidate);
      if (!ok) throw new Error("Failed to send SMS OTP");

      setOtpSent(true);
      setMessage("OTP sent. Please check your phone.");
      setMessageType("success");
    } catch (e: unknown) {
      const err = e as { message?: string };
      setMessage(err?.message || "Failed to send OTP");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndContinue = async () => {
    const formattedId = formatIdentifier(identifier);

    setLoading(true);
    try {
      const verifyRes = await fetch(apiUrl("/api/auth/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: formattedId, otp }),
      });

      const verifyData = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok) throw new Error(verifyData.message || "Invalid OTP");

      const loginRes = await fetch(apiUrl("/api/auth/login-after-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: formattedId }),
      });

      const loginData = await loginRes.json().catch(() => ({}));
      if (!loginRes.ok) {
        throw new Error(loginData.message || "Login failed");
      }

      setAuthSession(loginData.token, {
        id: loginData.user.id,
        fullName: loginData.user.fullName,
        email: loginData.user.email || "",
        phone: loginData.user.phone || formattedId,
      });

      setMessage("Login successful!");
      setMessageType("success");
      setTimeout(() => onSuccess?.(), 500);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setMessage(err?.message || "OTP verification failed");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const looksLikePhone = identifier.trim() && /^\d{8,15}$/.test(identifier.trim());

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <img src={logo} alt="FairFoods" className="w-16 h-16 object-contain drop-shadow-md" />
        </div>
        <h2 className="text-2xl font-bold">Welcome Back 👋</h2>
        <p className="text-xs text-gray-500">Login to continue ordering your favorite food 🍔</p>
      </div>

      <div className="space-y-3">
        <Input
          placeholder="Email or Phone (e.g. 9990851391 or email@xx.com)"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          disabled={otpSent}
        />

        <div className="relative">
          <Input
            placeholder="Password"
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={otpSent || !!looksLikePhone}
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
          onClick={handleSubmit}
          disabled={otpSent || !!looksLikePhone}
          className="w-full bg-green-500 hover:bg-green-600"
        >
          Login
        </Button>

        {looksLikePhone && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500">Phone detected: OTP login enabled</div>

            {!otpSent ? (
              <Button
                onClick={requestOtp}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                {loading ? "Sending..." : "Send Phone OTP"}
              </Button>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                  disabled={loading}
                />

                <Button
                  onClick={verifyAndContinue}
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-green-500 hover:bg-green-600"
                >
                  {loading ? "Verifying..." : "Verify & Continue"}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setMessage("");
                    setMessageType("error");
                  }}
                  className="w-full text-xs text-gray-500 hover:text-green-600"
                >
                  Didn&apos;t receive OTP? Change number
                </button>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={googleLogin}
          disabled={otpSent || loading}
          className="w-full border rounded-xl py-2 text-sm flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader size={16} className="animate-spin" />}
          🌐 {loading ? "Signing in..." : "Continue with Google"}
        </button>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
          <button type="button" onClick={onForgotPasswordClick} className="hover:text-green-600">
            Forgot password?
          </button>
          <button type="button" onClick={onSignupClick} className="text-green-600 font-medium">
            Create account
          </button>
        </div>
      </div>

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
    </div>
  );
}
