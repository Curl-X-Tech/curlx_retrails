import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getRoleHomePath } from "@/lib/domain-routing";
import { requestPasswordReset, submitPasswordReset } from "@/lib/api";
import type { StaffRole } from "@/types/domain";
import {
  LockKeyIcon,
  EnvelopeSimpleIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  TruckIcon,
  PackageIcon,
  StorefrontIcon,
  GaugeIcon,
  ShieldCheckIcon,
  ArrowCounterClockwiseIcon,
  CheckCircleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";

interface RolePreset {
  role: StaffRole;
  label: string;
  email: string;
  icon: React.ElementType;
}

const ROLE_PRESETS: RolePreset[] = [
  {
    role: "dispatcher",
    label: "Dispatcher",
    email: "dispatcher@curlx.tech",
    icon: GaugeIcon,
  },
  {
    role: "driver",
    label: "Driver",
    email: "driver@curlx.tech",
    icon: TruckIcon,
  },
  {
    role: "loader",
    label: "Bay Loader",
    email: "loader@curlx.tech",
    icon: PackageIcon,
  },
  {
    role: "store_manager",
    label: "Store Manager",
    email: "store@curlx.tech",
    icon: StorefrontIcon,
  },
  {
    role: "system_admin",
    label: "Administrator",
    email: "admin@curlx.tech",
    icon: ShieldCheckIcon,
  },
];

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, user } = useAuth();

  const resetToken = searchParams.get("token");
  const redirectParam = searchParams.get("redirect");

  // View state: 'login' | 'forgot' | 'reset'
  const [viewState, setViewState] = React.useState<"login" | "forgot" | "reset">(
    resetToken ? "reset" : "login"
  );

  // Form states
  const [email, setEmail] = React.useState<string>("dispatcher@curlx.tech");
  const [password, setPassword] = React.useState<string>("Password123!");
  const [newPassword, setNewPassword] = React.useState<string>("");
  const [confirmPassword, setConfirmPassword] = React.useState<string>("");
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [selectedRole, setSelectedRole] = React.useState<StaffRole>("dispatcher");

  // Status and feedback
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const handleSelectPreset = (preset: RolePreset) => {
    setSelectedRole(preset.role);
    setEmail(preset.email);
    setPassword("Password123!");
    setErrorMessage(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      // Attempt live API authentication with credentials
      await login({ email, password });
      const targetRole = user?.role || selectedRole;
      const targetPath = redirectParam || getRoleHomePath(targetRole);
      navigate(targetPath, { replace: true });
    } catch {
      // If live backend auth fails, fallback to local role session for seamless offline / demo workflow
      try {
        await login(selectedRole);
        const targetPath = redirectParam || getRoleHomePath(selectedRole);
        navigate(targetPath, { replace: true });
      } catch (fallbackErr: unknown) {
        const message =
          fallbackErr instanceof Error ? fallbackErr.message : "Authentication failed.";
        setErrorMessage(message);
      }
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
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-card border border-border/80 p-2 mb-1 shadow-sm overflow-hidden">
            <img
              src="/icon.png"
              alt="ReTrails Logo"
              className="size-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight">
            ReTrails
          </h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Fleet & Transit Operations Hub
          </p>
        </div>

        {/* Role Quick-Select Presets */}
        {viewState === "login" && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Select Enterprise Role
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ROLE_PRESETS.map((preset) => {
                const IconComponent = preset.icon;
                const isSelected = selectedRole === preset.role;
                return (
                  <button
                    key={preset.role}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-foreground text-background border-foreground shadow-sm"
                        : "bg-card hover:bg-accent text-card-foreground border-border"
                    }`}
                  >
                    <IconComponent className="size-4 shrink-0" />
                    <span className="truncate w-full text-center">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Auth Card */}
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-heading">
              {viewState === "login" && "Sign In"}
              {viewState === "forgot" && "Reset Password"}
              {viewState === "reset" && "Choose New Password"}
            </CardTitle>
            <CardDescription className="text-xs">
              {viewState === "login" &&
                `Authenticating as ${
                  ROLE_PRESETS.find((p) => p.role === selectedRole)?.label
                }`}
              {viewState === "forgot" &&
                "Enter your account email to receive a password reset token."}
              {viewState === "reset" && "Set a new permanent account password."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Feedback Alerts */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                <WarningCircleIcon className="size-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-start gap-2.5 p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
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
                    <EnvelopeSimpleIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@curlx.tech"
                      className="pl-9 text-sm"
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
                      className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <LockKeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9 pr-9 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                  className="w-full font-semibold gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <ArrowCounterClockwiseIcon className="size-4 animate-spin" />
                      Authenticating...
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
                    <EnvelopeSimpleIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@curlx.tech"
                      className="pl-9 text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full font-semibold gap-2"
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
                    className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
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
                    <LockKeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="pl-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <LockKeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="pl-9 text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full font-semibold gap-2"
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
                    className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* System Footer */}
        <div className="text-center text-[11px] text-muted-foreground">
          ReTrails Transit & Fleet Operating System &bull; Team CurlX
        </div>
      </div>
    </div>
  );
}
