import { Routes, Route, Navigate } from "react-router-dom";
import { getActiveDomainRole, getRoleHomePath } from "@/lib/domain-routing";
import { useAuth } from "@/context/auth-context";
import { LoginPage } from "@/pages/auth/login-page";
import { AdminRoutes } from "@/routes/admin-routes";
import { DispatcherRoutes } from "@/routes/dispatcher-routes";
import { LoaderRoutes } from "@/routes/loader-routes";
import { DriverRoutes } from "@/routes/driver-routes";
import { StoreRoutes } from "@/routes/store-routes";
import * as React from "react";
import { startSync, stopSync } from "@/sync";

export function App() {
  const { user, isAuthenticated } = useAuth();
  const activeDomainRole = getActiveDomainRole();
  const rootDefaultPath =
    isAuthenticated && user
      ? getRoleHomePath(user.role)
      : activeDomainRole
        ? getRoleHomePath(activeDomainRole)
        : "/login";

  React.useEffect(() => {
    startSync();
    return () => stopSync();
  }, []);

  return (
    <Routes>
      {/* Authentication & Password Reset */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<LoginPage />} />

      {/* Root redirect to role-specific console or login */}
      <Route path="/" element={<Navigate to={rootDefaultPath} replace />} />

      {/* Role-based Route Subtrees */}
      {AdminRoutes()}
      {DispatcherRoutes()}
      {LoaderRoutes()}
      {DriverRoutes()}
      {StoreRoutes()}

      {/* Catch-all global fallback */}
      <Route path="*" element={<Navigate to={rootDefaultPath} replace />} />
    </Routes>
  );
}

export default App;
