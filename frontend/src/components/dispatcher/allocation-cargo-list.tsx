import * as React from "react";
import {
  FadersIcon,
  DownloadSimpleIcon,
  CaretDownIcon,
  CaretUpDownIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { CargoItem } from "@/data/mock-allocation-details";

interface AllocationCargoListProps {
  cargoList: CargoItem[];
  manifestCode?: string;
  unitId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  className?: string;
}

type SortField = "code" | "weight" | null;
type SortOrder = "asc" | "desc";

interface StopGroup {
  seq: number;
  name: string;
  items: CargoItem[];
  totalWeight: number;
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

  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [sortField, setSortField] = React.useState<SortField>(null);
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("asc");
  const [groupByStops, setGroupByStops] = React.useState<boolean>(true);

  const totalWeightKg = React.useMemo(() => {
    return cargoList.reduce((sum, item) => sum + item.weightKg, 0);
  }, [cargoList]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === "asc") setSortOrder("desc");
      else {
        setSortField(null);
        setSortOrder("asc");
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredItems = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let list = cargoList.filter((item) => {
      if (!query) return true;
      return (
        item.code.toLowerCase().includes(query) ||
        item.store.toLowerCase().includes(query) ||
        (item.stopName && item.stopName.toLowerCase().includes(query)) ||
        item.destination.toLowerCase().includes(query) ||
        item.shc.toLowerCase().includes(query) ||
        item.weightKg.toString().includes(query)
      );
    });

    if (!sortField) return list;
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === "code") {
        cmp = a.code.localeCompare(b.code);
      } else if (sortField === "weight") {
        cmp = a.weightKg - b.weightKg;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [cargoList, searchQuery, sortField, sortOrder]);

  // Group items by stop for unified table view
  const stopGroups = React.useMemo(() => {
    const map = new Map<number, StopGroup>();

    filteredItems.forEach((item) => {
      const seq = item.stopSeq || 1;
      const name = item.stopName || item.destination;

      if (!map.has(seq)) {
        map.set(seq, {
          seq,
          name,
          items: [],
          totalWeight: 0,
        });
      }

      const group = map.get(seq)!;
      group.items.push(item);
      group.totalWeight += item.weightKg;
    });

    return Array.from(map.values()).sort((a, b) => a.seq - b.seq);
  }, [filteredItems]);

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
        <SheetHeader className="p-5 border-b border-border/80 bg-muted/20 shrink-0 space-y-3">
          <SheetTitle className="font-heading font-black text-lg text-foreground tracking-tight">
            {manifestCode || "Cargo Orders"}
          </SheetTitle>

          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter packages by code, store, destination..."
                className="pl-8 h-8 text-xs bg-background rounded-lg border-border/80"
              />
            </div>

            <Button
              variant={groupByStops ? "default" : "outline"}
              size="sm"
              onClick={() => setGroupByStops(!groupByStops)}
              className="h-8 px-2.5 text-xs font-semibold cursor-pointer rounded-lg"
            >
              <MapPinIcon className="size-3.5 mr-1" />
              Group by Stops
            </Button>

            <IconButton
              variant="outline"
              size="xs"
              onClick={() => handleSort("weight")}
              className="size-8 rounded-lg cursor-pointer shrink-0"
              title="Sort by weight"
            >
              <FadersIcon className="size-3.5" />
            </IconButton>

            <IconButton
              variant="outline"
              size="xs"
              onClick={handleExport}
              className="size-8 rounded-lg cursor-pointer shrink-0"
              title="Export JSON"
            >
              <DownloadSimpleIcon className="size-3.5" />
            </IconButton>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              No cargo packages match the filter criteria.
            </div>
          ) : (
            <div className="border border-border/80 rounded-xl overflow-hidden bg-background">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
                    <TableHead
                      onClick={() => handleSort("code")}
                      className="text-[11px] font-bold text-muted-foreground uppercase cursor-pointer select-none whitespace-nowrap h-9 px-4"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>CARGO CODE</span>
                        {sortField === "code" ? (
                          <CaretDownIcon
                            className={`size-3 text-foreground transition-transform ${
                              sortOrder === "desc" ? "rotate-180" : ""
                            }`}
                          />
                        ) : (
                          <CaretUpDownIcon className="size-3 text-muted-foreground/60" />
                        )}
                      </div>
                    </TableHead>

                    <TableHead
                      onClick={() => handleSort("weight")}
                      className="text-[11px] font-bold text-muted-foreground uppercase cursor-pointer select-none whitespace-nowrap h-9 px-4"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>WEIGHT</span>
                        {sortField === "weight" ? (
                          <CaretDownIcon
                            className={`size-3 text-foreground transition-transform ${
                              sortOrder === "desc" ? "rotate-180" : ""
                            }`}
                          />
                        ) : (
                          <CaretUpDownIcon className="size-3 text-muted-foreground/60" />
                        )}
                      </div>
                    </TableHead>

                    <TableHead className="text-[11px] font-bold text-muted-foreground uppercase whitespace-nowrap h-9 px-4">
                      STORE
                    </TableHead>

                    <TableHead className="text-[11px] font-bold text-muted-foreground uppercase whitespace-nowrap h-9 px-4">
                      DESTINATION
                    </TableHead>

                    <TableHead className="text-[11px] font-bold text-muted-foreground uppercase text-right whitespace-nowrap h-9 px-4">
                      SHC
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {groupByStops
                    ? stopGroups.map((group) => (
                        <React.Fragment key={group.seq}>
                          <TableRow className="bg-muted/60 hover:bg-muted/60 border-t border-b border-border/60">
                            <TableCell
                              colSpan={5}
                              className="py-2 px-4 text-xs font-heading font-bold text-foreground"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="size-4.5 rounded-full bg-foreground text-background font-bold text-[10px] flex items-center justify-center">
                                    {group.seq}
                                  </span>
                                  <span>{group.name}</span>
                                </div>
                                <span className="text-[11px] font-normal text-muted-foreground">
                                  {group.items.length}{" "}
                                  {group.items.length === 1 ? "item" : "items"} •{" "}
                                  {group.totalWeight} kg
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>

                          {group.items.map((item) => (
                            <TableRow
                              key={item.id}
                              className="border-border/40 hover:bg-muted/30 transition-colors text-xs"
                            >
                              <TableCell className="font-semibold text-foreground py-2.5 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-2 pl-2">
                                  <span className="size-1.5 rounded-full bg-[#0070BA] shrink-0" />
                                  <span>{item.code}</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-bold text-foreground py-2.5 px-4 whitespace-nowrap">
                                {item.weightKg} kg
                              </TableCell>
                              <TableCell className="text-muted-foreground py-2.5 px-4 whitespace-nowrap">
                                {item.store}
                              </TableCell>
                              <TableCell className="font-medium text-foreground py-2.5 px-4 truncate max-w-[240px]">
                                {item.destination}
                              </TableCell>
                              <TableCell className="text-right py-2.5 px-4 font-bold text-xs text-foreground whitespace-nowrap">
                                {item.shc}
                              </TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))
                    : filteredItems.map((item) => (
                        <TableRow
                          key={item.id}
                          className="border-border/40 hover:bg-muted/30 transition-colors text-xs"
                        >
                          <TableCell className="font-semibold text-foreground py-2.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="size-1.5 rounded-full bg-[#0070BA] shrink-0" />
                              <span>{item.code}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-foreground py-2.5 px-4 whitespace-nowrap">
                            {item.weightKg} kg
                          </TableCell>
                          <TableCell className="text-muted-foreground py-2.5 px-4 whitespace-nowrap">
                            {item.store}
                          </TableCell>
                          <TableCell className="font-medium text-foreground py-2.5 px-4 truncate max-w-[240px]">
                            {item.destination}
                          </TableCell>
                          <TableCell className="text-right py-2.5 px-4 font-bold text-xs text-foreground whitespace-nowrap">
                            {item.shc}
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
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
