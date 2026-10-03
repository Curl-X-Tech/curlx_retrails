import * as React from "react";
import {
  EnvelopeSimpleIcon,
  ArrowCounterClockwiseIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/lib/api";

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
  onError: (msg: string | null) => void;
  onSuccess: (msg: string | null) => void;
}

export function ForgotPasswordForm({
  onBackToLogin,
  onError,
  onSuccess,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      onError("Please enter your account email address.");
      return;
    }
    onError(null);
    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
      onSuccess(
        "Password reset instructions have been generated. Check your inbox or dev outbox."
      );
    } catch {
      onError("Unable to dispatch password reset request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            Dispatching Reset Request...
          </>
        ) : (
          "Send Password Reset Link"
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
