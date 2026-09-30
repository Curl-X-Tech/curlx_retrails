import * as React from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import {
  WarningOctagonIcon,
  ClockIcon,
  ScalesIcon,
  CubeIcon,
  FileTextIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  SnowflakeIcon,
  UserIcon,
  CaretUpDownIcon,
  CaretUpIcon,
  CaretDownIcon,
  ArrowSquareOutIcon,
  LockKeyIcon,
  RowsIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  mockCarryoverOrders,
  mockCarryoverKPIs,
  mockDeferralAuditLogs,
} from "@/data/mock-deferrals";
import { OrderDetailSheet } from "@/components/dispatcher/order-detail-sheet";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useSimulatedLoading } from "@/lib/simulated-delay";
import { mockQueuedOrders } from "@/data/mock-orders";
import type { QueuedOrder } from "@/types";

function CircularProgressRing({
  value,
  size = 44,
  strokeWidth = 3.5,
  colorClassName = "text-primary",
  children,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  colorClassName?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(value, 0), 100);
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 transform-gpu"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${colorClassName} transition-all duration-500 ease-out`}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
}

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

interface DeferralsPageProps {
  viewMode?: "carryover" | "deferral-log" | "audit-log";
  isLoading?: boolean;
  onNavigateToOrder?: (orderRef: string) => void;
}

