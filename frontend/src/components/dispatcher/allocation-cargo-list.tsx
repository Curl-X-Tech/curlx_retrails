import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import type { CargoItem } from "@/data/mock-allocation-details";
import { CargoListTable } from "./cargo-list-table";
import { CargoListHeader } from "./cargo-list-header";
import { useCargoListFilter } from "./use-cargo-list-filter";

interface AllocationCargoListProps {
  cargoList: CargoItem[];
  manifestCode?: string;
  unitId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  className?: string;
}

export function AllocationCargoList({
  cargoList,
  manifestCode,
  open,
  onOpenChange,
  trigger,
  className,
}: AllocationCargoListProps) {
  const [internalOpen, setInternalOpen] = React.useState<boolean>(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange || (() => {}) : setInternalOpen;

  const {
    searchQuery,
    setSearchQuery,
    sortField,
    sortOrder,
    groupByStops,
    setGroupByStops,
    totalWeightKg,
    handleSort,
    filteredItems,
    stopGroups,
  } = useCargoListFilter(cargoList);

  const handleExport = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(cargoList, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `cargo_manifest_${manifestCode || "export"}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <SheetTrigger render={trigger as React.ReactElement} />}

      <SheetContent
        side="right"
        className={`w-full data-[side=right]:sm:max-w-2xl data-[side=right]:md:max-w-3xl data-[side=right]:lg:max-w-4xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 flex flex-col h-full bg-card border-l border-border/80 shadow-2xl ${className || ""}`}
      >
        <CargoListHeader
          manifestCode={manifestCode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          groupByStops={groupByStops}
          onToggleGroupByStops={() => setGroupByStops(!groupByStops)}
          onSortByWeight={() => handleSort("weight")}
          onExport={handleExport}
        />

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-4 sm:p-5">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              No cargo packages match the filter criteria.
            </div>
          ) : (
            <CargoListTable
              items={filteredItems}
              stopGroups={stopGroups}
              groupByStops={groupByStops}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          )}
        </div>

        <SheetFooter className="p-4 border-t border-border/80 bg-muted/20 shrink-0 flex flex-row items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {filteredItems.length} items • {totalWeightKg} kg total
          </span>

          <SheetClose
            render={
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-4 text-xs font-semibold cursor-pointer rounded-lg"
              >
                Close
              </Button>
            }
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
