import * as React from "react";
import type { CargoItem } from "@/types";
import type { CargoSortField, CargoSortOrder, StopGroup } from "./cargo-list-table";

export function useCargoListFilter(cargoList: CargoItem[]) {
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [sortField, setSortField] = React.useState<CargoSortField>(null);
  const [sortOrder, setSortOrder] = React.useState<CargoSortOrder>("asc");
  const [groupByStops, setGroupByStops] = React.useState<boolean>(true);

  const totalWeightKg = React.useMemo(() => {
    return cargoList.reduce((sum, item) => sum + item.weightKg, 0);
  }, [cargoList]);

  const handleSort = (field: CargoSortField) => {
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
    const list = cargoList.filter((item) => {
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
      if (sortField === "code") cmp = a.code.localeCompare(b.code);
      else if (sortField === "weight") cmp = a.weightKg - b.weightKg;
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [cargoList, searchQuery, sortField, sortOrder]);

  const stopGroups = React.useMemo(() => {
    const map = new Map<number, StopGroup>();

    filteredItems.forEach((item) => {
      const seq = item.stopSeq || 1;
      const name = item.stopName || item.destination;

      if (!map.has(seq)) {
        map.set(seq, { seq, name, items: [], totalWeight: 0 });
      }

      const group = map.get(seq)!;
      group.items.push(item);
      group.totalWeight += item.weightKg;
    });

    return Array.from(map.values()).sort((a, b) => a.seq - b.seq);
  }, [filteredItems]);

  return {
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
  };
}
