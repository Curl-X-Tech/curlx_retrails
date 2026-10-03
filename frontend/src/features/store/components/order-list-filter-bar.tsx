import { useNavigate } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  SlidersHorizontalIcon,
  ColumnsIcon,
  ArrowClockwiseIcon,
  PlusIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderListFilterDropdowns } from "./order-list-filter-dropdowns";

interface OrderListFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateFilter: string;
  onDateSelect: (date: string) => void;
  statusFilter: string;
  onStatusSelect: (status: string) => void;
  hubFilter: string;
  onHubSelect: (hub: string) => void;
  onRefresh: () => void;
}

export function OrderListFilterBar({
  searchQuery,
  onSearchChange,
  dateFilter,
  onDateSelect,
  statusFilter,
  onStatusSelect,
  hubFilter,
  onHubSelect,
  onRefresh,
}: OrderListFilterBarProps) {
  const navigate = useNavigate();

  return (
    <div className="border-b border-border bg-card px-4 py-3 shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by Batch ID, Vehicle No., or Route..."
              className="pl-9 h-9 text-xs rounded-lg bg-muted/40 border-border focus-visible:bg-background"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>

          <OrderListFilterDropdowns
            dateFilter={dateFilter}
            onDateSelect={onDateSelect}
            statusFilter={statusFilter}
            onStatusSelect={onStatusSelect}
            hubFilter={hubFilter}
            onHubSelect={onHubSelect}
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant="outline" size="sm" className="h-9 px-2.5 text-xs gap-1.5 rounded-lg border-border font-medium cursor-pointer">
            <SlidersHorizontalIcon className="size-4 text-muted-foreground" />
            <span className="hidden sm:inline">Advanced</span>
          </Button>

          <Button variant="outline" size="sm" className="h-9 px-2.5 text-xs gap-1.5 rounded-lg border-border font-medium cursor-pointer">
            <ColumnsIcon className="size-4 text-muted-foreground" />
            <span className="hidden sm:inline">Columns</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 rounded-lg border-border cursor-pointer"
            onClick={onRefresh}
            title="Refresh Queue"
          >
            <ArrowClockwiseIcon className="size-4 text-muted-foreground" />
          </Button>

          <Button
            onClick={() => navigate("/store/orders/new")}
            size="sm"
            className="h-9 px-3 text-xs gap-1.5 rounded-lg bg-primary text-primary-foreground font-semibold cursor-pointer ml-1 sm:hidden"
          >
            <PlusIcon className="size-4 font-bold" />
            <span>Create Order</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
