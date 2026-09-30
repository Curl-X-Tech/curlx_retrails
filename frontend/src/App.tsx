import * as React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  DeferralsPageSkeleton,
  OrderQueuePageSkeleton,
  AllocationSummaryPageSkeleton,
  AllocationDetailPageSkeleton,
  LiveMapPageSkeleton,
} from "@/components/skeletons";

import { lazyWithDelay } from "@/lib/simulated-delay";

const LiveMapPage = lazyWithDelay(() =>
  import("@/pages/dispatcher/live-map-page").then((m) => ({
    default: m.LiveMapPage,
  }))
);
const AllocationSummaryPage = lazyWithDelay(() =>
  import("@/pages/dispatcher/allocation-summary-page").then((m) => ({
    default: m.AllocationSummaryPage,
  }))
);
const AllocationDetailPage = lazyWithDelay(() =>
  import("@/pages/dispatcher/allocation-detail-page").then((m) => ({
    default: m.AllocationDetailPage,
  }))
);
const OrderQueuePage = lazyWithDelay(() =>
  import("@/pages/dispatcher/order-queue-page").then((m) => ({
    default: m.OrderQueuePage,
  }))
);
const DeferralsPage = lazyWithDelay(() =>
  import("@/pages/dispatcher/deferrals-page").then((m) => ({
    default: m.DeferralsPage,
  }))
);

export function App() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dispatcher/allocations" replace />} />
      <Route
        path="/dispatcher"
        element={<Navigate to="/dispatcher/allocations" replace />}
      />

      {/* Protected Dispatcher & Admin Route Tree */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["dispatcher", "system_admin"]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dispatcher/dashboard"
          element={<Navigate to="/dispatcher/allocations" replace />}
        />

        {/* Planning Routes */}
        <Route
          path="/dispatcher/orders"
          element={
            <React.Suspense fallback={<OrderQueuePageSkeleton />}>
              <OrderQueuePage />
            </React.Suspense>
          }
        />
        <Route
          path="/dispatcher/allocations"
          element={
            <React.Suspense fallback={<AllocationSummaryPageSkeleton />}>
              <AllocationSummaryPage />
            </React.Suspense>
          }
        />
        <Route
          path="/dispatcher/allocations/:id"
          element={
            <React.Suspense fallback={<AllocationDetailPageSkeleton />}>
              <AllocationDetailPage />
            </React.Suspense>
          }
        />
        <Route
          path="/dispatcher/deferrals"
          element={<Navigate to="/dispatcher/deferrals/carryover" replace />}
        />
        <Route
          path="/dispatcher/deferrals/carryover"
          element={
            <React.Suspense fallback={<DeferralsPageSkeleton isAuditLog={false} />}>
              <DeferralsPage viewMode="carryover" />
            </React.Suspense>
          }
        />
        <Route
          path="/dispatcher/deferrals/audit-log"
          element={
            <React.Suspense fallback={<DeferralsPageSkeleton isAuditLog={true} />}>
              <DeferralsPage viewMode="audit-log" />
            </React.Suspense>
          }
        />
        <Route
          path="/dispatcher/deferrals/deferral-log"
          element={<Navigate to="/dispatcher/deferrals/audit-log" replace />}
        />

        {/* Operations Routes */}
        <Route
          path="/dispatcher/live-map"
          element={
            <React.Suspense fallback={<LiveMapPageSkeleton />}>
              <LiveMapPage />
            </React.Suspense>
          }
        />
        <Route
          path="/dispatcher/live-tracking"
          element={<Navigate to="/dispatcher/live-map" replace />}
        />

        {/* Fallback for unmatched dispatcher routes */}
        <Route
          path="/dispatcher/*"
          element={<Navigate to="/dispatcher/allocations" replace />}
        />
      </Route>

      {/* Catch-all global fallback */}
      <Route path="*" element={<Navigate to="/dispatcher/allocations" replace />} />
    </Routes>
  );
}

export default App;
