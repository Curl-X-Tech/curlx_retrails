import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { LoaderLayout } from "@/components/layout/loader-layout";
import { DriverLayout } from "@/components/layout/driver-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { getActiveDomainRole, getRoleHomePath } from "@/lib/domain-routing";
import { useAuth } from "@/context/auth-context";

// Direct Page Imports (No dynamic lazy suspense delays)
import { LoginPage } from "@/pages/auth/login-page";
import { LiveMapPage } from "@/pages/dispatcher/live-map-page";
import { AllocationSummaryPage } from "@/pages/dispatcher/allocation-summary-page";
import { AllocationDetailPage } from "@/pages/dispatcher/allocation-detail-page";
import { OrderQueuePage } from "@/pages/dispatcher/order-queue-page";
import { DeferralsPage } from "@/pages/dispatcher/deferrals-page";

import { LoaderBaysPage } from "@/pages/loader/loader-bays-page";
import { LoaderManifestsPage } from "@/pages/loader/loader-manifests-page";

import { DriverActiveTripPage } from "@/pages/driver/driver-active-trip-page";
import { DriverStopsPage } from "@/pages/driver/driver-stops-page";
import { DriverVehiclePage } from "@/pages/driver/driver-vehicle-page";
import { DriverUnloadingPage } from "@/pages/driver/driver-unloading-page";

import { StoreOrdersPage } from "@/pages/store/store-orders-page";
import { StoreCreateOrderPage } from "@/pages/store/store-create-order-page";
import { StoreDeferralsPage } from "@/pages/store/store-deferrals-page";
import { StoreDashboardPage } from "@/pages/store/store-dashboard-page";
import { StoreReportsPage } from "@/pages/store/store-reports-page";

import { AdminDashboardPage } from "@/pages/admin/admin-dashboard-page";
import { AdminOutletsPage } from "@/pages/admin/admin-outlets-page";
import { AdminDepotsPage } from "@/pages/admin/admin-depots-page";
import { AdminItemsPage } from "@/pages/admin/admin-items-page";
import { AdminCalendarPage } from "@/pages/admin/admin-calendar-page";

export function App() {
  const { user, isAuthenticated } = useAuth();
  const activeDomainRole = getActiveDomainRole();
  const rootDefaultPath =
    isAuthenticated && user
      ? getRoleHomePath(user.role)
      : activeDomainRole
        ? getRoleHomePath(activeDomainRole)
        : "/login";

  return (
    <Routes>
      {/* Authentication & Password Reset */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<LoginPage />} />

      {/* Root redirect to role-specific console or login */}
      <Route path="/" element={<Navigate to={rootDefaultPath} replace />} />

      {/* ----------------------------------------------------------- */}
      {/* 0. Protected System Admin Route Tree                         */}
      {/* ----------------------------------------------------------- */}
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route
        element={
          <ProtectedRoute allowedRoles={["system_admin"]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/outlets" element={<AdminOutletsPage />} />
        <Route path="/admin/depots" element={<AdminDepotsPage />} />
        <Route path="/admin/items" element={<AdminItemsPage />} />
        <Route path="/admin/calendar" element={<AdminCalendarPage />} />
        <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* ----------------------------------------------------------- */}
      {/* 1. Protected Dispatcher Route Tree (Planning & Fleet Ops)    */}
      {/* ----------------------------------------------------------- */}
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

        {/* Planning Routes */}
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

        {/* Operations Routes */}
        <Route path="/dispatcher/live-map" element={<LiveMapPage />} />
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

      {/* ----------------------------------------------------------- */}
      {/* 3. Protected Driver Route Tree (Mobile Field Driver UI)     */}
      {/* ----------------------------------------------------------- */}
      <Route path="/driver" element={<Navigate to="/driver/active" replace />} />
      <Route
        element={
          <ProtectedRoute allowedRoles={["driver"]}>
            <DriverLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/driver/active" element={<DriverActiveTripPage />} />
        <Route path="/driver/run" element={<Navigate to="/driver/active" replace />} />
        <Route path="/driver/stops" element={<DriverStopsPage />} />
        <Route path="/driver/vehicle" element={<DriverVehiclePage />} />
        <Route path="/driver/unload" element={<DriverUnloadingPage />} />
        <Route path="/driver/*" element={<Navigate to="/driver/active" replace />} />
      </Route>

      {/* ----------------------------------------------------------- */}
      {/* 4. Protected Store Manager Route Tree                       */}
      {/* ----------------------------------------------------------- */}
      <Route path="/store" element={<Navigate to="/store/orders" replace />} />
      <Route
        element={
          <ProtectedRoute allowedRoles={["store_manager"]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Store Dashboard & Alerts */}
        <Route path="/store/dashboard" element={<StoreDashboardPage />} />
        <Route
          path="/store/alerts"
          element={<Navigate to="/store/dashboard" replace />}
        />

        {/* Store Orders Queue & Creation */}
        <Route path="/store/orders" element={<StoreOrdersPage />} />
        <Route path="/store/queue" element={<Navigate to="/store/orders" replace />} />
        <Route path="/store/orders/new" element={<StoreCreateOrderPage />} />
        <Route
          path="/store/create-order"
          element={<Navigate to="/store/orders/new" replace />}
        />
        <Route
          path="/store/create"
          element={<Navigate to="/store/orders/new" replace />}
        />

        {/* Store Deferrals Workflow */}
        <Route
          path="/store/deferrals"
          element={<Navigate to="/store/deferrals/unserved" replace />}
        />
        <Route
          path="/store/deferrals/unserved"
          element={<StoreDeferralsPage viewMode="unserved" />}
        />
        <Route
          path="/store/deferrals/log"
          element={<StoreDeferralsPage viewMode="log" />}
        />
        <Route
          path="/store/deferrals/carryover"
          element={<StoreDeferralsPage viewMode="carryover" />}
        />

        {/* Store Reports */}
        <Route path="/store/reports" element={<StoreReportsPage />} />

        <Route path="/store/*" element={<Navigate to="/store/orders" replace />} />
      </Route>

      {/* Catch-all global fallback */}
      <Route path="*" element={<Navigate to={rootDefaultPath} replace />} />
    </Routes>
  );
}

export default App;
