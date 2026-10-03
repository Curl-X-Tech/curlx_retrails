import { drainMutationQueue } from "@/sync/drain";
import type { QueuedMutation } from "@/api/sync/types";

export async function syncSingleMutation(_mutation?: QueuedMutation): Promise<void> {
  await drainMutationQueue();
}
