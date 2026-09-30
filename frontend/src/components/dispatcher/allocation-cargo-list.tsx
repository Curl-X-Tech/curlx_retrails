import * as React from "react";
import {
  FadersIcon,
  DownloadSimpleIcon,
  CaretDownIcon,
  CaretUpDownIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
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
  className?: string;
}

type SortField = "code" | "weight" | null;
type SortOrder = "asc" | "desc";

export function AllocationCargoList({ cargoList, className }: AllocationCargoListProps) {
  const [sortField, setSortField] = React.useState<SortField>(null);
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("asc");

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

  const sortedList = React.useMemo(() => {
    if (!sortField) return cargoList;
    return [...cargoList].sort((a, b) => {
      let cmp = 0;
      if (sortField === "code") {
        cmp = a.code.localeCompare(b.code);
      } else if (sortField === "weight") {
        cmp = a.weightKg - b.weightKg;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [cargoList, sortField, sortOrder]);

  const renderShcBadge = (shc: CargoItem["shc"]) => {
    switch (shc) {
      case "AVI":
        return (
          <span className="inline-flex items-center justify-center bg-amber-500 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-sm shadow-xs tracking-wider">
            AVI
          </span>
        );
      case "PER":
        return (
          <span className="inline-flex items-center justify-center bg-red-600 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-sm shadow-xs tracking-wider">
            PER
          </span>
        );
      case "ELI":
        return (
          <span className="inline-flex items-center justify-center bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 font-mono font-bold text-[10px] px-2 py-0.5 rounded-sm shadow-xs tracking-wider">
            ELI
          </span>
        );
      case "GEN":
      default:
        return (
          <span className="inline-flex items-center justify-center bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded-sm tracking-wider">
            GEN
          </span>
        );
    }
  };

  return (
    <Card
      className={`p-4 bg-card rounded-2xl border border-border/80 shadow-xs space-y-3 min-w-0 ${
        className || ""
      }`}
    >
      {/* Header with Title and Actions */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-black text-sm sm:text-base text-foreground tracking-tight">
          CARGO LIST
        </h3>
        <div className="flex items-center gap-1.5">
          <IconButton
            variant="ghost"
            size="xs"
            onClick={() => handleSort("weight")}
            className="size-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
            title="Filter and Sort"
          >
            <FadersIcon className="size-4" />
          </IconButton>
          <IconButton
            variant="ghost"
            size="xs"
            onClick={() => {
              const dataStr =
                "data:text/json;charset=utf-8," +
                encodeURIComponent(JSON.stringify(cargoList, null, 2));
              const downloadAnchor = document.createElement("a");
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", "cargo_manifest.json");
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="size-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
            title="Export Manifest"
          >
            <DownloadSimpleIcon className="size-4" />
          </IconButton>
        </div>
      </div>

      {/* Cargo Items Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead
                onClick={() => handleSort("code")}
                className="text-[11px] font-bold text-muted-foreground uppercase cursor-pointer select-none whitespace-nowrap h-8"
              >
                <div className="flex items-center gap-1">
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
                className="text-[11px] font-bold text-muted-foreground uppercase cursor-pointer select-none whitespace-nowrap h-8"
              >
                <div className="flex items-center gap-1">
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

              <TableHead className="text-[11px] font-bold text-muted-foreground uppercase whitespace-nowrap h-8">
                Store
              </TableHead>

              <TableHead className="text-[11px] font-bold text-muted-foreground uppercase whitespace-nowrap h-8">
                DESTINATION
              </TableHead>

              <TableHead className="text-[11px] font-bold text-muted-foreground uppercase text-right whitespace-nowrap h-8">
                SHC
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedList.map((item) => (
              <TableRow
                key={item.id}
                className="border-border/40 hover:bg-muted/40 transition-colors text-xs"
              >
                {/* Cargo Code with Blue Bullet */}
                <TableCell className="font-mono font-medium text-foreground py-2.5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-[#0070BA] shrink-0" />
                    <span>{item.code}</span>
                  </div>
                </TableCell>

                {/* Weight */}
                <TableCell className="font-mono font-semibold text-foreground py-2.5 whitespace-nowrap">
                  {item.weightKg} kg
                </TableCell>

                {/* Store */}
                <TableCell className="text-muted-foreground py-2.5 whitespace-nowrap">
                  {item.store}
                </TableCell>

                {/* Destination */}
                <TableCell className="font-medium text-foreground py-2.5 truncate max-w-[200px]">
                  {item.destination}
                </TableCell>

                {/* SHC Badge */}
                <TableCell className="text-right py-2.5 whitespace-nowrap">
                  {renderShcBadge(item.shc)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
