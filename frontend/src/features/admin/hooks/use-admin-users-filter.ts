import * as React from "react";
import { sortUsers } from "../admin-utils";
import type { UserSortKey } from "../types";
import type { MockUserWithMeta } from "@/data/mock-users";

interface UseAdminUsersFilterProps {
  users: MockUserWithMeta[];
  roleFilter: string;
  statusFilter: string;
  searchQuery: string;
  sortKey: UserSortKey | null;
  sortDirection: "asc" | "desc";
  currentPage: number;
  pageSize?: number;
}

export function useAdminUsersFilter({
  users,
  roleFilter,
  statusFilter,
  searchQuery,
  sortKey,
  sortDirection,
  currentPage,
  pageSize = 10,
}: UseAdminUsersFilterProps) {
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

  return {
    filteredUsers,
    sortedUsers,
    paginatedUsers,
    totalPages,
  };
}
