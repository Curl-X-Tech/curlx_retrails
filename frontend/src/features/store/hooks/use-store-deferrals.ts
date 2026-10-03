import { mockCarryoverOrders, mockDeferralAuditLogs } from "@/data/mock-deferrals";

export function useStoreDeferrals(searchQuery: string = "") {
  const q = searchQuery.toLowerCase().trim();

  const filteredCarryovers = mockCarryoverOrders.filter(
    (order) =>
      !q ||
      order.orderRef.toLowerCase().includes(q) ||
      order.outletName.toLowerCase().includes(q) ||
      order.deferralReason.toLowerCase().includes(q)
  );

  const filteredLogs = mockDeferralAuditLogs.filter(
    (log) =>
      !q ||
      log.orderRef.toLowerCase().includes(q) ||
      log.outletName.toLowerCase().includes(q) ||
      log.deferralReason.toLowerCase().includes(q)
  );

  return {
    carryoverOrders: filteredCarryovers,
    auditLogs: filteredLogs,
    totalCarryovers: mockCarryoverOrders.length,
  };
}
