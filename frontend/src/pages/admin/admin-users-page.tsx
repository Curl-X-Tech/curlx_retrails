import * as React from "react";
import { ArrowsClockwiseIcon, UserPlusIcon, UsersIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PageHeader, FilterBar, DataTable } from "@/components/shared";
import {
  useAdminUsers,
  useCreateAdminUser,
  useUpdateAdminUser,
  useDeleteAdminUser,
  UserMetrics,
  UserFilterControls,
  getUserColumns,
  UserDialogs,
  sortUsers,
  type UserSortKey,
} from "@/features/admin";
import type { MockUserWithMeta } from "@/data/mock-users";
import { cn } from "@/lib/utils";

export function AdminUsersPage() {
  const { data: users = [], isLoading, refetch, isRefetching } = useAdminUsers();
  const createMutation = useCreateAdminUser();
  const updateMutation = useUpdateAdminUser();
  const deleteMutation = useDeleteAdminUser();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sortKey, setSortKey] = React.useState<UserSortKey | null>("created_at");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<MockUserWithMeta | null>(null);
  const [deletingUser, setDeletingUser] = React.useState<MockUserWithMeta | null>(null);

  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && u.user_type !== roleFilter) return false;
      if (statusFilter === "active" && !u.is_active) return false;
      if (statusFilter === "inactive" && u.is_active) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q) ||
        u.location?.toLowerCase().includes(q) ||
        u.user_type.toLowerCase().includes(q)
      );
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  const sortedUsers = React.useMemo(
    () => sortUsers(filteredUsers, sortKey, sortDirection),
    [filteredUsers, sortKey, sortDirection]
  );

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const paginatedUsers = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedUsers.slice(start, start + pageSize);
  }, [sortedUsers, currentPage, pageSize]);

  const columns = React.useMemo(
    () =>
      getUserColumns({
        onEdit: (u) => setEditingUser(u),
        onToggleActive: (u) =>
          updateMutation.mutate({ id: u.id, payload: { is_active: !u.is_active } }),
        onDelete: (u) => setDeletingUser(u),
      }),
    [updateMutation]
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-background text-foreground">
      <div className="border-b border-border/40 bg-card/40 px-6 py-4">
        <PageHeader
          className="mb-0"
          title={
            <span className="flex items-center gap-2">
              <UsersIcon className="size-6 text-primary" weight="duotone" />
              Staff & User Directory
            </span>
          }
          description="Enterprise Role-Based Access Control (RBAC), Identity Management & API Guard Verification"
          actions={
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
                className="text-xs gap-1.5 h-8"
              >
                <ArrowsClockwiseIcon
                  className={cn("size-3.5", isRefetching && "animate-spin")}
                />
                Sync
              </Button>
              <Button
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="text-xs gap-1.5 h-8 bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-xs"
              >
                <UserPlusIcon className="size-4" weight="bold" />
                Add User
              </Button>
            </div>
          }
        />
      </div>

      <div className="px-6 pt-4">
        <UserMetrics users={users} />
      </div>

      <div className="flex-1 p-6 flex flex-col min-h-0 space-y-4">
        <FilterBar
          search={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setCurrentPage(1);
          }}
          placeholder="Search staff by name, email, department..."
          filters={
            <UserFilterControls
              roleFilter={roleFilter}
              onRoleFilterChange={(val) => {
                setRoleFilter(val);
                setCurrentPage(1);
              }}
              statusFilter={statusFilter}
              onStatusFilterChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
            />
          }
          onReset={() => {
            setSearchQuery("");
            setRoleFilter("all");
            setStatusFilter("all");
            setCurrentPage(1);
          }}
          activeCount={(roleFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0)}
        />

        <DataTable
          columns={columns}
          data={paginatedUsers}
          isLoading={isLoading}
          sortKey={sortKey || undefined}
          sortDirection={sortDirection}
          onSort={(key) => {
            if (sortKey === key)
              setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
            else {
              setSortKey(key as UserSortKey);
              setSortDirection("asc");
            }
          }}
          pagination={{ currentPage, totalPages, onPageChange: setCurrentPage }}
          emptyMessage="No personnel records match the current filters."
          keyExtractor={(u) => u.id}
        />
      </div>

      <UserDialogs
        isCreateOpen={isCreateOpen}
        onCloseCreate={() => setIsCreateOpen(false)}
        editingUser={editingUser}
        onCloseEdit={() => setEditingUser(null)}
        deletingUser={deletingUser}
        onCloseDelete={() => setDeletingUser(null)}
        createMutation={createMutation}
        updateMutation={updateMutation}
        deleteMutation={deleteMutation}
      />
    </div>
  );
}

export default AdminUsersPage;
