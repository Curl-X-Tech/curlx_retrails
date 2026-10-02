import * as React from "react";
import { Navigate, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import type { StaffRole } from "@/types/domain";
import { WarningOctagonIcon, SignOutIcon, HouseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { getRoleHomePath } from "@/lib/domain-routing";

interface ProtectedRouteProps {
  allowedRoles?: StaffRole[];
  children?: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, role, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">
            Verifying console authorization...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    const searchParams = new URLSearchParams({
      redirect: location.pathname + location.search,
    });
    return <Navigate to={`/login?${searchParams.toString()}`} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    const roleHome = getRoleHomePath(role);

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
          <WarningOctagonIcon className="size-7" />
        </div>
        <h2 className="text-xl font-heading font-bold text-foreground">
          Restricted Role Access
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
          Your account role (
          <span className="text-foreground font-semibold capitalize">
            {role.replace("_", " ")}
          </span>
          ) does not have authorization to access this console module.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <Button
            variant="default"
            size="sm"
            className="gap-1.5 cursor-pointer"
            onClick={() => navigate(roleHome, { replace: true })}
          >
            <HouseIcon className="size-4" />
            <span>Return to My Console</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 cursor-pointer text-destructive hover:text-destructive"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            <SignOutIcon className="size-4" />
            <span>Log Out</span>
          </Button>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
}

export default ProtectedRoute;
