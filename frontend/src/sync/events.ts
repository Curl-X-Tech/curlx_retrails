export const SYNC_REQUEST_EVENT = "retrails:sync-request";

export type SyncRequestReason =
  "startup" | "online" | "enqueue" | "retry" | "token-refresh" | "manual";

export function requestSyncDrain(reason: SyncRequestReason): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SYNC_REQUEST_EVENT, {
      detail: { reason },
    })
  );
}
