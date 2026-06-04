import { useEffect } from "react";
import { useLocation } from "wouter";
import { SignupForm } from "@/components/signup-form";
import { useStore } from "@/lib/store";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { user } = useStore();

  useEffect(() => {
    if (user) setLocation("/profile");
  }, [user, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6fb] px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6">
        <SignupForm
          onSuccess={() => setLocation("/profile")}
          onLoginClick={() => setLocation("/login")}
        />
      </div>
    </div>
  );
}
