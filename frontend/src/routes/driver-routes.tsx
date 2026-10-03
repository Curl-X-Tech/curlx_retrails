import { Route, Navigate } from "react-router-dom";
import { DriverLayout } from "@/components/layout/driver-layout";
import { ProtectedRoute } from "@/features/auth";
import { DriverTripsListPage } from "@/pages/driver/driver-trips-list-page";
import { DriverActiveTripPage } from "@/pages/driver/driver-active-trip-page";
import { DriverStopsPage } from "@/pages/driver/driver-stops-page";
import { DriverVehiclePage } from "@/pages/driver/driver-vehicle-page";
import { DriverUnloadingPage } from "@/pages/driver/driver-unloading-page";

export function DriverRoutes() {
  return (
    <>
      <Route path="/driver" element={<Navigate to="/driver/trips" replace />} />
      <Route
        element={
          <ProtectedRoute allowedRoles={["driver"]}>
            <DriverLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/driver/trips" element={<DriverTripsListPage />} />
        <Route path="/driver/active" element={<DriverActiveTripPage />} />
        <Route path="/driver/run" element={<Navigate to="/driver/active" replace />} />
        <Route path="/driver/stops" element={<DriverStopsPage />} />
        <Route path="/driver/vehicle" element={<DriverVehiclePage />} />
        <Route path="/driver/unload" element={<DriverUnloadingPage />} />
        <Route path="/driver/*" element={<Navigate to="/driver/trips" replace />} />
      </Route>
    </>
  );
}
