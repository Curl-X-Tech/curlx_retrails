import { FunnelIcon, SnowflakeIcon } from "@phosphor-icons/react";
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
import type { AdminBrandFilter } from "../store";

export interface ItemFilterControlsProps {
  selectedBrand: AdminBrandFilter;
  onBrandChange: (brand: AdminBrandFilter) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  coldChainFilter: string;
  onColdChainChange: (filter: string) => void;
}

export function ItemFilterControls({
  selectedBrand,
  onBrandChange,
  selectedCategory,
  onCategoryChange,
  categories,
  coldChainFilter,
  onColdChainChange,
}: ItemFilterControlsProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
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
          <span>Brand: {selectedBrand === "ALL" ? "All Brands" : selectedBrand}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel className="text-xs">Filter Brand</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={selectedBrand}
            onValueChange={(val) => onBrandChange((val as AdminBrandFilter) || "ALL")}
          >
            <DropdownMenuRadioItem value="ALL" className="text-xs">
              All Brands
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="FRESH" className="text-xs">
              Fresh
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="STYLE" className="text-xs">
              Style
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="TECH" className="text-xs">
              Tech
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

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
          <span className="capitalize">
            Category: {selectedCategory === "all" ? "All" : selectedCategory}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel className="text-xs">Filter Category</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={selectedCategory}
            onValueChange={onCategoryChange}
          >
            <DropdownMenuRadioItem value="all" className="text-xs">
              All Categories
            </DropdownMenuRadioItem>
            {categories.map((cat) => (
              <DropdownMenuRadioItem key={cat} value={cat} className="text-xs">
                {cat}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

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
          <SnowflakeIcon className="size-3 text-muted-foreground" />
          <span className="capitalize">
            Temp:{" "}
            {coldChainFilter === "all"
              ? "All"
              : coldChainFilter === "cold"
                ? "Cold Chain"
                : "Ambient"}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel className="text-xs">Filter Temp</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={coldChainFilter}
            onValueChange={onColdChainChange}
          >
            <DropdownMenuRadioItem value="all" className="text-xs">
              All Items
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="cold" className="text-xs">
              Cold Chain
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="ambient" className="text-xs">
              Ambient
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
