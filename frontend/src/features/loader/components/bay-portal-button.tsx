import { createPortal } from "react-dom";
import {
  MagnifyingGlassIcon,
  CaretRightIcon,
  DotsThreeVerticalIcon,
} from "@phosphor-icons/react";

interface BayPortalButtonProps {
  baysCount: number;
  onOpenDrawer: () => void;
}

export function BayPortalButton({ baysCount, onOpenDrawer }: BayPortalButtonProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <button
      onClick={onOpenDrawer}
      className="fixed left-16 z-50 hidden md:flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 rounded-r-2xl bg-card border border-l-0 border-border text-foreground shadow-2xl hover:bg-accent hover:shadow-primary/10 transition-colors active:scale-95 group cursor-pointer select-none"
      style={{
        top: "50%",
        transform: "translateY(-50%)",
      }}
      title="Search & Switch Docked Vehicles / Drivers"
      aria-label="Search & Switch Docked Vehicles"
    >
      <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <MagnifyingGlassIcon className="size-4" weight="bold" />
      </div>
      <DotsThreeVerticalIcon className="size-3 text-muted-foreground/60" />
      <CaretRightIcon
        className="size-3.5 text-primary transition-transform group-hover:translate-x-0.5"
        weight="bold"
      />
      <span className="text-[10px] font-bold text-muted-foreground [writing-mode:vertical-lr] tracking-widest uppercase">
        {baysCount} Bays
      </span>
    </button>,
    document.body
  );
}
