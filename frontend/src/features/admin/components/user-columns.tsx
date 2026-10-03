import {
  DotsThreeVerticalIcon,
  PencilSimpleIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { DataTableColumn } from "@/components/shared";
import type { MockUserWithMeta } from "@/data/mock-users";
import { cn } from "@/lib/utils";
import { getRoleConfig } from "./user-constants";

export interface UserColumnActions {
  onEdit: (user: MockUserWithMeta) => void;
  onToggleActive: (user: MockUserWithMeta) => void;
  onDelete: (user: MockUserWithMeta) => void;
}

export function getUserColumns(
  actions: UserColumnActions
): DataTableColumn<MockUserWithMeta>[] {
  return [
    {
      key: "name",
      header: "Personnel Name",
      sortable: true,
      className: "font-medium text-xs text-foreground",
      render: (user) => (
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-[11px]">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-foreground leading-tight">{user.name}</p>
            <p className="text-[10px] text-muted-foreground">{user.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email Address",
      sortable: true,
      className: "text-xs text-muted-foreground",
      render: (user) => user.email,
    },
    {
      key: "user_type",
      header: "Assigned Role",
      sortable: true,
      render: (user) => {
        const rc = getRoleConfig(user.user_type);
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium tracking-tight",
              rc.badgeClass
            )}
          >
            {rc.icon}
            {rc.label}
          </span>
        );
      },
    },
    {
      key: "department",
      header: "Department & Station",
      render: (user) => (
        <div className="text-xs">
          <p className="text-foreground text-[11px] font-medium">{user.department}</p>
          <p className="text-[10px] text-muted-foreground">{user.location}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (user) => (
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
      ),
    },
    {
      key: "created_at",
      header: "Created Date",
      sortable: true,
      className: "text-xs text-muted-foreground",
      render: (user) =>
        new Date(user.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      key: "actions",
      header: "Actions",
      className: "w-14 text-right",
      render: (user) => (
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
              onClick={() => actions.onEdit(user)}
              className="text-xs gap-2"
            >
              <PencilSimpleIcon className="size-3.5 text-muted-foreground" />
              Edit Account
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => actions.onToggleActive(user)}
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
              onClick={() => actions.onDelete(user)}
              className="text-xs gap-2 text-destructive focus:text-destructive"
            >
              <TrashIcon className="size-3.5" />
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
