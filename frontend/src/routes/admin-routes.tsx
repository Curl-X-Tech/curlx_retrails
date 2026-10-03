import { Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/features/auth";
import { AdminOutletsPage } from "@/pages/admin/admin-outlets-page";
import { AdminDepotsPage } from "@/pages/admin/admin-depots-page";
import { AdminItemsPage } from "@/pages/admin/admin-items-page";
import { AdminCalendarPage } from "@/pages/admin/admin-calendar-page";
import { AdminUsersPage } from "@/pages/admin/admin-users-page";

export function AdminRoutes() {
  return (
    <>
      <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
      <Route
        element={
          <ProtectedRoute allowedRoles={["system_admin"]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<Navigate to="/admin/users" replace />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/outlets" element={<AdminOutletsPage />} />
        <Route path="/admin/depots" element={<AdminDepotsPage />} />
        <Route path="/admin/items" element={<AdminItemsPage />} />
        <Route path="/admin/calendar" element={<AdminCalendarPage />} />
        <Route path="/admin/*" element={<Navigate to="/admin/users" replace />} />
      </Route>
    </>
  );
}
