import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getRoleHomePath } from "@/lib/domain-routing";
import { requestPasswordReset, submitPasswordReset } from "@/lib/api";
import type { StaffRole } from "@/types/domain";
import {
  LockKeyIcon,
  EnvelopeSimpleIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  ArrowCounterClockwiseIcon,
  CheckCircleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const resetToken = searchParams.get("token");
  const redirectParam = searchParams.get("redirect");

  // View state: 'login' | 'forgot' | 'reset'
  const [viewState, setViewState] = React.useState<"login" | "forgot" | "reset">(
    resetToken ? "reset" : "login"
  );

  // Form states
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [newPassword, setNewPassword] = React.useState<string>("");
  const [confirmPassword, setConfirmPassword] = React.useState<string>("");
  const [showPassword, setShowPassword] = React.useState<boolean>(false);

  // Status and feedback
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      const stored = localStorage.getItem("retrails_user");
      let role: StaffRole = "dispatcher";
      if (stored) {
        try {
          role = (JSON.parse(stored) as { role?: StaffRole }).role || "dispatcher";
        } catch {
          // fallback
        }
      }
      const targetPath = redirectParam || getRoleHomePath(role);
      navigate(targetPath, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage("Please enter your account email address.");
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSuccessMessage(
        "Password reset instructions have been generated. Check your inbox or dev outbox."
      );
    } catch {
      setErrorMessage("Unable to dispatch password reset request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) {
      setErrorMessage("Missing or invalid password reset token.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await submitPasswordReset(resetToken, newPassword);
      setSuccessMessage("Password reset successfully. You may now log in.");
      setTimeout(() => {
        setViewState("login");
        setSuccessMessage(null);
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Password reset failed.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background p-3 sm:p-5 lg:p-6 font-sans select-none">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 bg-card rounded-3xl border border-border/80 shadow-xs overflow-hidden">
        {/* 1. Left Showcase Panel: Clean Visual Image */}
        <div className="hidden lg:block lg:col-span-6 xl:col-span-7 relative overflow-hidden rounded-2xl bg-muted m-2">
          <img
            src="/assets/login-image.jpg"
            alt="ReTrails Operations Showcase"
            className="size-full object-cover"
          />
        </div>

        {/* 2. Right Auth Section: Clean, Minimalist Form */}
        <div className="col-span-12 lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12">
          {/* Center: Auth Form Container */}
          <div className="w-full max-w-sm mx-auto my-auto space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="size-14 rounded-2xl bg-background border border-border/80 p-2 shadow-xs overflow-hidden flex items-center justify-center">
                <img
                  src="/icon.png"
                  alt="ReTrails Logo"
                  className="size-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
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

            {/* Feedback Alerts */}
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

            {/* Login Form */}
            {viewState === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Email Address
                  </label>
                  <div className="relative">
                    <EnvelopeSimpleIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="dispatcher@curlx.tech"
                      className="pl-10 h-10 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setViewState("forgot");
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <LockKeyIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-10 rounded-xl text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="size-4" />
                      ) : (
                        <EyeIcon className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-xl font-semibold gap-2 mt-2 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <ArrowCounterClockwiseIcon className="size-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRightIcon className="size-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Forgot Password Form */}
            {viewState === "forgot" && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Account Email
                  </label>
                  <div className="relative">
                    <EnvelopeSimpleIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@curlx.tech"
                      className="pl-10 h-10 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-xl font-semibold gap-2 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <ArrowCounterClockwiseIcon className="size-4 animate-spin" />
                      Dispatching Reset Request...
                    </>
                  ) : (
                    "Send Password Reset Link"
                  )}
                </Button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setViewState("login");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* Reset Password Form */}
            {viewState === "reset" && (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    New Password
                  </label>
                  <div className="relative">
                    <LockKeyIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="pl-10 h-10 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <LockKeyIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="pl-10 h-10 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-xl font-semibold gap-2 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <ArrowCounterClockwiseIcon className="size-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    "Set New Password"
                  )}
                </Button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setViewState("login");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Bottom Footer */}
          <div className="text-center text-[11px] text-muted-foreground pt-6">
            ReTrails Transit &amp; Fleet Operating System &bull; Team CurlX
          </div>
        </div>
      </div>
    </div>
  );
}
