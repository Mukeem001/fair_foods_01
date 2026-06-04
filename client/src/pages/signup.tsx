import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UtensilsCrossed, Eye, EyeOff, Loader } from "lucide-react";
import logo from "@/assets/logo.png";
import { signInWithGoogle } from "@/lib/firebase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function Signup() {
  const [, setLocation] = useLocation();

  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState(""); // email or phone
  const [password, setPassword] = useState("");

  const [showPass, setShowPass] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem("token");
    if (token) {
      setLocation("/profile");
    }
  }, []);

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

  const sendOtp = async () => {
    if (!fullName || !contact || !password) {
      setMessage("Please fill all fields");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const formattedContact = formatPhoneNumber(contact);

      const isEmail = formattedContact.includes("@");

      // IMPORTANT: Phone OTP should be sent via Firebase SMS (not backend demo sendSmsOtp)
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

      // Email OTP goes through backend SMTP
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: formattedContact }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      setOtpSent(true);
      setContact(formattedContact);
      setMessage(`OTP sent successfully to your ${data.type}`);
      setMessageType("success");
    } catch (error: any) {
      setMessage(error.message || "Failed to send OTP");
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

      // IMPORTANT: For phone OTP, verify using Firebase first.
      if (!isEmail) {
        const { verifyPhoneOtp, clearPhoneConfirmation } = await import("@/lib/firebase");
        const result = await verifyPhoneOtp(otp, contact);

        if (!result?.success) {
          throw new Error(result?.error || "Invalid phone OTP");
        }

        // Cleanup
        clearPhoneConfirmation();
      } else {
        // Email OTP verification via backend
        const verifyResponse = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: contact, otp }),
        });

        if (!verifyResponse.ok) {
          const data = await verifyResponse.json();
          throw new Error(data.message || "Invalid OTP");
        }
      }

      // Signup (server persists user)
      const signupResponse = await fetch(`${API_BASE_URL}/api/auth/signup-with-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, identifier: contact, password }),
      });

      const signupData = await signupResponse.json();

      if (!signupResponse.ok) {
        throw new Error(signupData.message || "Signup failed");
      }

      localStorage.setItem("token", signupData.token);
      setMessage("Account created successfully!");
      setMessageType("success");

      setTimeout(() => {
        setLocation("/profile");
      }, 1000);
    } catch (error: any) {
      setMessage(error.message || "Signup failed");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();

      if (!result.success) {
        throw new Error(result.error || "Google login failed");
      }

      // Send Google token to backend to create/update user
      const response = await fetch(`${API_BASE_URL}/api/auth/google-login`, {
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
        throw new Error(data.message || "Google signup failed");
      }

      // Save token and redirect
      localStorage.setItem("token", data.token);
      setMessage("Account created successfully!");
      setMessageType("success");

      setTimeout(() => {
        setLocation("/profile");
      }, 1000);
    } catch (error: any) {
      setMessage(error.message || "Google login failed");
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
              className="w-16 h-16 object-contain drop-shadow-md"
            />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Welcome to <span className="text-green-600">FairFoods</span>
          </h1>

          <p className="text-xs text-gray-500">
            Fresh food • Fast delivery • Best experience 🍔
          </p>

        </div>

        {/* FORM */}
        {/* Firebase Phone Auth requires a Recaptcha container in DOM */}
        <div id="recaptcha-container" style={{ display: "none" }} />

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

          {/* PASSWORD */}
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

          {/* SEND OTP */}
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

          {/* GOOGLE LOGIN */}
          <button
            onClick={googleLogin}
            disabled={otpSent || loading}
            className="w-full border rounded-xl py-2 text-sm flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader size={16} className="animate-spin" />}
            🌐 {loading ? "Signing in..." : "Continue with Google"}
          </button>

          {/* OTP BOX */}
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
              <button></button>

              <button
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                }}
                className="w-full text-xs text-gray-500 hover:text-green-600"
              >
                Didn't receive OTP? Go back
              </button>

            </div>
          )}
        </div>

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
        {!otpSent && (
          <p className="text-center text-xs text-gray-500">
            Already have account?{" "}
            <Link href="/login" className="text-green-600 font-medium">
              Login
            </Link>
          </p>
        )}

      </div>
    </div>
  );
}