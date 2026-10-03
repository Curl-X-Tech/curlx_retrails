import { Route, Navigate } from "react-router-dom";
import { LoaderLayout } from "@/components/layout/loader-layout";
import { ProtectedRoute } from "@/features/auth";
import { LoaderBaysPage } from "@/pages/loader/loader-bays-page";
import { LoaderManifestsPage } from "@/pages/loader/loader-manifests-page";

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
        <Route
          path="/loader/queue"
          element={<Navigate to="/loader/manifests" replace />}
        />
        <Route path="/loader/bays" element={<LoaderBaysPage />} />
        <Route path="/loader/*" element={<Navigate to="/loader/manifests" replace />} />
      </Route>
    </>
  );
}
