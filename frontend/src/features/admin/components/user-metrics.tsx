import {
  UsersIcon,
  CheckCircleIcon,
  WarehouseIcon,
  TruckIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import type { MockUserWithMeta } from "@/data/mock-users";

export interface UserMetricsProps {
  users: MockUserWithMeta[];
}

export function UserMetrics({ users }: UserMetricsProps) {
  const activeCount = users.filter((u) => u.is_active).length;
  const dispatchersCount = users.filter((u) => u.user_type === "dispatcher").length;
  const loadersCount = users.filter((u) => u.user_type === "loader").length;
  const driversCount = users.filter((u) => u.user_type === "driver").length;
  const storeManagersCount = users.filter((u) => u.user_type === "store_manager").length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
  );
}
