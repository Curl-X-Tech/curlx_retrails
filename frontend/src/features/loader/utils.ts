import type { SpecialHandlingCode } from "./types";

export function getHandlingLabel(code?: SpecialHandlingCode | null): string | null {
  switch (code) {
    case "COL":
      return "Cold Chain";
    case "FRG":
      return "Fragile Cargo";
    case "MAL":
      return "Mall Bay";
    case "HAZ":
      return "Hazardous";
    default:
      return null;
  }
}