export function DeferralsPage({
  viewMode = "carryover",
  isLoading = false,
}: DeferralsPageProps = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const isAuditLog =
    viewMode === "deferral-log" ||
    viewMode === "audit-log" ||
    location.pathname.includes("audit-log") ||
    location.pathname.includes("deferral-log");

  const orderParam = searchParams.get("order");

  // Carryover Tab State derived from URL
  const carryoverSearch = searchParams.get("search") || searchParams.get("q") || "";
  const carryoverBrandFilter = searchParams.get("brand") || "all";
  const carryoverGroupBy =
    (searchParams.get("group") as "none" | "action" | "reason") || "none";
  const carryoverPage = parseInt(searchParams.get("page") || "1", 10);
  const carryoverPageSize = 5;

  // Audit Log Tab State derived from URL
  const auditSearch = searchParams.get("search") || searchParams.get("q") || "";
  const auditReasonFilter = searchParams.get("reason") || "all";
  const auditResourceFilter = searchParams.get("resource") || "all";
  const auditGroupBy =
    (searchParams.get("group") as "none" | "action" | "reason") || "none";
  const auditSortKey = searchParams.get("sort") || null;
  const auditSortDirection = (searchParams.get("dir") as "asc" | "desc") || "asc";
  const auditPage = parseInt(searchParams.get("page") || "1", 10);
  const auditPageSize = 5;

  const isSimulatedLoading = useSimulatedLoading([
    carryoverSearch,
    carryoverBrandFilter,
    carryoverGroupBy,
    carryoverPage,
    auditSearch,
    auditReasonFilter,
    auditResourceFilter,
    auditGroupBy,
    auditSortKey,
    auditSortDirection,
    auditPage,
  ]);

  const effectiveLoading = isLoading || isSimulatedLoading;

  const updateQueryParams = React.useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(updates).forEach(([key, val]) => {
            if (
              val === null ||
              val === undefined ||
              val === "" ||
              val === "all" ||
              val === "none" ||
              (key === "page" && Number(val) <= 1)
            ) {
              next.delete(key);
            } else {
              next.set(key, String(val));
            }
          });
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const selectedOrder: QueuedOrder | null = React.useMemo(() => {
    if (!orderParam) return null;
    return (
      mockQueuedOrders.find((o) => o.orderRef === orderParam) || {
        id: orderParam,
        orderRef: orderParam,
        outletId: "OUT001",
        outletName: "Waypoint Outlet",
        outletAddress: "Western Province",
        brand: "Fresh" as const,
        district: "Colombo",
        depot: "Peliyagoda",
        dockType: "rear_dock" as const,
        parkingConstraint: "normal" as const,
        deliveryWindow: "05:00 - 08:00 AM",
        orderDate: "2026-10-01",
        requiredDate: "2026-10-01",
        tempRequirement: "chilled" as const,
        status: "deferred" as const,
        isUrgent: true,
        deferredYesterday: 1 as const,
        daysSinceLastServed: 2,
        totalItems: 3,
        totalWeightKg: 420.0,
        totalVolumeM3: 2.8,
        totalOrderValueLkr: 285000,
        items: [],
      }
    );
  }, [orderParam]);

  const isDetailOpen = Boolean(orderParam);

  const handleOpenDetailByRef = (orderRef: string) => {
    updateQueryParams({ order: orderRef });
  };

  const handleCloseDetail = () => {
    updateQueryParams({ order: null });
  };

  // Filtered Carryover Orders
  const filteredCarryover = React.useMemo(() => {
    return mockCarryoverOrders.filter((ord) => {
      const q = carryoverSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        ord.orderRef.toLowerCase().includes(q) ||
        ord.outletName.toLowerCase().includes(q) ||
        ord.outletId.toLowerCase().includes(q) ||
        ord.district.toLowerCase().includes(q);

      const matchesBrand =
        carryoverBrandFilter === "all" || ord.brand === carryoverBrandFilter;

      return matchesSearch && matchesBrand;
    });
  }, [carryoverSearch, carryoverBrandFilter]);

  // Grouped Carryover Orders
  const groupedCarryover = React.useMemo(() => {
    if (carryoverGroupBy === "none") return null;

    const groups: {
      key: string;
      title: string;
      description?: string;
      isMandatory?: boolean;
      items: typeof mockCarryoverOrders;
      totalWeightKg: number;
      totalVolumeM3: number;
      totalValueLkr: number;
    }[] = [];

    if (carryoverGroupBy === "action") {
      const mandatoryOrders = filteredCarryover.filter((o) => o.deferredYesterday === 1);
      const standardOrders = filteredCarryover.filter((o) => o.deferredYesterday === 0);

      if (mandatoryOrders.length > 0) {
        groups.push({
          key: "action-mandatory",
          title: "Mandatory Wave 1 Priority Injection",
          description:
            "Consecutive skip protection SLA: must be dispatched in morning Wave 1",
          isMandatory: true,
          items: mandatoryOrders,
          totalWeightKg: mandatoryOrders.reduce((sum, o) => sum + o.totalWeightKg, 0),
          totalVolumeM3: Number(
            mandatoryOrders.reduce((sum, o) => sum + o.totalVolumeM3, 0).toFixed(1)
          ),
          totalValueLkr: mandatoryOrders.reduce((sum, o) => sum + o.totalValueLkr, 0),
        });
      }

      if (standardOrders.length > 0) {
        groups.push({
          key: "action-standard",
          title: "Standard Wave 1 Dispatch & Fleet Release",
          description: "Standard carryover allocation from previous evening shifts",
          isMandatory: false,
          items: standardOrders,
          totalWeightKg: standardOrders.reduce((sum, o) => sum + o.totalWeightKg, 0),
          totalVolumeM3: Number(
            standardOrders.reduce((sum, o) => sum + o.totalVolumeM3, 0).toFixed(1)
          ),
          totalValueLkr: standardOrders.reduce((sum, o) => sum + o.totalValueLkr, 0),
        });
      }
    } else if (carryoverGroupBy === "reason") {
      const reasonMeta: Record<string, { title: string; description: string }> = {
        van_access_shortage: {
          title: "Van Access Shortage (Street / Tight Dock)",
          description:
            "Outlet dock requires small van chassis; reefer vans were fully saturated",
        },
        insufficient_reefer_capacity: {
          title: "Insufficient Reefer Fleet Capacity",
          description:
            "Cold-chain requirement exceeded available refrigerated vehicle fleet",
        },
        time_budget_limit: {
          title: "Time Budget & Traffic Cutoff Limit",
          description: "Exceeded maximum delivery window or driver shift hours limit",
        },
        fuel_quota_exceeded: {
          title: "Weekly Fuel Quota Threshold",
          description: "Vehicle weekly fuel allocation limit reached",
        },
      };

      const map = new Map<string, typeof mockCarryoverOrders>();
      filteredCarryover.forEach((ord) => {
        const list = map.get(ord.deferralReason) || [];
        list.push(ord);
        map.set(ord.deferralReason, list);
      });

      map.forEach((items, reasonKey) => {
        const meta = reasonMeta[reasonKey] || {
          title: reasonKey.replace(/_/g, " "),
          description: "Orders deferred due to this operational constraint",
        };
        groups.push({
          key: `reason-${reasonKey}`,
          title: meta.title,
          description: meta.description,
          items,
          totalWeightKg: items.reduce((sum, o) => sum + o.totalWeightKg, 0),
          totalVolumeM3: Number(
            items.reduce((sum, o) => sum + o.totalVolumeM3, 0).toFixed(1)
          ),
          totalValueLkr: items.reduce((sum, o) => sum + o.totalValueLkr, 0),
        });
      });
    }

    return groups;
  }, [filteredCarryover, carryoverGroupBy]);

  const totalCarryoverPages = Math.max(
    1,
    Math.ceil(filteredCarryover.length / carryoverPageSize)
  );

  const paginatedCarryover = React.useMemo(() => {
    const start = (carryoverPage - 1) * carryoverPageSize;
    return filteredCarryover.slice(start, start + carryoverPageSize);
  }, [filteredCarryover, carryoverPage, carryoverPageSize]);

  // Filtered & Sorted Audit Logs
  const filteredAuditLogs = React.useMemo(() => {
    let list = mockDeferralAuditLogs.filter((log) => {
      const q = auditSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        log.orderRef.toLowerCase().includes(q) ||
        log.outletName.toLowerCase().includes(q) ||
        log.decisionMakerName.toLowerCase().includes(q) ||
        log.notes?.toLowerCase().includes(q);

      const matchesReason =
        auditReasonFilter === "all" || log.deferralReason === auditReasonFilter;

      const matchesResource =
        auditResourceFilter === "all" || log.limitingResource === auditResourceFilter;

      return matchesSearch && matchesReason && matchesResource;
    });

    if (auditSortKey) {
      list = [...list].sort((a, b) => {
        let cmp = 0;
        if (auditSortKey === "date") {
          cmp = a.createdAt.localeCompare(b.createdAt);
        } else if (auditSortKey === "orderRef") {
          cmp = a.orderRef.localeCompare(b.orderRef);
        } else if (auditSortKey === "weight") {
          cmp = a.totalWeightKg - b.totalWeightKg;
        } else if (auditSortKey === "value") {
          cmp = a.totalValueLkr - b.totalValueLkr;
        }
        return auditSortDirection === "asc" ? cmp : -cmp;
      });
    }

    return list;
  }, [
    auditSearch,
    auditReasonFilter,
    auditResourceFilter,
    auditSortKey,
    auditSortDirection,
  ]);

  // Grouped Audit Logs
  const groupedAuditLogs = React.useMemo(() => {
    if (auditGroupBy === "none") return null;

    const groups: {
      key: string;
      title: string;
      description?: string;
      items: typeof mockDeferralAuditLogs;
      totalWeightKg: number;
      totalVolumeM3: number;
      totalValueLkr: number;
    }[] = [];

    if (auditGroupBy === "action") {
      const priorityLogs = filteredAuditLogs.filter(
        (l) =>
          l.deferralReason === "van_access_shortage" ||
          l.deferralReason === "insufficient_reefer_capacity"
      );
      const standardLogs = filteredAuditLogs.filter(
        (l) =>
          l.deferralReason !== "van_access_shortage" &&
          l.deferralReason !== "insufficient_reefer_capacity"
      );

      if (priorityLogs.length > 0) {
        groups.push({
          key: "audit-action-priority",
          title: "Action: Priority Solver Injection (Wave 1)",
          description:
            "Pre-allocated to Wave 1 solver runs with high priority penalty weight",
          items: priorityLogs,
          totalWeightKg: priorityLogs.reduce((sum, l) => sum + l.totalWeightKg, 0),
          totalVolumeM3: Number(
            priorityLogs.reduce((sum, l) => sum + l.totalVolumeM3, 0).toFixed(1)
          ),
          totalValueLkr: priorityLogs.reduce((sum, l) => sum + l.totalValueLkr, 0),
        });
      }

      if (standardLogs.length > 0) {
        groups.push({
          key: "audit-action-standard",
          title: "Action: Next-Day Route Re-Sequencing",
          description: "Re-allocated into standard next-day route dispatch windows",
          items: standardLogs,
          totalWeightKg: standardLogs.reduce((sum, l) => sum + l.totalWeightKg, 0),
          totalVolumeM3: Number(
            standardLogs.reduce((sum, l) => sum + l.totalVolumeM3, 0).toFixed(1)
          ),
          totalValueLkr: standardLogs.reduce((sum, l) => sum + l.totalValueLkr, 0),
        });
      }
    } else if (auditGroupBy === "reason") {
      const reasonTitleMap: Record<string, string> = {
        insufficient_reefer_capacity: "Insufficient Reefer Fleet Capacity",
        van_access_shortage: "Van Access Shortage (Dock Constraint)",
        time_budget_limit: "Driver Time Budget & Shift Limit",
        fuel_quota_exceeded: "Fleet Fuel Quota Limit",
      };

      const map = new Map<string, typeof mockDeferralAuditLogs>();
      filteredAuditLogs.forEach((log) => {
        const list = map.get(log.deferralReason) || [];
        list.push(log);
        map.set(log.deferralReason, list);
      });

      map.forEach((items, reasonKey) => {
        groups.push({
          key: `audit-reason-${reasonKey}`,
          title: reasonTitleMap[reasonKey] || reasonKey.replace(/_/g, " "),
          items,
          totalWeightKg: items.reduce((sum, l) => sum + l.totalWeightKg, 0),
          totalVolumeM3: Number(
            items.reduce((sum, l) => sum + l.totalVolumeM3, 0).toFixed(1)
          ),
          totalValueLkr: items.reduce((sum, l) => sum + l.totalValueLkr, 0),
        });
      });
    }

    return groups;
  }, [filteredAuditLogs, auditGroupBy]);

  const totalAuditPages = Math.max(
    1,
    Math.ceil(filteredAuditLogs.length / auditPageSize)
  );

  const paginatedAuditLogs = React.useMemo(() => {
    const start = (auditPage - 1) * auditPageSize;
    return filteredAuditLogs.slice(start, start + auditPageSize);
  }, [filteredAuditLogs, auditPage, auditPageSize]);

  const handleAuditSort = (key: string) => {
    if (auditSortKey === key) {
      if (auditSortDirection === "asc") {
        updateQueryParams({ sort: key, dir: "desc" });
      } else {
        updateQueryParams({ sort: null, dir: null });
      }
    } else {
      updateQueryParams({ sort: key, dir: "asc" });
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "insufficient_reefer_capacity":
        return "Reefer Capacity Saturated";
      case "van_access_shortage":
        return "Van Access Shortage";
      case "time_budget_limit":
        return "Time Budget Exceeded";
      case "fuel_quota_exceeded":
        return "Fleet Downtime / Maintenance";
      default:
        return reason.replace(/_/g, " ");
    }
  };

  const getResourceBadge = (res: string) => {
    switch (res) {
      case "weight_cap":
        return "Weight Cap";
      case "volume_cap":
        return "Volume Cap";
      case "time_budget":
        return "Driver Time";
      case "fleet_downtime":
        return "Workshop";
      default:
        return res;
    }
  };

  const handleExportJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(mockDeferralAuditLogs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "deferral_audit_log_export.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Top Header */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 shrink-0">
        <div>
          <h1 className="text-lg font-heading font-black tracking-tight text-foreground">
            {isAuditLog ? "Deferral Audit Log" : "Active Carryover & Next-Day Planning"}
          </h1>
          <p className="text-[11px] text-muted-foreground">
            {isAuditLog
              ? "Peliyagoda Depot | Historical Deferral Records & Dispatcher Accountability"
              : "Peliyagoda Depot | Next-Day Pre-Allocation & 2-Day Consecutive Skip Protection"}
          </p>
        </div>

        {isAuditLog && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
              onClick={handleExportJson}
            >
              <FileTextIcon className="size-3 text-muted-foreground" />
              <span>Export Audit Log</span>
            </Button>
          </div>
        )}
      </div>

      {/* KPI Bar */}
      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs whitespace-nowrap scrollbar-none shrink-0">
        {!isAuditLog ? (
          <>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
              <ClockIcon className="size-3.5 text-amber-600 shrink-0" />
              <span className="text-muted-foreground text-[11px]">Carryover Orders:</span>
              <span className="font-bold text-foreground text-[11px]">
                {mockCarryoverKPIs.totalCarryoverOrders}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
              <ScalesIcon className="size-3.5 text-emerald-600 shrink-0" />
              <span className="text-muted-foreground text-[11px]">Carryover Weight:</span>
              <span className="font-bold text-foreground text-[11px]">
                {(mockCarryoverKPIs.totalWeightKg / 1000).toFixed(2)} t
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                ({mockCarryoverKPIs.totalWeightKg.toLocaleString()} kg)
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
              <CubeIcon className="size-3.5 text-violet-600 shrink-0" />
              <span className="text-muted-foreground text-[11px]">Carryover Volume:</span>
              <span className="font-bold text-foreground text-[11px]">
                {mockCarryoverKPIs.totalVolumeM3} m³
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
              <span className="text-muted-foreground text-[11px]">Value at Risk:</span>
              <span className="font-bold text-foreground text-[11px]">
                LKR {(mockCarryoverKPIs.totalValueLkr / 1000).toFixed(0)}k
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
              <FileTextIcon className="size-3.5 text-primary shrink-0" />
              <span className="text-muted-foreground text-[11px]">Audit Records:</span>
              <span className="font-bold text-foreground text-[11px]">
                {mockDeferralAuditLogs.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
              <ShieldCheckIcon
                className="size-3.5 text-emerald-600 shrink-0"
                weight="bold"
              />
              <span className="text-muted-foreground text-[11px]">
                Consecutive Skips Prevented:
              </span>
              <span className="font-bold text-emerald-600 text-[11px]">4 / 4</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
              <span className="text-muted-foreground text-[11px]">
                Limiting Resources:
              </span>
              <span className="font-bold text-foreground text-[11px]">4 Categories</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
              <UserIcon className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground text-[11px]">Decision Makers:</span>
              <span className="font-bold text-foreground text-[11px]">2 Dispatchers</span>
            </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-hidden flex flex-col">
        {!isAuditLog ? (
          <>
            {/* Tomorrow's Wave 1 Fleet Allocations: 3 Vehicle Circular Rings with Images & Tooltips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 shrink-0">
              {/* Card 1: Cold Lorry */}
              <Tooltip>
                <TooltipTrigger
                  render={
                    <div className="px-4 py-3.5 min-h-[82px] bg-card border border-border/70 hover:border-border transition-all shadow-xs rounded-xl flex items-center justify-between gap-3.5 cursor-default" />
                  }
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="shrink-0">
                      <CircularProgressRing
                        value={13}
                        size={44}
                        strokeWidth={4}
                        colorClassName="text-red-500"
                      >
                        <span className="text-xs font-heading font-black text-red-500">
                          1
                        </span>
                      </CircularProgressRing>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-heading font-bold text-foreground truncate">
                          Cold Lorry
                        </span>
                        <span className="size-1.5 rounded-full bg-red-500 shrink-0" />
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        1 / 8 Needed • 620 kg
                      </p>
                    </div>
                  </div>
                  <img
                    src="/vehicle-images/freeze.png"
                    alt="Cold Lorry"
                    className="w-16 h-12 object-contain shrink-0 opacity-90 drop-shadow-xs select-none pointer-events-none"
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs max-w-xs">
                  <div className="font-semibold text-foreground">
                    Cold Lorry (Top Priority)
                  </div>
                  <div className="text-muted-foreground text-[11px] mt-0.5">
                    1 reefer lorry locked for Kandy City cold-chain cargo (OUT018).
                    Mandatory Wave 1 consecutive skip protection.
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Card 2: Freeze Van */}
              <Tooltip>
                <TooltipTrigger
                  render={
                    <div className="px-4 py-3.5 min-h-[82px] bg-card border border-border/70 hover:border-border transition-all shadow-xs rounded-xl flex items-center justify-between gap-3.5 cursor-default" />
                  }
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="shrink-0">
                      <CircularProgressRing
                        value={6}
                        size={44}
                        strokeWidth={4}
                        colorClassName="text-red-500"
                      >
                        <span className="text-xs font-heading font-black text-red-500">
                          1
                        </span>
                      </CircularProgressRing>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-heading font-bold text-foreground truncate">
                          Freeze Van
                        </span>
                        <span className="size-1.5 rounded-full bg-red-500 shrink-0" />
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        1 / 16 Needed • 540 kg
                      </p>
                    </div>
                  </div>
                  <img
                    src="/vehicle-images/van.png"
                    alt="Freeze Van"
                    className="w-16 h-12 object-contain shrink-0 opacity-90 drop-shadow-xs select-none pointer-events-none"
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs max-w-xs">
                  <div className="font-semibold text-foreground">
                    Freeze Van (Top Priority)
                  </div>
                  <div className="text-muted-foreground text-[11px] mt-0.5">
                    1 reefer van locked for Wattala street dock access (OUT004). Mandatory
                    Wave 1 consecutive skip protection.
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Card 3: Dry Lorry */}
              <Tooltip>
                <TooltipTrigger
                  render={
                    <div className="px-4 py-3.5 min-h-[82px] bg-card border border-border/70 hover:border-border transition-all shadow-xs rounded-xl flex items-center justify-between gap-3.5 cursor-default" />
                  }
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="shrink-0">
                      <CircularProgressRing
                        value={6}
                        size={44}
                        strokeWidth={4}
                        colorClassName="text-amber-500"
                      >
                        <span className="text-xs font-heading font-black text-amber-500">
                          2
                        </span>
                      </CircularProgressRing>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-heading font-bold text-foreground truncate">
                          Dry Lorry
                        </span>
                        <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        2 / 36 Needed • 590 kg
                      </p>
                    </div>
                  </div>
                  <img
                    src="/vehicle-images/dry.png"
                    alt="Dry Lorry"
                    className="w-16 h-12 object-contain shrink-0 opacity-90 drop-shadow-xs select-none pointer-events-none"
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs max-w-xs">
                  <div className="font-semibold text-foreground">
                    Dry Lorry (Medium Priority)
                  </div>
                  <div className="text-muted-foreground text-[11px] mt-0.5">
                    2 dry lorries scheduled for Havelock (OUT032) and Negombo (OUT045)
                    ambient cargo routes.
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>

            {effectiveLoading ? (
              <TableSkeleton columns={8} rowCount={5} />
            ) : (
              <Card className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
                {/* Top Table Bar with Count & Pagination */}
                <div className="px-4 py-2.5 bg-muted/25 border-b border-border/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="relative w-56">
                      <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search carryover orders..."
                        value={carryoverSearch}
                        onChange={(e) => {
                          updateQueryParams({ search: e.target.value, page: 1 });
                        }}
                        className="pl-7 h-7 text-xs bg-card"
                      />
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="outline"
                            size="xs"
                            className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card"
                          />
                        }
                      >
                        <FunnelIcon className="size-3 text-muted-foreground" />
                        <span>
                          Brand:{" "}
                          {carryoverBrandFilter === "all"
                            ? "All"
                            : `Waypoint ${carryoverBrandFilter}`}
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-36">
                        <DropdownMenuLabel className="text-xs">
                          Filter Brand
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup
                          value={carryoverBrandFilter}
                          onValueChange={(val) => {
                            updateQueryParams({ brand: val ?? "all", page: 1 });
                          }}
                        >
                          <DropdownMenuRadioItem value="all" className="text-xs">
                            All Brands
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="Fresh" className="text-xs">
                            Waypoint Fresh
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="Style" className="text-xs">
                            Waypoint Style
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="Tech" className="text-xs">
                            Waypoint Tech
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Group By Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="outline"
                            size="xs"
                            className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card"
                          />
                        }
                      >
                        <RowsIcon className="size-3 text-muted-foreground" />
                        <span>
                          Group:{" "}
                          {carryoverGroupBy === "none"
                            ? "None"
                            : carryoverGroupBy === "action"
                              ? "By Action"
                              : "By Reason"}
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-44">
                        <DropdownMenuLabel className="text-xs">
                          Group Orders
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup
                          value={carryoverGroupBy}
                          onValueChange={(val) =>
                            updateQueryParams({
                              group: (val as "none" | "action" | "reason") ?? "none",
                            })
                          }
                        >
                          <DropdownMenuRadioItem value="none" className="text-xs">
                            None (Flat Table)
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="action" className="text-xs">
                            Group by Action
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="reason" className="text-xs">
                            Group by Deferral Reason
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="text-muted-foreground text-[11px]">
                      Showing{" "}
                      <span className="font-bold text-foreground">
                        {filteredCarryover.length === 0
                          ? 0
                          : carryoverGroupBy === "none"
                            ? (carryoverPage - 1) * carryoverPageSize + 1
                            : 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-bold text-foreground">
                        {carryoverGroupBy === "none"
                          ? Math.min(
                              carryoverPage * carryoverPageSize,
                              filteredCarryover.length
                            )
                          : filteredCarryover.length}
                      </span>{" "}
                      of{" "}
                      <span className="font-bold text-foreground">
                        {filteredCarryover.length}
                      </span>{" "}
                      orders
                    </div>
                  </div>

                  {carryoverGroupBy === "none" && totalCarryoverPages > 1 && (
                    <Pagination className="mx-0 w-auto justify-end">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              updateQueryParams({
                                page: Math.max(carryoverPage - 1, 1),
                              })
                            }
                            disabled={carryoverPage <= 1}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalCarryoverPages }, (_, i) => i + 1).map(
                          (page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                isActive={carryoverPage === page}
                                onClick={() => updateQueryParams({ page })}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        )}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              updateQueryParams({
                                page: Math.min(carryoverPage + 1, totalCarryoverPages),
                              })
                            }
                            disabled={carryoverPage >= totalCarryoverPages}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>

                {/* Carryover Table Viewport */}
                <TooltipProvider delay={100}>
                  <div className="flex-1 min-h-0 overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <TableHeader className="sticky top-0 z-20 bg-card shadow-2xs border-b border-border/80">
                        <TableRow className="border-b border-border/80 hover:bg-transparent">
                          <TableHead className="w-[140px] font-bold text-foreground text-xs">
                            Order
                          </TableHead>
                          <TableHead className="w-[220px] font-bold text-foreground text-xs">
                            Destination Store
                          </TableHead>
                          <TableHead className="w-[90px] font-bold text-foreground text-xs">
                            Temp Zone
                          </TableHead>
                          <TableHead className="w-[110px] text-right font-bold text-foreground text-xs">
                            Weight
                          </TableHead>
                          <TableHead className="w-[100px] text-right font-bold text-foreground text-xs">
                            Volume
                          </TableHead>
                          <TableHead className="w-[130px] text-right font-bold text-foreground text-xs">
                            Value (LKR)
                          </TableHead>
                          <TableHead className="w-[170px] font-bold text-foreground text-xs">
                            Deferral Reason
                          </TableHead>
                          <TableHead className="w-[170px] font-bold text-foreground text-xs">
                            Recommended Fleet
                          </TableHead>
                          <TableHead className="w-[60px] text-right font-bold text-foreground text-xs">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {carryoverGroupBy !== "none" && groupedCarryover
                          ? groupedCarryover.map((group) => (
                              <React.Fragment key={group.key}>
                                {/* Group Header Row */}
                                <TableRow className="bg-muted/40 hover:bg-muted/40 border-y border-border/70 select-none">
                                  <TableCell colSpan={9} className="py-2 px-4">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-heading font-bold text-xs text-foreground">
                                          {group.title}
                                        </span>
                                        <span className="text-[10px] font-bold text-muted-foreground bg-card px-1.5 py-0.5 rounded border border-border/50">
                                          {group.items.length}{" "}
                                          {group.items.length === 1 ? "order" : "orders"}
                                        </span>
                                        {group.description && (
                                          <span className="text-[11px] text-muted-foreground hidden lg:inline">
                                            • {group.description}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground font-mono">
                                        <span>
                                          {group.totalWeightKg.toLocaleString()} kg
                                        </span>
                                        <span>•</span>
                                        <span>{group.totalVolumeM3} m³</span>
                                        <span>•</span>
                                        <span>
                                          LKR {group.totalValueLkr.toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>

                                {group.items.map((ord) => {
                                  const isMandatory = ord.deferredYesterday === 1;
                                  const isCold = ord.tempRequirement === "chilled";

                                  return (
                                    <TableRow
                                      key={ord.id}
                                      onClick={() => handleOpenDetailByRef(ord.orderRef)}
                                      className="border-border/30 hover:bg-muted/30 cursor-pointer text-xs"
                                    >
                                      {/* Order Ref & Indicator Stroke */}
                                      <TableCell className="font-bold text-foreground py-2.5 px-4 whitespace-nowrap relative">
                                        {isMandatory ? (
                                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-red-500 rounded-r" />
                                        ) : (
                                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-500 rounded-r" />
                                        )}
                                        <Tooltip>
                                          <TooltipTrigger
                                            render={
                                              <div className="flex items-center gap-2 pl-1 cursor-help group/ref">
                                                <span
                                                  className={`size-1.5 rounded-full shrink-0 ${
                                                    isMandatory
                                                      ? "bg-red-500"
                                                      : "bg-amber-500"
                                                  }`}
                                                />
                                                <span className="group-hover/ref:text-primary transition-colors">
                                                  #{ord.orderRef}
                                                </span>
                                                {isMandatory && (
                                                  <LockKeyIcon
                                                    className="size-3 text-red-500 shrink-0"
                                                    weight="bold"
                                                  />
                                                )}
                                              </div>
                                            }
                                          />
                                          <TooltipContent className="flex items-center gap-1.5 p-1.5">
                                            <span className="text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                              Waypoint {ord.brand}
                                            </span>
                                            {isMandatory ? (
                                              <span className="text-red-700 bg-red-100 dark:bg-red-950 text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <WarningOctagonIcon
                                                  className="size-2.5"
                                                  weight="bold"
                                                />
                                                Mandatory Serve Tomorrow (Consecutive Skip
                                                Lock)
                                              </span>
                                            ) : (
                                              <span className="text-amber-700 bg-amber-100 dark:bg-amber-950 text-[11px] font-bold px-1.5 py-0.5 rounded">
                                                Carryover to Wave 1
                                              </span>
                                            )}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TableCell>

                                      {/* Destination Store */}
                                      <TableCell>
                                        <div>
                                          <span className="font-bold text-xs text-foreground block truncate max-w-[200px]">
                                            {ord.outletName}
                                          </span>
                                          <span className="text-[10px] text-muted-foreground">
                                            {ord.outletId} • {ord.district} (
                                            {ord.dockType.replace("_", " ")})
                                          </span>
                                        </div>
                                      </TableCell>

                                      {/* Temp Zone */}
                                      <TableCell>
                                        <span
                                          className={`text-[11px] font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1 ${
                                            isCold
                                              ? "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300"
                                              : "bg-muted text-foreground"
                                          }`}
                                        >
                                          {isCold && (
                                            <SnowflakeIcon className="size-2.5 shrink-0" />
                                          )}
                                          <span className="capitalize">
                                            {ord.tempRequirement}
                                          </span>
                                        </span>
                                      </TableCell>

                                      {/* Weight */}
                                      <TableCell className="text-right font-bold text-foreground">
                                        {ord.totalWeightKg.toLocaleString()} kg
                                      </TableCell>

                                      {/* Volume */}
                                      <TableCell className="text-right font-medium text-foreground">
                                        {ord.totalVolumeM3} m³
                                      </TableCell>

                                      {/* Value (LKR) */}
                                      <TableCell className="text-right font-bold text-foreground">
                                        LKR {ord.totalValueLkr.toLocaleString()}
                                      </TableCell>

                                      {/* Deferral Reason */}
                                      <TableCell>
                                        <Tooltip>
                                          <TooltipTrigger
                                            render={
                                              <span className="text-[11px] font-medium text-foreground block truncate max-w-[160px] cursor-help">
                                                {getReasonLabel(ord.deferralReason)}
                                              </span>
                                            }
                                          />
                                          <TooltipContent className="max-w-xs">
                                            <span>
                                              {ord.notes ||
                                                getReasonLabel(ord.deferralReason)}
                                            </span>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TableCell>

                                      {/* Recommended Fleet */}
                                      <TableCell>
                                        <span className="text-[11px] font-semibold text-muted-foreground block truncate max-w-[160px]">
                                          {ord.suggestedVehicleCategory}
                                        </span>
                                      </TableCell>

                                      {/* Action */}
                                      <TableCell className="text-right">
                                        <IconButton
                                          variant="ghost"
                                          size="xs"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenDetailByRef(ord.orderRef);
                                          }}
                                          className="size-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
                                          title="Inspect Order"
                                        >
                                          <ArrowSquareOutIcon className="size-3.5" />
                                        </IconButton>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </React.Fragment>
                            ))
                          : paginatedCarryover.map((ord) => {
                              const isMandatory = ord.deferredYesterday === 1;
                              const isCold = ord.tempRequirement === "chilled";

                              return (
                                <TableRow
                                  key={ord.id}
                                  onClick={() => handleOpenDetailByRef(ord.orderRef)}
                                  className="border-border/30 hover:bg-muted/30 cursor-pointer text-xs"
                                >
                                  {/* Order Ref & Indicator Stroke */}
                                  <TableCell className="font-bold text-foreground py-2.5 px-4 whitespace-nowrap relative">
                                    {isMandatory ? (
                                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-red-500 rounded-r" />
                                    ) : (
                                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-500 rounded-r" />
                                    )}
                                    <Tooltip>
                                      <TooltipTrigger
                                        render={
                                          <div className="flex items-center gap-2 pl-1 cursor-help group/ref">
                                            <span
                                              className={`size-1.5 rounded-full shrink-0 ${
                                                isMandatory
                                                  ? "bg-red-500"
                                                  : "bg-amber-500"
                                              }`}
                                            />
                                            <span className="group-hover/ref:text-primary transition-colors">
                                              #{ord.orderRef}
                                            </span>
                                            {isMandatory && (
                                              <LockKeyIcon
                                                className="size-3 text-red-500 shrink-0"
                                                weight="bold"
                                              />
                                            )}
                                          </div>
                                        }
                                      />
                                      <TooltipContent className="flex items-center gap-1.5 p-1.5">
                                        <span className="text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                          Waypoint {ord.brand}
                                        </span>
                                        {isMandatory ? (
                                          <span className="text-red-700 bg-red-100 dark:bg-red-950 text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                            <WarningOctagonIcon
                                              className="size-2.5"
                                              weight="bold"
                                            />
                                            Mandatory Serve Tomorrow (Consecutive Skip
                                            Lock)
                                          </span>
                                        ) : (
                                          <span className="text-amber-700 bg-amber-100 dark:bg-amber-950 text-[11px] font-bold px-1.5 py-0.5 rounded">
                                            Carryover to Wave 1
                                          </span>
                                        )}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TableCell>

                                  {/* Destination Store */}
                                  <TableCell>
                                    <div>
                                      <span className="font-bold text-xs text-foreground block truncate max-w-[200px]">
                                        {ord.outletName}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground">
                                        {ord.outletId} • {ord.district} (
                                        {ord.dockType.replace("_", " ")})
                                      </span>
                                    </div>
                                  </TableCell>

                                  {/* Temp Zone */}
                                  <TableCell>
                                    <span
                                      className={`text-[11px] font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1 ${
                                        isCold
                                          ? "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300"
                                          : "bg-muted text-foreground"
                                      }`}
                                    >
                                      {isCold && (
                                        <SnowflakeIcon className="size-2.5 shrink-0" />
                                      )}
                                      <span className="capitalize">
                                        {ord.tempRequirement}
                                      </span>
                                    </span>
                                  </TableCell>

                                  {/* Weight */}
                                  <TableCell className="text-right font-bold text-foreground">
                                    {ord.totalWeightKg.toLocaleString()} kg
                                  </TableCell>

                                  {/* Volume */}
                                  <TableCell className="text-right font-medium text-foreground">
                                    {ord.totalVolumeM3} m³
                                  </TableCell>

                                  {/* Value (LKR) */}
                                  <TableCell className="text-right font-bold text-foreground">
                                    LKR {ord.totalValueLkr.toLocaleString()}
                                  </TableCell>

                                  {/* Deferral Reason */}
                                  <TableCell>
                                    <Tooltip>
                                      <TooltipTrigger
                                        render={
                                          <span className="text-[11px] font-medium text-foreground block truncate max-w-[160px] cursor-help">
                                            {getReasonLabel(ord.deferralReason)}
                                          </span>
                                        }
                                      />
                                      <TooltipContent className="max-w-xs">
                                        <span>
                                          {ord.notes ||
                                            getReasonLabel(ord.deferralReason)}
                                        </span>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TableCell>

                                  {/* Recommended Fleet */}
                                  <TableCell>
                                    <span className="text-[11px] font-semibold text-muted-foreground block truncate max-w-[160px]">
                                      {ord.suggestedVehicleCategory}
                                    </span>
                                  </TableCell>

                                  {/* Action */}
                                  <TableCell className="text-right">
                                    <IconButton
                                      variant="ghost"
                                      size="xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenDetailByRef(ord.orderRef);
                                      }}
                                      className="size-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
                                      title="Inspect Order"
                                    >
                                      <ArrowSquareOutIcon className="size-3.5" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                      </TableBody>
                    </table>
                  </div>
                </TooltipProvider>
              </Card>
            )}
          </>
        ) : effectiveLoading ? (
          <TableSkeleton columns={9} rowCount={5} />
        ) : (
          <Card className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
            {/* Filter Bar */}
            <div className="px-4 py-2.5 bg-muted/25 border-b border-border/50 shrink-0 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
                <div className="relative w-full">
                  <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search order ref, store, dispatcher, notes..."
                    value={auditSearch}
                    onChange={(e) => {
                      updateQueryParams({ search: e.target.value, page: 1 });
                    }}
                    className="pl-7 h-7 text-xs bg-card"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Reason Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        size="xs"
                        className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card"
                      />
                    }
                  >
                    <FunnelIcon className="size-3 text-muted-foreground" />
                    <span>
                      Reason:{" "}
                      {auditReasonFilter === "all"
                        ? "All"
                        : getReasonLabel(auditReasonFilter)}
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="text-xs">
                      Filter Deferral Reason
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                      value={auditReasonFilter}
                      onValueChange={(val) => {
                        updateQueryParams({ reason: val ?? "all", page: 1 });
                      }}
                    >
                      <DropdownMenuRadioItem value="all" className="text-xs">
                        All Reasons
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="insufficient_reefer_capacity"
                        className="text-xs"
                      >
                        Reefer Capacity Saturated
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="van_access_shortage"
                        className="text-xs"
                      >
                        Van Access Shortage
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="time_budget_limit"
                        className="text-xs"
                      >
                        Time Budget Exceeded
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="fuel_quota_exceeded"
                        className="text-xs"
                      >
                        Fleet Downtime / Workshop
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Resource Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        size="xs"
                        className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card"
                      />
                    }
                  >
                    <span>
                      Resource:{" "}
                      {auditResourceFilter === "all"
                        ? "All"
                        : getResourceBadge(auditResourceFilter)}
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel className="text-xs">
                      Limiting Resource
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                      value={auditResourceFilter}
                      onValueChange={(val) => {
                        updateQueryParams({ resource: val ?? "all", page: 1 });
                      }}
                    >
                      <DropdownMenuRadioItem value="all" className="text-xs">
                        All Resources
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="weight_cap" className="text-xs">
                        Weight Cap
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="volume_cap" className="text-xs">
                        Volume Cap
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="time_budget" className="text-xs">
                        Driver Time Budget
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="fleet_downtime" className="text-xs">
                        Fleet Downtime
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Group By Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        size="xs"
                        className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card"
                      />
                    }
                  >
                    <RowsIcon className="size-3 text-muted-foreground" />
                    <span>
                      Group:{" "}
                      {auditGroupBy === "none"
                        ? "None"
                        : auditGroupBy === "action"
                          ? "By Action"
                          : "By Reason"}
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel className="text-xs">
                      Group Audit Records
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                      value={auditGroupBy}
                      onValueChange={(val) =>
                        updateQueryParams({
                          group: (val as "none" | "action" | "reason") ?? "none",
                        })
                      }
                    >
                      <DropdownMenuRadioItem value="none" className="text-xs">
                        None (Flat Table)
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="action" className="text-xs">
                        Group by Action
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="reason" className="text-xs">
                        Group by Deferral Reason
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="text-muted-foreground text-[11px] ml-2">
                  <span className="font-bold text-foreground">
                    {filteredAuditLogs.length}
                  </span>{" "}
                  records
                </div>
              </div>
            </div>

            {/* Audit Log Table Viewport */}
            <TooltipProvider delay={100}>
              <div className="flex-1 min-h-0 overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <TableHeader className="sticky top-0 z-20 bg-card shadow-2xs border-b border-border/80">
                    <TableRow className="border-b border-border/80 hover:bg-transparent">
                      <TableHead
                        className="w-[110px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleAuditSort("date")}
                      >
                        <div className="flex items-center gap-1">
                          <span>Dispatch Date</span>
                          <SortHeaderIcon
                            active={auditSortKey === "date"}
                            direction={auditSortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead
                        className="w-[120px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleAuditSort("orderRef")}
                      >
                        <div className="flex items-center gap-1">
                          <span>Order</span>
                          <SortHeaderIcon
                            active={auditSortKey === "orderRef"}
                            direction={auditSortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead className="w-[190px] font-bold text-foreground text-xs">
                        Outlet / Store
                      </TableHead>

                      <TableHead className="w-[170px] font-bold text-foreground text-xs">
                        Deferral Reason
                      </TableHead>

                      <TableHead className="w-[120px] font-bold text-foreground text-xs">
                        Limiting Resource
                      </TableHead>

                      <TableHead
                        className="w-[100px] text-right cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleAuditSort("weight")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Weight</span>
                          <SortHeaderIcon
                            active={auditSortKey === "weight"}
                            direction={auditSortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead
                        className="w-[110px] text-right cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleAuditSort("value")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Value (LKR)</span>
                          <SortHeaderIcon
                            active={auditSortKey === "value"}
                            direction={auditSortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead className="w-[140px] font-bold text-foreground text-xs">
                        Decision Maker
                      </TableHead>

                      <TableHead className="w-[50px] text-right font-bold text-foreground text-xs">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {auditGroupBy !== "none" && groupedAuditLogs
                      ? groupedAuditLogs.map((group) => (
                          <React.Fragment key={group.key}>
                            {/* Group Header Row */}
                            <TableRow className="bg-muted/40 hover:bg-muted/40 border-y border-border/70 select-none">
                              <TableCell colSpan={9} className="py-2 px-4">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-heading font-bold text-xs text-foreground">
                                      {group.title}
                                    </span>
                                    <span className="text-[10px] font-bold text-muted-foreground bg-card px-1.5 py-0.5 rounded border border-border/50">
                                      {group.items.length}{" "}
                                      {group.items.length === 1 ? "record" : "records"}
                                    </span>
                                    {group.description && (
                                      <span className="text-[11px] text-muted-foreground hidden lg:inline">
                                        • {group.description}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground font-mono">
                                    <span>{group.totalWeightKg.toLocaleString()} kg</span>
                                    <span>•</span>
                                    <span>{group.totalVolumeM3} m³</span>
                                    <span>•</span>
                                    <span>
                                      LKR {group.totalValueLkr.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>

                            {group.items.map((log) => (
                              <TableRow
                                key={log.id}
                                onClick={() => handleOpenDetailByRef(log.orderRef)}
                                className="border-border/30 hover:bg-muted/30 cursor-pointer text-xs"
                              >
                                {/* Dispatch Date */}
                                <TableCell className="font-semibold text-foreground py-2.5 px-4 whitespace-nowrap">
                                  {log.dispatchDate}
                                </TableCell>

                                {/* Order Ref & Dot */}
                                <TableCell className="font-bold text-foreground py-2.5 px-4 whitespace-nowrap relative">
                                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-500 rounded-r" />
                                  <div className="flex items-center gap-2 pl-1">
                                    <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                                    <span>#{log.orderRef}</span>
                                  </div>
                                </TableCell>

                                {/* Outlet Name */}
                                <TableCell>
                                  <div>
                                    <span className="font-bold text-xs text-foreground block truncate max-w-[180px]">
                                      {log.outletName}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                      {log.outletId} • {log.district}
                                    </span>
                                  </div>
                                </TableCell>

                                {/* Deferral Reason with Notes Tooltip */}
                                <TableCell>
                                  <Tooltip>
                                    <TooltipTrigger
                                      render={
                                        <span className="font-semibold text-foreground text-[11px] block truncate max-w-[160px] cursor-help">
                                          {getReasonLabel(log.deferralReason)}
                                        </span>
                                      }
                                    />
                                    <TooltipContent className="max-w-xs">
                                      <span>{log.notes}</span>
                                    </TooltipContent>
                                  </Tooltip>
                                </TableCell>

                                {/* Limiting Resource */}
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] font-semibold px-1.5 py-0.5"
                                  >
                                    {getResourceBadge(log.limitingResource)}
                                  </Badge>
                                </TableCell>

                                {/* Weight */}
                                <TableCell className="text-right font-bold text-foreground">
                                  {log.totalWeightKg} kg
                                </TableCell>

                                {/* Value (LKR) */}
                                <TableCell className="text-right font-bold text-foreground">
                                  LKR {log.totalValueLkr.toLocaleString()}
                                </TableCell>

                                {/* Decision Maker */}
                                <TableCell>
                                  <div className="flex items-center gap-1.5">
                                    <UserIcon className="size-3 text-muted-foreground shrink-0" />
                                    <div>
                                      <span className="font-semibold text-xs text-foreground block leading-tight">
                                        {log.decisionMakerName}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground">
                                        {log.decisionMakerStaffId}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Action */}
                                <TableCell className="text-right">
                                  <IconButton
                                    variant="ghost"
                                    size="xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenDetailByRef(log.orderRef);
                                    }}
                                    className="size-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
                                    title="Inspect Order"
                                  >
                                    <ArrowSquareOutIcon className="size-3.5" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </React.Fragment>
                        ))
                      : paginatedAuditLogs.map((log) => (
                          <TableRow
                            key={log.id}
                            onClick={() => handleOpenDetailByRef(log.orderRef)}
                            className="border-border/30 hover:bg-muted/30 cursor-pointer text-xs"
                          >
                            {/* Dispatch Date */}
                            <TableCell className="font-semibold text-foreground py-2.5 px-4 whitespace-nowrap">
                              {log.dispatchDate}
                            </TableCell>

                            {/* Order Ref & Dot */}
                            <TableCell className="font-bold text-foreground py-2.5 px-4 whitespace-nowrap relative">
                              <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-500 rounded-r" />
                              <div className="flex items-center gap-2 pl-1">
                                <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                                <span>#{log.orderRef}</span>
                              </div>
                            </TableCell>

                            {/* Outlet Name */}
                            <TableCell>
                              <div>
                                <span className="font-bold text-xs text-foreground block truncate max-w-[180px]">
                                  {log.outletName}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {log.outletId} • {log.district}
                                </span>
                              </div>
                            </TableCell>

                            {/* Deferral Reason with Notes Tooltip */}
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <span className="font-semibold text-foreground text-[11px] block truncate max-w-[160px] cursor-help">
                                      {getReasonLabel(log.deferralReason)}
                                    </span>
                                  }
                                />
                                <TooltipContent className="max-w-xs">
                                  <span>{log.notes}</span>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>

                            {/* Limiting Resource */}
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className="text-[10px] font-semibold px-1.5 py-0.5"
                              >
                                {getResourceBadge(log.limitingResource)}
                              </Badge>
                            </TableCell>

                            {/* Weight */}
                            <TableCell className="text-right font-bold text-foreground">
                              {log.totalWeightKg} kg
                            </TableCell>

                            {/* Value (LKR) */}
                            <TableCell className="text-right font-bold text-foreground">
                              LKR {log.totalValueLkr.toLocaleString()}
                            </TableCell>

                            {/* Decision Maker */}
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <UserIcon className="size-3 text-muted-foreground shrink-0" />
                                <div>
                                  <span className="font-semibold text-xs text-foreground block leading-tight">
                                    {log.decisionMakerName}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {log.decisionMakerStaffId}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            {/* Action */}
                            <TableCell className="text-right">
                              <IconButton
                                variant="ghost"
                                size="xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDetailByRef(log.orderRef);
                                }}
                                className="size-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
                                title="Inspect Order"
                              >
                                <ArrowSquareOutIcon className="size-3.5" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </table>
              </div>
            </TooltipProvider>

            {/* Bottom Pagination */}
            {totalAuditPages > 1 && (
              <div className="px-4 py-2 bg-muted/20 border-t border-border/50 shrink-0 flex items-center justify-between text-xs">
                <span className="text-muted-foreground text-[11px]">
                  Page {auditPage} of {totalAuditPages}
                </span>

                <Pagination className="mx-0 w-auto justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          updateQueryParams({
                            page: Math.max(auditPage - 1, 1),
                          })
                        }
                        disabled={auditPage <= 1}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalAuditPages }, (_, i) => i + 1).map(
                      (page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={auditPage === page}
                            onClick={() => updateQueryParams({ page })}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          updateQueryParams({
                            page: Math.min(auditPage + 1, totalAuditPages),
                          })
                        }
                        disabled={auditPage >= totalAuditPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Order Detail Sheet */}
      <OrderDetailSheet
        order={selectedOrder}
        open={isDetailOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDetail();
          }
        }}
      />
    </div>
  );
}
