import {
  ArrowsClockwiseIcon,
  CheckCircleIcon,
  CloudSlashIcon,
  ClockIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useLiveQuery } from "dexie-react-hooks";
import type { QueuedMutation } from "@/api/sync/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { db } from "@/lib/dexie-db";
import { retryMutation } from "@/sync/queue";
import { useSyncStatus } from "@/sync/use-sync-status";

const QUEUE_STATUSES: Array<QueuedMutation["status"]> = ["queued", "sending", "failed"];

function getStatusLabel({
  online,
  draining,
  queueCount,
  blockedCount,
}: {
  online: boolean;
  draining: boolean;
  queueCount: number;
  blockedCount: number;
}): string {
  if (!online) return "Offline";
  if (draining) return "Syncing";
  if (blockedCount > 0) return `${blockedCount} blocked`;
  if (queueCount > 0) return `${queueCount} queued`;
  return "All synced";
}

function getStatusIcon({
  online,
  draining,
  queueCount,
  blockedCount,
}: {
  online: boolean;
  draining: boolean;
  queueCount: number;
  blockedCount: number;
}) {
  if (!online) return CloudSlashIcon;
  if (draining) return ArrowsClockwiseIcon;
  if (blockedCount > 0) return WarningCircleIcon;
  if (queueCount > 0) return ClockIcon;
  return CheckCircleIcon;
}

export function SyncStatusIndicator() {
  const online = useSyncStatus((state) => state.online);
  const draining = useSyncStatus((state) => state.draining);
  const queueCount = useSyncStatus((state) => state.queueCount);
  const blockedCount = useSyncStatus((state) => state.blockedCount);
  const lastSyncAt = useSyncStatus((state) => state.lastSyncAt);
  const lastError = useSyncStatus((state) => state.lastError);

  const mutations = useLiveQuery(
    () => db.mutationQueue.where("status").anyOf(QUEUE_STATUSES).sortBy("created_seq"),
    []
  );

  const statusLabel = getStatusLabel({ online, draining, queueCount, blockedCount });
  const StatusIcon = getStatusIcon({ online, draining, queueCount, blockedCount });

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-xl gap-2 px-3 text-xs font-semibold shadow-xs"
          >
            <StatusIcon className={draining ? "size-3.5 animate-spin" : "size-3.5"} />
            <span>{statusLabel}</span>
          </Button>
        }
      />

      <DialogContent className="max-w-2xl">
        <DialogHeader className="text-left">
          <DialogTitle>Sync Status</DialogTitle>
          <DialogDescription>
            Offline queue state and retry controls for blocked mutations.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
            <div className="text-muted-foreground">Connection</div>
            <div className="mt-1 font-semibold text-foreground">
              {online ? "Online" : "Offline"}
            </div>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
            <div className="text-muted-foreground">Queue</div>
            <div className="mt-1 font-semibold text-foreground">{queueCount} queued</div>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
            <div className="text-muted-foreground">Blocked</div>
            <div className="mt-1 font-semibold text-foreground">
              {blockedCount} blocked
            </div>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
            <div className="text-muted-foreground">Last sync</div>
            <div className="mt-1 font-semibold text-foreground">
              {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : "Not synced yet"}
            </div>
          </div>
        </div>

        {lastError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {lastError}
          </div>
        )}

        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {mutations && mutations.length > 0 ? (
            mutations.map((mutation) => (
              <div
                key={mutation.idempotency_key}
                className="flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-background px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <span>{mutation.entity_type}</span>
                    <span className="text-muted-foreground">·</span>
                    <span>{mutation.action}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="uppercase tracking-wide text-muted-foreground">
                      {mutation.status}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground break-all">
                    {mutation.last_error || mutation.idempotency_key}
                  </div>
                </div>
                {mutation.status === "failed" ? (
                  <Button
                    size="xs"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => {
                      void retryMutation(mutation.idempotency_key);
                    }}
                  >
                    Retry
                  </Button>
                ) : (
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {mutation.status}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground">
              No queued mutations.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
