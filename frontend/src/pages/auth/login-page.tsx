import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { LoginForm } from "@/features/auth/components/login-form";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import type { AuthViewState } from "@/features/auth/types";

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [viewState, setViewState] = React.useState<AuthViewState>(
    resetToken ? "reset" : "login"
  );
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const handleSwitchView = (nextView: AuthViewState) => {
    setViewState(nextView);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  return (
    <div className="min-h-dvh w-full grid grid-cols-1 lg:grid-cols-12 bg-background p-4 sm:p-6 lg:p-8 font-sans select-none gap-6 lg:gap-12">
      {/* 1. Left Showcase Frame */}
      <div className="hidden lg:block lg:col-span-6 xl:col-span-7 relative overflow-hidden rounded-3xl bg-muted border border-border/70 shadow-xs min-h-[580px] h-full">
        <img
          src="/assets/login-image.jpg"
          alt="ReTrails Operations Showcase"
          className="size-full object-cover"
        />
      </div>

      {/* 2. Right Direct Auth Section */}
      <div className="col-span-12 lg:col-span-6 xl:col-span-5 flex flex-col justify-between py-4 sm:py-8 lg:py-10">
        <div className="w-full max-w-sm mx-auto my-auto space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="size-14 rounded-2xl bg-card border border-border/80 p-2 shadow-xs overflow-hidden flex items-center justify-center">
              <img
                src="/icon.png"
                alt="ReTrails Logo"
                className="size-full object-contain"
              />
            </div>
            <div className="space-y-1">
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground tracking-tight text-balance">
                {viewState === "login" && "Welcome to ReTrails"}
                {viewState === "forgot" && "Reset Password"}
                {viewState === "reset" && "Choose New Password"}
              </h1>
              <p className="text-xs text-muted-foreground font-normal">
                {viewState === "login" &&
                  "Sign in to access your operations and fleet console"}
                {viewState === "forgot" &&
                  "Enter your email address to receive reset instructions"}
                {viewState === "reset" &&
                  "Enter your new secure password to restore access"}
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              <WarningCircleIcon className="size-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <CheckCircleIcon className="size-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {viewState === "login" && (
            <LoginForm
              onSwitchToForgot={() => handleSwitchView("forgot")}
              onError={setErrorMessage}
            />
          )}

          {viewState === "forgot" && (
            <ForgotPasswordForm
              onBackToLogin={() => handleSwitchView("login")}
              onError={setErrorMessage}
              onSuccess={setSuccessMessage}
            />
          )}

          {viewState === "reset" && (
            <ResetPasswordForm
              resetToken={resetToken}
              onBackToLogin={() => handleSwitchView("login")}
              onError={setErrorMessage}
              onSuccess={setSuccessMessage}
            />
          )}
        </div>

        <div className="text-center text-[11px] text-muted-foreground pt-6">
          ReTrails Transit &amp; Fleet Operating System &bull; Team CurlX
        </div>
      </div>
    </div>
  );
}
