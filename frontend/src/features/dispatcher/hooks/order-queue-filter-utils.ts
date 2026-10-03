import type { OrderQueueKPIs, QueuedOrder, StoreOrderGroup } from "@/types";
import type { QueueSortKey } from "../types";

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

export function getStoreGroupedOrders(orders: QueuedOrder[]): StoreOrderGroup[] {
  const map = new Map<string, StoreOrderGroup>();

  for (const ord of orders) {
    if (!map.has(ord.outletId)) {
      map.set(ord.outletId, {
        outletId: ord.outletId,
        outletName: ord.outletName,
        outletAddress: ord.outletAddress,
        brand: ord.brand,
        district: ord.district,
        dockType: ord.dockType,
        parkingConstraint: ord.parkingConstraint,
        deliveryWindow: ord.deliveryWindow,
        contactPhone: "+94 11 234 5678",
        orders: [],
        totalOrders: 0,
        totalPackages: 0,
        totalWeightKg: 0,
        totalVolumeM3: 0,
        totalValueLkr: 0,
        hasUrgent: false,
        hasDeferred: false,
        maxDaysSinceLastServed: 0,
      });
    }

    const group = map.get(ord.outletId)!;
    group.orders.push(ord);
    group.totalOrders += 1;
    group.totalPackages += ord.items.length;
    group.totalWeightKg += ord.totalWeightKg;
    group.totalVolumeM3 += ord.totalVolumeM3;
    group.totalValueLkr += ord.totalOrderValueLkr;
    if (ord.isUrgent) group.hasUrgent = true;
    if (ord.deferredYesterday === 1) group.hasDeferred = true;
    if (ord.daysSinceLastServed > group.maxDaysSinceLastServed) {
      group.maxDaysSinceLastServed = ord.daysSinceLastServed;
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.hasDeferred && !b.hasDeferred) return -1;
    if (!a.hasDeferred && b.hasDeferred) return 1;
    if (a.hasUrgent && !b.hasUrgent) return -1;
    if (!a.hasUrgent && b.hasUrgent) return 1;
    return a.outletName.localeCompare(b.outletName);
  });
}

export function computeOrderQueueKPIs(orders: QueuedOrder[]): OrderQueueKPIs {
  const uniqueStores = new Set(orders.map((o) => o.outletId));
  const urgentOrders = orders.filter((o) => o.isUrgent).length;
  const deferredYesterdayOrders = orders.filter((o) => o.deferredYesterday === 1).length;
  const totalWeightKg = orders.reduce((sum, o) => sum + o.totalWeightKg, 0);
  const totalVolumeCbm = orders.reduce((sum, o) => sum + o.totalVolumeM3, 0);
  const totalValueLkr = orders.reduce((sum, o) => sum + o.totalOrderValueLkr, 0);
  const chilledOrdersCount = orders.filter((o) => o.tempRequirement === "chilled").length;
  const ambientOrdersCount = orders.filter((o) => o.tempRequirement === "ambient").length;

  return {
    totalOrders: orders.length,
    totalStores: uniqueStores.size,
    urgentOrders,
    deferredYesterdayOrders,
    totalWeightKg: Math.round(totalWeightKg * 10) / 10,
    totalVolumeCbm: Math.round(totalVolumeCbm * 10) / 10,
    totalValueLkr: Math.round(totalValueLkr),
    chilledOrdersCount,
    ambientOrdersCount,
  };
}
