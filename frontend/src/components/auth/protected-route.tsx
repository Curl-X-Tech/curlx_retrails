import * as React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import type { StaffRole } from "@/types/domain";
import { WarningOctagonIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  allowedRoles?: StaffRole[];
  children?: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, role, isAuthenticated, login } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    const searchParams = new URLSearchParams({
      redirect: location.pathname + location.search,
    });
    return <Navigate to={`/login?${searchParams.toString()}`} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
          <WarningOctagonIcon className="size-7" />
        </div>
        <h2 className="text-xl font-heading font-bold text-foreground">
          Restricted Role Access
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          Your current role (
          <span className="font-mono text-foreground font-semibold">{role}</span>) does
          not have authorization to view this resource.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
          <Button onClick={() => login("dispatcher")}>Switch to Dispatcher Role</Button>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
}
