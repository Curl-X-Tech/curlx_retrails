import * as React from "react";
import {
  MagnifyingGlassIcon,
  ArrowsClockwiseIcon,
  UserPlusIcon,
  UsersIcon,
  ShieldCheckIcon,
  TruckIcon,
  StorefrontIcon,
  WarehouseIcon,
  FunnelIcon,
  CaretUpDownIcon,
  CaretUpIcon,
  CaretDownIcon,
  DotsThreeVerticalIcon,
  PencilSimpleIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Table,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  useUsersList,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "@/hooks/use-users-data";
import type { MockUserWithMeta } from "@/data/mock-users";
import { cn } from "@/lib/utils";

type SortKey = "name" | "email" | "user_type" | "status" | "created_at";

function SortHeaderIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: "asc" | "desc";
}) {
  if (!active) {
    return (
      <CaretUpDownIcon className="size-3 text-muted-foreground/40 shrink-0 ml-0.5" />
    );
  }
  return direction === "asc" ? (
    <CaretUpIcon className="size-3 text-primary shrink-0 ml-0.5 font-bold" />
  ) : (
    <CaretDownIcon className="size-3 text-primary shrink-0 ml-0.5 font-bold" />
  );
}

const ROLE_LABELS: Record<
  string,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  system_admin: {
    label: "System Admin",
    badgeClass: "bg-purple-900/80 text-purple-200 border border-purple-700/50",
    icon: <ShieldCheckIcon className="size-3.5" />,
  },
  dispatcher: {
    label: "Dispatcher",
    badgeClass: "bg-blue-900/80 text-blue-200 border border-blue-700/50",
    icon: <WarehouseIcon className="size-3.5" />,
  },
  loader: {
    label: "Bay Loader",
    badgeClass: "bg-amber-900/80 text-amber-200 border border-amber-700/50",
    icon: <WarehouseIcon className="size-3.5" />,
  },
  driver: {
    label: "Fleet Driver",
    badgeClass: "bg-emerald-900/80 text-emerald-200 border border-emerald-700/50",
    icon: <TruckIcon className="size-3.5" />,
  },
  store_manager: {
    label: "Store Manager",
    badgeClass: "bg-teal-900/80 text-teal-200 border border-teal-700/50",
    icon: <StorefrontIcon className="size-3.5" />,
  },
};

