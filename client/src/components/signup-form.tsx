import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader } from "lucide-react";
import logo from "@/assets/logo.png";
import { signInWithGoogle } from "@/lib/firebase";
import { useStore } from "@/lib/store";
import { apiUrl } from "@/lib/api";
import { formatIdentifier } from "@/lib/phone";

type SignupFormProps = {
  onSuccess?: () => void;
  onLoginClick?: () => void;
};

export function SignupForm({ onSuccess, onLoginClick }: SignupFormProps) {
  const { setAuthSession } = useStore();

  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [loading, setLoading] = useState(false);

  const handleAuthSuccess = (token: string, authUser: {
    id: string;
    fullName: string;
    email?: string;
    phone?: string;
  }) => {
    setAuthSession(token, {
      id: authUser.id,
      fullName: authUser.fullName,
      email: authUser.email || "",
      phone: authUser.phone || "",
      password,
    });
    setMessage("Account created successfully!");
    setMessageType("success");
    setTimeout(() => onSuccess?.(), 800);
  };

  const sendOtp = async () => {
    if (!fullName || !contact || !password) {
      setMessage("Please fill all fields");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const formattedContact = formatIdentifier(contact);
      const isEmail = formattedContact.includes("@");

      if (!isEmail) {
        const { sendPhoneOtp } = await import("@/lib/firebase");
        const ok = await sendPhoneOtp(formattedContact);
        if (!ok) throw new Error("Failed to send phone OTP");

        setOtpSent(true);
        setContact(formattedContact);
        setMessage("OTP sent successfully to your phone");
        setMessageType("success");
        return;
      }

      const response = await fetch(apiUrl("/api/auth/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: formattedContact }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to send OTP");

      setOtpSent(true);
      setContact(formattedContact);
      setMessage(`OTP sent successfully to your ${data.type}`);
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
      setMessage("Please enter OTP");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const isEmail = contact.includes("@");

      if (!isEmail) {
        const { verifyPhoneOtp, clearPhoneConfirmation } = await import("@/lib/firebase");
        const result = await verifyPhoneOtp(otp, contact);
        if (!result?.success) throw new Error(result?.error || "Invalid phone OTP");
        clearPhoneConfirmation();
      } else {
        const verifyResponse = await fetch(apiUrl("/api/auth/verify-otp"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: contact, otp }),
        });

        if (!verifyResponse.ok) {
          const data = await verifyResponse.json();
          throw new Error(data.message || "Invalid OTP");
        }
      }

      const signupResponse = await fetch(apiUrl("/api/auth/signup-with-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, identifier: contact, password }),
      });

      const signupData = await signupResponse.json();
      if (!signupResponse.ok) throw new Error(signupData.message || "Signup failed");

      handleAuthSuccess(signupData.token, signupData.user);
    } catch (error: unknown) {
      const err = error as { message?: string };
      setMessage(err.message || "Signup failed");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.success) throw new Error(result.error || "Google login failed");

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
      if (!response.ok) throw new Error(data.message || "Google signup failed");

      handleAuthSuccess(data.token, data.user);
    } catch (error: unknown) {
      const err = error as { message?: string };
      setMessage(err.message || "Google login failed");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <img
            src={logo}
            alt="FairFoods"
            className="w-16 h-16 object-contain drop-shadow-md"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome to <span className="text-green-600">FairFoods</span>
        </h2>
        <p className="text-xs text-gray-500">
          Fresh food • Fast delivery • Best experience 🍔
        </p>
      </div>

      <div className="space-y-3">
        <Input
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={otpSent}
        />

        <Input
          placeholder="Email or Phone Number"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          disabled={otpSent}
        />

        <div className="relative">
          <Input
            placeholder="Password"
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={otpSent}
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-2.5 text-gray-500"
          >
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {!otpSent && (
          <Button
            onClick={sendOtp}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2"
          >
            {loading && <Loader size={16} className="animate-spin" />}
            Send OTP
          </Button>
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

        {otpSent && (
          <div className="space-y-3 mt-2">
            <p className="text-xs text-green-600 font-medium">
              ✓ OTP sent successfully. Check your {contact.includes("@") ? "email" : "phone"}
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
              Verify & Create Account
            </Button>

            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
              }}
              className="w-full text-xs text-gray-500 hover:text-green-600"
            >
              Didn&apos;t receive OTP? Go back
            </button>
          </div>
        )}
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

      {!otpSent && (
        <p className="text-center text-xs text-gray-500">
          Already have account?{" "}
          <button
            type="button"
            onClick={onLoginClick}
            className="text-green-600 font-medium"
          >
            Login
          </button>
        </p>
      )}
    </div>
  );
}
