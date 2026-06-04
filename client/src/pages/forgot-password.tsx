import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { useLocation } from "wouter";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6fb] px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6">
        <ForgotPasswordForm onLoginClick={() => setLocation("/login")} />
      </div>
    </div>
  );
}