export function AdminUsersPage() {
  const { data: users = [], isLoading, refetch, isRefetching } = useUsersList();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [sortKey, setSortKey] = React.useState<SortKey | null>("created_at");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<MockUserWithMeta | null>(null);
  const [deletingUser, setDeletingUser] = React.useState<MockUserWithMeta | null>(null);

  // Form Fields for Create
  const [formName, setFormName] = React.useState("");
  const [formEmail, setFormEmail] = React.useState("");
  const [formPassword, setFormPassword] = React.useState("");
  const [formRole, setFormRole] = React.useState("dispatcher");
  const [formDepartment, setFormDepartment] = React.useState("Operations");
  const [formPhone, setFormPhone] = React.useState("+94 77 ");
  const [formLocation, setFormLocation] = React.useState("Kelaniya Hub (HUB-01)");
  const [formActive, setFormActive] = React.useState(true);
  const [formError, setFormError] = React.useState<string | null>(null);

  const handleOpenCreate = () => {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("dispatcher");
    setFormDepartment("Operations");
    setFormPhone("+94 77 ");
    setFormLocation("Kelaniya Hub (HUB-01)");
    setFormActive(true);
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (user: MockUserWithMeta) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword("");
    setFormRole(user.user_type);
    setFormDepartment(user.department);
    setFormPhone(user.phone);
    setFormLocation(user.location);
    setFormActive(user.is_active);
    setFormError(null);
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      setFormError("Name, email, and password (min 8 chars) are required.");
      return;
    }
    if (formPassword.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword,
        user_type: formRole,
        is_active: formActive,
        is_verified: true,
        department: formDepartment,
        phone: formPhone,
        location: formLocation,
      });
      setIsCreateOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to create user.");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!formName.trim() || !formEmail.trim()) {
      setFormError("Name and email are required.");
      return;
    }

    try {
      await updateUserMutation.mutateAsync({
        id: editingUser.id,
        payload: {
          name: formName.trim(),
          email: formEmail.trim(),
          user_type: formRole,
          is_active: formActive,
          password: formPassword.length >= 8 ? formPassword : undefined,
        },
        meta: {
          department: formDepartment,
          phone: formPhone,
          location: formLocation,
        },
      });
      setEditingUser(null);
    } catch (err: any) {
      setFormError(err.message || "Failed to update user.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    try {
      await deleteUserMutation.mutateAsync(deletingUser.id);
      setDeletingUser(null);
    } catch {
      // Ignored
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // Filtered & Sorted list
  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && u.user_type !== roleFilter) {
        return false;
      }
      if (statusFilter === "active" && !u.is_active) return false;
      if (statusFilter === "inactive" && u.is_active) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        const matchesDept = u.department?.toLowerCase().includes(q);
        const matchesLoc = u.location?.toLowerCase().includes(q);
        const matchesRole = u.user_type.toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesDept || matchesLoc || matchesRole;
      }

      return true;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  const sortedUsers = React.useMemo(() => {
    if (!sortKey) return filteredUsers;
    return [...filteredUsers].sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      switch (sortKey) {
        case "name":
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case "email":
          valA = a.email.toLowerCase();
          valB = b.email.toLowerCase();
          break;
        case "user_type":
          valA = a.user_type;
          valB = b.user_type;
          break;
        case "status":
          valA = a.is_active ? 1 : 0;
          valB = b.is_active ? 1 : 0;
          break;
        case "created_at":
          valA = new Date(a.created_at).getTime();
          valB = new Date(b.created_at).getTime();
          break;
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortKey, sortDirection]);

  // Pagination calculation
  const totalItems = sortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentUsers = sortedUsers.slice(startIndex, endIndex);

  // Metrics
  const activeCount = users.filter((u) => u.is_active).length;
  const dispatchersCount = users.filter((u) => u.user_type === "dispatcher").length;
  const driversCount = users.filter((u) => u.user_type === "driver").length;
  const loadersCount = users.filter((u) => u.user_type === "loader").length;
  const storeManagersCount = users.filter((u) => u.user_type === "store_manager").length;

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-background text-foreground">
      {/* Page Header */}
      <div className="border-b border-border/40 bg-card/40 px-6 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <UsersIcon className="size-6 text-primary" weight="duotone" />
              Staff & User Directory
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enterprise Role-Based Access Control (RBAC), Identity Management & API Guard
              Verification
            </p>
          </div>

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
              onClick={handleOpenCreate}
              className="text-xs gap-1.5 h-8 bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-xs"
            >
              <UserPlusIcon className="size-4" weight="bold" />
              Add User
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="px-6 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 bg-card border-border/70 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Total Personnel
            </p>
            <p className="text-xl font-bold text-foreground mt-0.5">{users.length}</p>
          </div>
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <UsersIcon className="size-5" weight="duotone" />
          </div>
        </Card>

        <Card className="p-3 bg-card border-border/70 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Active Accounts
            </p>
            <p className="text-xl font-bold text-foreground mt-0.5">{activeCount}</p>
          </div>
          <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircleIcon className="size-5" weight="duotone" />
          </div>
        </Card>

        <Card className="p-3 bg-card border-border/70 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Dispatch & Ops
            </p>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {dispatchersCount + loadersCount}
            </p>
          </div>
          <div className="size-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <WarehouseIcon className="size-5" weight="duotone" />
          </div>
        </Card>

        <Card className="p-3 bg-card border-border/70 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Field Drivers & Retail
            </p>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {driversCount + storeManagersCount}
            </p>
          </div>
          <div className="size-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <TruckIcon className="size-5" weight="duotone" />
          </div>
        </Card>
      </div>

      {/* Main Table Section */}
      <div className="flex-1 p-6 flex flex-col min-h-0">
        <Card className="flex-1 flex flex-col border-border/70 bg-card overflow-hidden shadow-xs">
          {/* Controls Bar */}
          <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search staff by name, email, department..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-8 text-xs bg-background/60"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {/* Role Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5 border-border cursor-pointer"
                    />
                  }
                >
                  <FunnelIcon className="size-3.5 text-muted-foreground" />
                  <span>
                    Role:{" "}
                    <span className="font-semibold text-foreground">
                      {roleFilter === "all"
                        ? "All Roles"
                        : ROLE_LABELS[roleFilter]?.label || roleFilter}
                    </span>
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">
                    Filter by Role
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={roleFilter}
                    onValueChange={(val) => {
                      setRoleFilter(val);
                      setCurrentPage(1);
                    }}
                  >
                    <DropdownMenuRadioItem value="all" className="text-xs">
                      All Roles
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system_admin" className="text-xs">
                      System Admin
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dispatcher" className="text-xs">
                      Dispatcher
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="loader" className="text-xs">
                      Bay Loader
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="driver" className="text-xs">
                      Fleet Driver
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="store_manager" className="text-xs">
                      Store Manager
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Status Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5 border-border cursor-pointer"
                    />
                  }
                >
                  <span>
                    Status:{" "}
                    <span className="font-semibold text-foreground">
                      {statusFilter === "all"
                        ? "All"
                        : statusFilter === "active"
                          ? "Active Only"
                          : "Inactive Only"}
                    </span>
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuLabel className="text-xs">
                    Account Status
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={statusFilter}
                    onValueChange={(val) => {
                      setStatusFilter(val);
                      setCurrentPage(1);
                    }}
                  >
                    <DropdownMenuRadioItem value="all" className="text-xs">
                      All Accounts
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="active" className="text-xs">
                      Active Only
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="inactive" className="text-xs">
                      Inactive Only
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-muted/30 sticky top-0 z-10">
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead
                    className="text-xs font-semibold cursor-pointer select-none text-foreground"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Personnel Name
                      <SortHeaderIcon
                        active={sortKey === "name"}
                        direction={sortDirection}
                      />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-xs font-semibold cursor-pointer select-none text-foreground"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center gap-1">
                      Email Address
                      <SortHeaderIcon
                        active={sortKey === "email"}
                        direction={sortDirection}
                      />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-xs font-semibold cursor-pointer select-none text-foreground"
                    onClick={() => handleSort("user_type")}
                  >
                    <div className="flex items-center gap-1">
                      Assigned Role
                      <SortHeaderIcon
                        active={sortKey === "user_type"}
                        direction={sortDirection}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground">
                    Department & Station
                  </TableHead>
                  <TableHead
                    className="text-xs font-semibold cursor-pointer select-none text-foreground"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <SortHeaderIcon
                        active={sortKey === "status"}
                        direction={sortDirection}
                      />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-xs font-semibold cursor-pointer select-none text-foreground"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center gap-1">
                      Created Date
                      <SortHeaderIcon
                        active={sortKey === "created_at"}
                        direction={sortDirection}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="w-14 text-right text-xs font-semibold text-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-sm text-muted-foreground"
                    >
                      Loading user and staff directory...
                    </TableCell>
                  </TableRow>
                ) : currentUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-sm text-muted-foreground"
                    >
                      No personnel records match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentUsers.map((user) => {
                    const roleConfig = ROLE_LABELS[user.user_type] || {
                      label: user.user_type,
                      badgeClass: "bg-muted text-muted-foreground",
                      icon: <UsersIcon className="size-3.5" />,
                    };

                    return (
                      <TableRow
                        key={user.id}
                        className="border-border/40 hover:bg-muted/20 transition-colors"
                      >
                        <TableCell className="font-medium text-xs text-foreground">
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-[11px]">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground leading-tight">
                                {user.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {user.phone}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium tracking-tight",
                              roleConfig.badgeClass
                            )}
                          >
                            {roleConfig.icon}
                            {roleConfig.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <p className="text-foreground text-[11px] font-medium">
                            {user.department}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {user.location}
                          </p>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
                              user.is_active
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : "bg-zinc-500/15 text-zinc-400 border border-zinc-500/30"
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                user.is_active ? "bg-emerald-400" : "bg-zinc-400"
                              )}
                            />
                            {user.is_active ? "Active" : "Disabled"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                                />
                              }
                            >
                              <DotsThreeVerticalIcon className="size-4" weight="bold" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onClick={() => handleOpenEdit(user)}
                                className="text-xs gap-2"
                              >
                                <PencilSimpleIcon className="size-3.5 text-muted-foreground" />
                                Edit Account
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  updateUserMutation.mutate({
                                    id: user.id,
                                    payload: { is_active: !user.is_active },
                                  });
                                }}
                                className="text-xs gap-2"
                              >
                                {user.is_active ? (
                                  <>
                                    <XCircleIcon className="size-3.5 text-amber-500" />
                                    Deactivate User
                                  </>
                                ) : (
                                  <>
                                    <CheckCircleIcon className="size-3.5 text-emerald-500" />
                                    Activate User
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingUser(user)}
                                className="text-xs gap-2 text-destructive focus:text-destructive"
                              >
                                <TrashIcon className="size-3.5" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Dual-Bar Pagination Footer */}
          <div className="p-3 border-t border-border/50 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>
              Showing{" "}
              <span className="font-semibold text-foreground">
                {totalItems === 0 ? 0 : startIndex + 1}
              </span>{" "}
              to <span className="font-semibold text-foreground">{endIndex}</span> of{" "}
              <span className="font-semibold text-foreground">{totalItems}</span>{" "}
              personnel
            </div>

            <Pagination className="justify-end w-auto mx-0">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={cn(
                      "cursor-pointer text-xs h-7 px-2",
                      currentPage === 1 && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={currentPage === page}
                      onClick={() => setCurrentPage(page)}
                      className="cursor-pointer text-xs h-7 w-7"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={cn(
                      "cursor-pointer text-xs h-7 px-2",
                      currentPage === totalPages && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </Card>
      </div>

      {/* Create User Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open: boolean) => setIsCreateOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserPlusIcon className="size-5 text-primary" weight="duotone" />
              Provision New User Account
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Register a team member under an enterprise role with strict RBAC
              credentials.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCreate} className="space-y-3.5 py-2">
            {formError && (
              <div className="p-2.5 rounded bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                <WarningCircleIcon className="size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">
                Full Name
              </label>
              <Input
                placeholder="e.g. Kasun Fernando"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">
                Corporate Email
              </label>
              <Input
                type="email"
                placeholder="e.g. kasun@retrails.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">
                Initial Password (min 8 chars)
              </label>
              <Input
                type="password"
                placeholder="Password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">
                  Enterprise Role
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full h-8 text-xs rounded-md border border-input bg-background px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="dispatcher">Dispatcher</option>
                  <option value="loader">Bay Loader</option>
                  <option value="driver">Fleet Driver</option>
                  <option value="store_manager">Store Manager</option>
                  <option value="system_admin">System Admin</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">
                  Department
                </label>
                <Input
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  placeholder="Operations"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">
                  Contact Phone
                </label>
                <Input
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">
                  Assigned Location
                </label>
                <Input
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="Kelaniya Hub (HUB-01)"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createUserMutation.isPending}
                className="text-xs h-8 font-medium"
              >
                {createUserMutation.isPending ? "Creating..." : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={!!editingUser}
        onOpenChange={(open: boolean) => !open && setEditingUser(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <PencilSimpleIcon className="size-5 text-primary" weight="duotone" />
              Modify Personnel Account
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update user details, assign enterprise roles, or modify account status.
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <form onSubmit={handleSaveEdit} className="space-y-3.5 py-2">
              {formError && (
                <div className="p-2.5 rounded bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                  <WarningCircleIcon className="size-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">
                  Full Name
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">
                  Reset Password (leave empty to keep current)
                </label>
                <Input
                  type="password"
                  placeholder="New password (min 8 chars)"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-foreground">
                    Role
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full h-8 text-xs rounded-md border border-input bg-background px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="dispatcher">Dispatcher</option>
                    <option value="loader">Bay Loader</option>
                    <option value="driver">Fleet Driver</option>
                    <option value="store_manager">Store Manager</option>
                    <option value="system_admin">System Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-foreground">
                    Department
                  </label>
                  <Input
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="rounded border-border"
                />
                <label
                  htmlFor="edit-active"
                  className="text-xs text-foreground cursor-pointer font-medium"
                >
                  Account is Active & Enabled
                </label>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingUser(null)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateUserMutation.isPending}
                  className="text-xs h-8 font-medium"
                >
                  {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <Dialog
        open={!!deletingUser}
        onOpenChange={(open: boolean) => !open && setDeletingUser(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <TrashIcon className="size-5" />
              Confirm User Deletion
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">{deletingUser?.name}</span>{" "}
              ({deletingUser?.email})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingUser(null)}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={deleteUserMutation.isPending}
              className="text-xs h-8 font-medium"
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
