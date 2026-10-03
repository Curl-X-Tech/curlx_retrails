export function getReasonLabel(reason: string) {
  switch (reason) {
    case "insufficient_reefer_capacity":
      return "Reefer Capacity Saturated";
    case "van_access_shortage":
      return "Van Access Shortage";
    case "time_budget_limit":
      return "Time Budget Exceeded";
    case "fuel_quota_exceeded":
      return "Fleet Downtime / Maintenance";
    default:
      return reason.replace(/_/g, " ");
  }
}
