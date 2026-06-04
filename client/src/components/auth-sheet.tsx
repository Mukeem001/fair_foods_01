import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SignupForm } from "@/components/signup-form";
import { LoginForm } from "@/components/login-form";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export type AuthView = "signup" | "login" | "forgot-password";

const viewTitles: Record<AuthView, string> = {
  signup: "Sign up",
  login: "Login",
  "forgot-password": "Forgot password",
};

type AuthSheetProps = {
  open: boolean;
  view: AuthView;
  onOpenChange: (open: boolean) => void;
  onViewChange: (view: AuthView) => void;
  onSuccess?: () => void;
};

export function AuthSheet({
  open,
  view,
  onOpenChange,
  onViewChange,
  onSuccess,
}: AuthSheetProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="left-1/2 right-auto w-full max-w-[420px] -translate-x-1/2 rounded-t-3xl max-h-[92vh] overflow-y-auto px-4 pb-8"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{viewTitles[view]}</SheetTitle>
        </SheetHeader>

        <div id="recaptcha-container" className="hidden" aria-hidden="true" />

        {view === "signup" && (
          <SignupForm
            onSuccess={handleSuccess}
            onLoginClick={() => onViewChange("login")}
          />
        )}

        {view === "login" && (
          <LoginForm
            onSuccess={handleSuccess}
            onSignupClick={() => onViewChange("signup")}
            onForgotPasswordClick={() => onViewChange("forgot-password")}
          />
        )}

        {view === "forgot-password" && (
          <ForgotPasswordForm onLoginClick={() => onViewChange("login")} />
        )}
      </SheetContent>
    </Sheet>
  );
}
