import type { AdminHubFilter, AdminBrandFilter } from "../store";
import {
  HubFilterDropdown,
  BrandFilterDropdown,
  DockFilterDropdown,
  ConstraintFilterDropdown,
} from "./outlet-filter-menus";

export interface OutletFilterControlsProps {
  selectedHub: AdminHubFilter;
  onHubChange: (hub: AdminHubFilter) => void;
  selectedBrand: AdminBrandFilter;
  onBrandChange: (brand: AdminBrandFilter) => void;
  dockFilter: string;
  onDockChange: (dock: string) => void;
  constraintFilter: string;
  onConstraintChange: (constraint: string) => void;
}

export function OutletFilterControls({
  selectedHub,
  onHubChange,
  selectedBrand,
  onBrandChange,
  dockFilter,
  onDockChange,
  constraintFilter,
  onConstraintChange,
}: OutletFilterControlsProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <HubFilterDropdown selectedHub={selectedHub} onHubChange={onHubChange} />
      <BrandFilterDropdown selectedBrand={selectedBrand} onBrandChange={onBrandChange} />
      <DockFilterDropdown dockFilter={dockFilter} onDockChange={onDockChange} />
      <ConstraintFilterDropdown
        constraintFilter={constraintFilter}
        onConstraintChange={onConstraintChange}
      />
    </div>
  );
}
