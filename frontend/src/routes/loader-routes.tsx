import { Route, Navigate } from "react-router-dom";
import { LoaderLayout } from "@/components/layout/loader-layout";
import { ProtectedRoute } from "@/features/auth";
import { LoaderDashboardPage } from "@/pages/loader/loader-dashboard-page";
import { LoaderBaysPage } from "@/pages/loader/loader-bays-page";
import { LoaderManifestsPage } from "@/pages/loader/loader-manifests-page";
import { LoaderExceptionsPage } from "@/pages/loader/loader-exceptions-page";

export function LoaderRoutes() {
  return (
    <>
      <Route path="/loader" element={<Navigate to="/loader/manifests" replace />} />
      <Route
        element={
          <ProtectedRoute allowedRoles={["loader"]}>
            <LoaderLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/loader/manifests" element={<LoaderManifestsPage />} />
        <Route path="/loader/dashboard" element={<LoaderDashboardPage />} />
        <Route
          path="/loader/queue"
          element={<Navigate to="/loader/manifests" replace />}
        />
        <Route path="/loader/bays" element={<LoaderBaysPage />} />
        <Route path="/loader/exceptions" element={<LoaderExceptionsPage />} />
        <Route path="/loader/*" element={<Navigate to="/loader/manifests" replace />} />
      </Route>
    </>
  );
}
