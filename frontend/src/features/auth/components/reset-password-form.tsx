import * as React from "react";
import { LockKeyIcon, ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitPasswordReset } from "@/lib/api";

interface ResetPasswordFormProps {
  resetToken: string | null;
  onBackToLogin: () => void;
  onError: (msg: string | null) => void;
  onSuccess: (msg: string | null) => void;
}

export function ResetPasswordForm({
  resetToken,
  onBackToLogin,
  onError,
  onSuccess,
}: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) {
      onError("Missing or invalid password reset token.");
      return;
    }
    if (newPassword.length < 8) {
      onError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      onError("Passwords do not match.");
      return;
    }
    onError(null);
    setIsSubmitting(true);
    try {
      await submitPasswordReset(resetToken, newPassword);
      onSuccess("Password reset successfully. You may now log in.");
      setTimeout(() => {
        onBackToLogin();
        onSuccess(null);
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Password reset failed.";
      onError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            className="pl-10 h-10 rounded-xl text-sm bg-card border-border/80"
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
            className="pl-10 h-10 rounded-xl text-sm bg-card border-border/80"
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
          onClick={onBackToLogin}
          className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
        >
          Back to Sign In
        </button>
      </div>
    </form>
  );
}
