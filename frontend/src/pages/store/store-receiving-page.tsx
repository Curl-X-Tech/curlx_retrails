import * as React from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowsClockwiseIcon,
  MagnifyingGlassIcon,
  TruckIcon,
  SquaresFourIcon,
  RowsIcon,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useStoreReceiving,
  StoreReceivingKpis,
  StoreReceivingShipmentCard,
  StoreReceivingModal,
} from "@/features/store";

export function StoreReceivingPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "all";
  const tempFilter = searchParams.get("temp") || "all";
  const viewMode = searchParams.get("view") || "grid";

  const {
    kpis,
    activeShipment,
    isReceivingModalOpen,
    openInspection,
    closeInspection,
    confirmReceiving,
    getFilteredShipments,
    isSubmitting,
  } = useStoreReceiving();

  const filteredShipments = React.useMemo(() => {
    return getFilteredShipments({ searchQuery, statusFilter, tempFilter });
  }, [getFilteredShipments, searchQuery, statusFilter, tempFilter]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all" || (key === "view" && value === "grid")) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Page Header */}
      <div className="border-b border-border/60 bg-card px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TruckIcon className="size-5 text-primary" weight="bold" />
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Inbound Receiving
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                Dock & Receiving
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Verify incoming vehicle manifests, inspect cold-chain integrity, log crate
              returns, and sign off POD receipts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => window.location.reload()}
            >
              <ArrowsClockwiseIcon className="size-3.5 mr-1.5" />
              Refresh Bay
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <StoreReceivingKpis kpis={kpis} />

      {/* Filter Toolbar */}
      <div className="px-4 sm:px-6 py-3 border-b border-border/50 bg-card/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search truck no, driver, order or trip ID..."
              value={searchQuery}
              onChange={(e) => updateFilter("q", e.target.value)}
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => updateFilter("status", e.target.value)}
            aria-label="Filter by Status"
            className="h-8 text-xs px-2.5 rounded-md border border-border bg-background text-foreground"
          >
            <option value="all">All Statuses</option>
            <option value="docked">Docked at Bay</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Received</option>
            <option value="discrepancy">Discrepancy Logged</option>
          </select>

          {/* Temperature Filter */}
          <select
            value={tempFilter}
            onChange={(e) => updateFilter("temp", e.target.value)}
            aria-label="Filter by Temperature"
            className="h-8 text-xs px-2.5 rounded-md border border-border bg-background text-foreground"
          >
            <option value="all">All Temperatures</option>
            <option value="chilled">Cold-Chain Reefer</option>
            <option value="ambient">Ambient</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center border border-border rounded-md bg-background p-0.5">
            <button
              type="button"
              onClick={() => updateFilter("view", "grid")}
              className={`p-1.5 rounded ${
                viewMode === "grid"
                  ? "bg-muted text-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Grid View"
            >
              <SquaresFourIcon className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => updateFilter("view", "table")}
              className={`p-1.5 rounded ${
                viewMode === "table"
                  ? "bg-muted text-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Table View"
            >
              <RowsIcon className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6">
        {filteredShipments.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border/60 rounded-xl bg-card/20">
            <TruckIcon className="size-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-sm font-bold text-foreground">
              No Inbound Shipments Found
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              No delivery trucks currently match your search and filter parameters.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredShipments.map((shipment) => (
              <StoreReceivingShipmentCard
                key={shipment.id}
                shipment={shipment}
                onInspect={openInspection}
              />
            ))}
          </div>
        ) : (
          <div className="border border-border/70 rounded-xl bg-card overflow-x-auto shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Vehicle & Trip</th>
                  <th className="py-2.5 px-4">Order Ref</th>
                  <th className="py-2.5 px-4">Driver</th>
                  <th className="py-2.5 px-4">Temp</th>
                  <th className="py-2.5 px-4">ETA / Time</th>
                  <th className="py-2.5 px-4 text-right">Packages</th>
                  <th className="py-2.5 px-4 text-right">Weight</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {filteredShipments.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-bold text-foreground">
                      <div>{s.vehicleNo}</div>
                      <div className="text-[10px] text-muted-foreground font-normal">
                        {s.tripId}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-normal">
                      {s.orderRef}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-medium text-foreground">{s.driverName}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {s.driverPhone}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {s.tempRequirement === "chilled" ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-900 text-cyan-100">
                          {s.reeferTempC !== undefined ? `${s.reeferTempC}°C` : "Reefer"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">Ambient</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-normal text-muted-foreground">
                      {s.status === "delivered" ? s.deliveredAt : s.eta}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-foreground">
                      {s.totalPackages}
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground font-normal">
                      {s.totalWeightKg.toFixed(1)} kg
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {s.status === "docked" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                          Docked
                        </span>
                      )}
                      {s.status === "in_transit" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-700 text-white">
                          In Transit
                        </span>
                      )}
                      {s.status === "delivered" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-100">
                          Received
                        </span>
                      )}
                      {s.status === "discrepancy" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                          Discrepancy
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => openInspection(s)}
                      >
                        {s.status === "delivered" || s.status === "discrepancy"
                          ? "View"
                          : "Inspect"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inbound Inspection Modal */}
      <StoreReceivingModal
        isOpen={isReceivingModalOpen}
        onClose={closeInspection}
        shipment={activeShipment}
        onConfirm={confirmReceiving}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
