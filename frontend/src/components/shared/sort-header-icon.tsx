import { CaretUpDownIcon, CaretUpIcon, CaretDownIcon } from "@phosphor-icons/react";

interface SortHeaderIconProps {
  active: boolean;
  direction?: "asc" | "desc";
}

export function SortHeaderIcon({ active, direction = "asc" }: SortHeaderIconProps) {
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
