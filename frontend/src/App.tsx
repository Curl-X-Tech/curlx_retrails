import * as React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { LoaderLayout } from "@/components/layout/loader-layout";
import { DriverLayout } from "@/components/layout/driver-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  DeferralsPageSkeleton,
  OrderQueuePageSkeleton,
  AllocationSummaryPageSkeleton,
  AllocationDetailPageSkeleton,
  LiveMapPageSkeleton,
  LoaderPageSkeleton,
} from "@/components/skeletons";

import { lazyWithDelay } from "@/lib/simulated-delay";
import { getActiveDomainRole } from "@/lib/domain-routing";

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

const LoaderBaysPage = lazyWithDelay(() =>
  import("@/pages/loader/loader-bays-page").then((m) => ({
    default: m.LoaderBaysPage,
  }))
);
const LoaderManifestsPage = lazyWithDelay(() =>
  import("@/pages/loader/loader-manifests-page").then((m) => ({
    default: m.LoaderManifestsPage,
  }))
);

const DriverActiveTripPage = lazyWithDelay(() =>
  import("@/pages/driver/driver-active-trip-page").then((m) => ({
    default: m.DriverActiveTripPage,
  }))
);
const DriverStopsPage = lazyWithDelay(() =>
  import("@/pages/driver/driver-stops-page").then((m) => ({
    default: m.DriverStopsPage,
  }))
);
const DriverVehiclePage = lazyWithDelay(() =>
  import("@/pages/driver/driver-vehicle-page").then((m) => ({
    default: m.DriverVehiclePage,
  }))
);

export function App() {
  const activeDomainRole = getActiveDomainRole();
  const rootDefaultPath =
    activeDomainRole === "loader"
      ? "/loader/manifests"
      : activeDomainRole === "driver"
        ? "/driver/active"
        : "/dispatcher/allocations";

  return (
    <Routes>
      {/* Root redirect depending on active subdomain / app */}
      <Route path="/" element={<Navigate to={rootDefaultPath} replace />} />

      {/* ----------------------------------------------------------- */}
      {/* 1. Protected Dispatcher & Admin Route Tree (Desktop UI)      */}
      {/* ----------------------------------------------------------- */}
      <Route
        path="/dispatcher"
        element={<Navigate to="/dispatcher/allocations" replace />}
      />
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

      {/* ----------------------------------------------------------- */}
      {/* 2. Protected Loader Route Tree (Glove-friendly Tablet UI)   */}
      {/* ----------------------------------------------------------- */}
      <Route path="/loader" element={<Navigate to="/loader/manifests" replace />} />
      <Route
        element={
          <ProtectedRoute allowedRoles={["loader", "system_admin", "dispatcher"]}>
            <LoaderLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/loader/manifests"
          element={
            <React.Suspense fallback={<LoaderPageSkeleton />}>
              <LoaderManifestsPage />
            </React.Suspense>
          }
        />
        <Route
          path="/loader/queue"
          element={<Navigate to="/loader/manifests" replace />}
        />
        <Route
          path="/loader/bays"
          element={
            <React.Suspense fallback={<LoaderPageSkeleton />}>
              <LoaderBaysPage />
            </React.Suspense>
          }
        />
        <Route path="/loader/*" element={<Navigate to="/loader/manifests" replace />} />
      </Route>

      {/* ----------------------------------------------------------- */}
      {/* 3. Protected Driver Route Tree (Mobile Field Driver UI)     */}
      {/* ----------------------------------------------------------- */}
      <Route path="/driver" element={<Navigate to="/driver/active" replace />} />
      <Route
        element={
          <ProtectedRoute allowedRoles={["driver", "system_admin", "dispatcher"]}>
            <DriverLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/driver/active"
          element={
            <React.Suspense fallback={<LoaderPageSkeleton />}>
              <DriverActiveTripPage />
            </React.Suspense>
          }
        />
        <Route path="/driver/run" element={<Navigate to="/driver/active" replace />} />
        <Route
          path="/driver/stops"
          element={
            <React.Suspense fallback={<LoaderPageSkeleton />}>
              <DriverStopsPage />
            </React.Suspense>
          }
        />
        <Route
          path="/driver/vehicle"
          element={
            <React.Suspense fallback={<LoaderPageSkeleton />}>
              <DriverVehiclePage />
            </React.Suspense>
          }
        />
        <Route path="/driver/*" element={<Navigate to="/driver/active" replace />} />
      </Route>

      {/* Catch-all global fallback */}
      <Route path="*" element={<Navigate to={rootDefaultPath} replace />} />
    </Routes>
  );
}

export default App;
