import {
  MagnifyingGlassIcon,
  CalendarBlankIcon,
  StorefrontIcon,
  CaretDownIcon,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StoreOutletOption } from "../types";

interface OrderFormDestinationProps {
  selectedOutlet: StoreOutletOption;
  onSelectOutlet: (outlet: StoreOutletOption) => void;
  selectedDate: string;
  minDeliveryDate: string;
  onChangeDate: (date: string) => void;
  outletSearch: string;
  onChangeOutletSearch: (search: string) => void;
  filteredOutlets: StoreOutletOption[];
}

export function OrderFormDestination({
  selectedOutlet,
  onSelectOutlet,
  selectedDate,
  minDeliveryDate,
  onChangeDate,
  outletSearch,
  onChangeOutletSearch,
  filteredOutlets,
}: OrderFormDestinationProps) {
  const isSingleOutlet = filteredOutlets.length <= 1;

  return (
    <div className="grid grid-cols-1 gap-3.5">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <StorefrontIcon className="size-4 text-primary" />
            Destination Location
          </label>
          {isSingleOutlet && (
            <Badge variant="outline" className="text-[10px] font-semibold text-primary">
              Assigned Outlet
            </Badge>
          )}
        </div>

        {isSingleOutlet ? (
          <div className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <StorefrontIcon className="size-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">
                  {selectedOutlet.name} ({selectedOutlet.code})
                </p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {selectedOutlet.district} • {selectedOutlet.depot} Depot •{" "}
                  {selectedOutlet.dockType.replace("_", " ")}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-card hover:bg-muted/30 border border-border text-left transition-colors cursor-pointer outline-none shadow-2xs"
                />
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                <MagnifyingGlassIcon className="size-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    {selectedOutlet.name} ({selectedOutlet.code})
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {selectedOutlet.district} • {selectedOutlet.depot} Depot •{" "}
                    {selectedOutlet.dockType.replace("_", " ")}
                  </p>
                </div>
              </div>
              <CaretDownIcon className="size-4 text-muted-foreground shrink-0 ml-2" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[340px] sm:w-[420px] p-2 text-xs shadow-lg rounded-xl"
            >
              <div className="p-1 mb-1">
                <Input
                  placeholder="Search outlets or districts..."
                  value={outletSearch}
                  onChange={(e) => onChangeOutletSearch(e.target.value)}
                  className="h-8 text-xs rounded-lg"
                />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuGroup className="max-h-56 overflow-y-auto space-y-1">
                {filteredOutlets.map((outlet) => (
                  <DropdownMenuItem
                    key={outlet.id}
                    onClick={() => onSelectOutlet(outlet)}
                    className="p-2.5 rounded-lg cursor-pointer flex flex-col items-start gap-0.5"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-foreground">{outlet.name}</span>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {outlet.depot}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {outlet.code} • {outlet.district}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <CalendarBlankIcon className="size-4 text-primary" />
          Delivery Schedule Date
        </label>
        <div className="relative">
          <CalendarBlankIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="date"
            value={selectedDate}
            min={minDeliveryDate}
            onChange={(e) => onChangeDate(e.target.value)}
            className="pl-9 h-11 text-xs rounded-xl bg-card border-border font-medium cursor-pointer shadow-2xs"
          />
        </div>
      </div>
    </div>
  );
}
