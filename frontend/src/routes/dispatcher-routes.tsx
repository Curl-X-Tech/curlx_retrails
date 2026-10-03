import { Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/features/auth";
import { LiveMapPage } from "@/pages/dispatcher/live-map-page";
import { AllocationSummaryPage } from "@/pages/dispatcher/allocation-summary-page";
import { AllocationDetailPage } from "@/pages/dispatcher/allocation-detail-page";
import { OrderQueuePage } from "@/pages/dispatcher/order-queue-page";
import { DeferralsPage } from "@/pages/dispatcher/deferrals-page";

export function DispatcherRoutes() {
  return (
    <>
      <Route
        path="/dispatcher"
        element={<Navigate to="/dispatcher/allocations" replace />}
      />
      <Route
        element={
          <ProtectedRoute allowedRoles={["dispatcher"]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dispatcher/dashboard"
          element={<Navigate to="/dispatcher/allocations" replace />}
        />
        <Route path="/dispatcher/orders" element={<OrderQueuePage />} />
        <Route path="/dispatcher/allocations" element={<AllocationSummaryPage />} />
        <Route path="/dispatcher/allocations/:id" element={<AllocationDetailPage />} />
        <Route
          path="/dispatcher/deferrals"
          element={<Navigate to="/dispatcher/deferrals/carryover" replace />}
        />
        <Route
          path="/dispatcher/deferrals/carryover"
          element={<DeferralsPage viewMode="carryover" />}
        />
        <Route
          path="/dispatcher/deferrals/audit-log"
          element={<DeferralsPage viewMode="audit-log" />}
        />
        <Route
          path="/dispatcher/deferrals/deferral-log"
          element={<Navigate to="/dispatcher/deferrals/audit-log" replace />}
        />
        <Route path="/dispatcher/live-map" element={<LiveMapPage />} />
        <Route
          path="/dispatcher/live-tracking"
          element={<Navigate to="/dispatcher/live-map" replace />}
        />
        <Route
          path="/dispatcher/*"
          element={<Navigate to="/dispatcher/allocations" replace />}
        />
      </Route>
    </>
  );
}
