import { FunnelIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS } from "./user-constants";

export interface UserFilterControlsProps {
  roleFilter: string;
  onRoleFilterChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
}

export function UserFilterControls({
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
}: UserFilterControlsProps) {
  return (
    <div className="flex items-center gap-2.5 flex-wrap">
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
          <DropdownMenuLabel className="text-xs">Filter by Role</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={roleFilter}
            onValueChange={onRoleFilterChange}
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
          <DropdownMenuLabel className="text-xs">Account Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={statusFilter}
            onValueChange={onStatusFilterChange}
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
  );
}
