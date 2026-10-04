import { Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/features/auth";
import { StoreOrdersPage } from "@/pages/store/store-orders-page";
import { StoreCreateOrderPage } from "@/pages/store/store-create-order-page";
import { StoreReceivingPage } from "@/pages/store/store-receiving-page";
import { StoreDeferralsPage } from "@/pages/store/store-deferrals-page";
import { StoreDashboardPage } from "@/pages/store/store-dashboard-page";
import { StoreReportsPage } from "@/pages/store/store-reports-page";

export function StoreRoutes() {
  return (
    <>
      <Route path="/store" element={<Navigate to="/store/dashboard" replace />} />
      <Route
        element={
          <ProtectedRoute allowedRoles={["store_manager"]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/store/dashboard" element={<StoreDashboardPage />} />
        <Route
          path="/store/alerts"
          element={<Navigate to="/store/dashboard" replace />}
        />
        <Route path="/store/orders" element={<StoreOrdersPage />} />
        <Route path="/store/queue" element={<Navigate to="/store/orders" replace />} />
        <Route path="/store/orders/new" element={<StoreCreateOrderPage />} />
        <Route path="/store/receiving" element={<StoreReceivingPage />} />
        <Route
          path="/store/inbound"
          element={<Navigate to="/store/receiving" replace />}
        />
        <Route
          path="/store/inbound-receiving"
          element={<Navigate to="/store/receiving" replace />}
        />

        <Route
          path="/store/create-order"
          element={<Navigate to="/store/orders/new" replace />}
        />
        <Route
          path="/store/create"
          element={<Navigate to="/store/orders/new" replace />}
        />
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
        <Route path="/store/reports" element={<StoreReportsPage />} />
        <Route path="/store/*" element={<Navigate to="/store/orders" replace />} />
      </Route>
    </>
  );
}
