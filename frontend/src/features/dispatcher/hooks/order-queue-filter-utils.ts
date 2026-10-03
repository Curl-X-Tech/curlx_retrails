import type { QueuedOrder, QueueSortKey } from "../types";

export function filterQueuedOrders(
  orders: QueuedOrder[],
  searchQuery: string,
  brandFilter: string,
  tempFilter: string,
  statusFilter: string,
  dockFilter: string
): QueuedOrder[] {
  const q = searchQuery.trim().toLowerCase();
  return orders.filter((ord) => {
    const matchesSearch =
      !q ||
      ord.orderRef.toLowerCase().includes(q) ||
      ord.outletName.toLowerCase().includes(q) ||
      ord.outletId.toLowerCase().includes(q) ||
      ord.items.some(
        (i) =>
          i.itemName.toLowerCase().includes(q) || i.packageCode.toLowerCase().includes(q)
      );
    const matchesBrand = brandFilter === "all" || ord.brand === brandFilter;
    const matchesTemp = tempFilter === "all" || ord.tempRequirement === tempFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "urgent" ? ord.isUrgent : ord.deferredYesterday === 1);
    const matchesDock = dockFilter === "all" || ord.dockType === dockFilter;
    return matchesSearch && matchesBrand && matchesTemp && matchesStatus && matchesDock;
  });
}

export function sortQueuedOrders(
  orders: QueuedOrder[],
  sortKey: QueueSortKey | null,
  sortDirection: "asc" | "desc"
): QueuedOrder[] {
  if (!sortKey) return orders;
  return [...orders].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "orderRef") cmp = a.orderRef.localeCompare(b.orderRef);
    else if (sortKey === "outlet") cmp = a.outletName.localeCompare(b.outletName);
    else if (sortKey === "weight") cmp = a.totalWeightKg - b.totalWeightKg;
    else if (sortKey === "volume") cmp = a.totalVolumeM3 - b.totalVolumeM3;
    else if (sortKey === "value") cmp = a.totalOrderValueLkr - b.totalOrderValueLkr;
    else if (sortKey === "window") cmp = a.deliveryWindow.localeCompare(b.deliveryWindow);
    return sortDirection === "asc" ? cmp : -cmp;
  });
}
