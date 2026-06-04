import { useEffect } from "react";
import { useLocation } from "wouter";
import { LoginForm } from "@/components/login-form";
import { useStore } from "@/lib/store";

export default function Login() {
  const { user } = useStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) setLocation("/profile");
  }, [user, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6fb] px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6">
        <LoginForm
          onSuccess={() => setLocation("/profile")}
          onSignupClick={() => setLocation("/signup")}
          onForgotPasswordClick={() => setLocation("/forgot-password")}
        />
      </div>
    </div>
  );
}
