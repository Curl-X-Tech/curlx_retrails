import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  LockKeyIcon,
  EnvelopeSimpleIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  ArrowCounterClockwiseIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getRoleHomePath } from "@/lib/domain-routing";
import type { StaffRole } from "@/types/domain";
import { useAuth } from "../hooks/use-auth";

interface LoginFormProps {
  onSwitchToForgot: () => void;
  onError: (msg: string | null) => void;
}

export function LoginForm({ onSwitchToForgot, onError }: LoginFormProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const redirectParam = searchParams.get("redirect");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onError(null);
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
      onError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Email Address</label>
        <div className="relative">
          <EnvelopeSimpleIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="dispatcher@curlx.tech"
            className="pl-10 h-10 rounded-xl text-sm bg-card border-border/80"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">Password</label>
          <button
            type="button"
            onClick={onSwitchToForgot}
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
            className="pl-10 pr-10 h-10 rounded-xl text-sm bg-card border-border/80"
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
  );
}
