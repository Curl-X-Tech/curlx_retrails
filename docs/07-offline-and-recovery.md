# Offline Operation and Recovery

**Project**: ReTrails — Team CurlX

---

## 1. Overview

The Driver operates on mobile field routes where connectivity may be intermittent or unavailable (particularly on the Kandy corridor and hill-country routes to Nuwara Eliya and Badulla). ReTrails implements an offline-first architecture using Dexie.js (IndexedDB) as the local data store and a queued mutation engine to synchronize field actions back to the FastAPI backend when connectivity returns.

---

## 2. Offline Detection

### How connectivity state is tracked

On application startup (`main.tsx`), the sync engine is started via `startSync()` from `src/sync/engine.ts`.

The engine registers two browser event listeners:

```typescript
window.addEventListener("online", handleOnline);
window.addEventListener("offline", handleOffline);
```

`handleOnline()` sets `useSyncStatus.setOnline(true)` and immediately triggers a drain.
`handleOffline()` sets `useSyncStatus.setOnline(false)` and clears the pending drain timer.

The `navigator.onLine` value is used as the initial state on startup.

The `useSyncStatus` Zustand store (`src/sync/use-sync-status.ts`) exposes:
- `online` (boolean)
- `draining` (boolean)
- `queueCount` (number of pending mutations)
- `blockedCount` (number of failed mutations past retry limit)
- `lastSyncAt` (ISO timestamp of last successful sync)
- `lastError` (last sync error message)

The UI displays a sync status indicator that reflects these values.

---

## 3. What the Driver Can Still Do Offline

When connectivity is unavailable, the Driver can:

| Action | Offline behavior |
|---|---|
| View assigned trips | Served from Dexie local cache (pre-fetched when online) |
| View stop sequence and waypoint details | Served from Dexie local cache |
| View outlet contact details and delivery window | Served from Dexie local cache |
| View order items per stop | Served from Dexie local cache |
| Record arrival at a waypoint | Written to Dexie sync_queue with entity_type=route_leg |
| Submit proof of delivery (recipient name, signature, photo) | Written to Dexie sync_queue with entity_type=proof_of_delivery |
| Log a discrepancy (damaged, shortage) | Written to Dexie sync_queue with entity_type=proof_of_delivery (within discrepancies array) |
| Record GPS telemetry | Written to Dexie sync_queue with entity_type=telemetry |

**What the Driver cannot do offline:**
- Log in (authentication requires the backend)
- View real-time fleet updates from other trips
- See order allocations for future dates before they are downloaded

---

## 4. Local Data Storage

Dexie.js creates an IndexedDB database named `retrails-db` in the browser. The schema is defined in `frontend/src/db/` or accessible via the Dexie configuration.

The `sync_queue` Dexie table stores pending mutations with the following fields:

| Field | Description |
|---|---|
| `idempotency_key` | UUID generated on client at mutation time; prevents duplicate application on server |
| `entity_type` | `order`, `route_leg`, `proof_of_delivery`, `telemetry` |
| `action` | `create`, `update` |
| `payload` | JSON object of the mutation data |
| `client_timestamp` | ISO timestamp when the mutation was created offline |
| `user_id` | Authenticated user ID at time of mutation |
| `status` | `queued`, `sent`, `applied`, `failed` |
| `attempts` | Retry counter |
| `last_error` | Error message if failed |

Trip and waypoint data downloaded when online is stored in separate Dexie tables (exact table names depend on the Dexie schema in `frontend/src/db/`).

---

## 5. Synchronization on Reconnect

When the browser fires the `online` event, the sync engine calls `scheduleDrain(0)` immediately.

`drainMutationQueue()` in `src/sync/drain.ts` executes the following loop:

```
1. peekBatch(20) from Dexie sync_queue (status = queued or sent after retry)
2. If batch is empty: set lastSyncAt, clear error, return
3. markSent(keys) — update Dexie status to 'sent' so in-flight items are skipped
4. POST /api/v1/sync/batch with { client_device_id, mutations: batch }
5. For each result in response:
   - status 'applied' or 'duplicate_ignored' or 'conflict_resolved': markApplied(key)
   - other status: markFailed(key, attempts, error)
6. For failed items where shouldRetry(attempts): scheduleRetry(backoffDelay)
7. Loop back to step 1 (process next batch)
```

The 60-second periodic poll (`setInterval`) also triggers a drain if mutations are pending and the engine is online.

### Device ID

Each browser session is assigned a persistent device ID stored in `localStorage` (`retrails_device_id`). This is sent as `client_device_id` in the sync batch request for server-side audit logging.

---

## 6. Server-Side Sync Processing

`POST /api/v1/sync/batch` in `sync.py` iterates each `QueuedMutation` and dispatches to the matching handler:

| Mutation type | Handler | Idempotency check |
|---|---|---|
| `entity_type=order, action=create` | `create_order()` | `customer_order.idempotency_key` unique constraint |
| `entity_type=telemetry, action=create` | `_apply_telemetry()` | `vehicle_telemetry.idempotency_key` lookup |
| `entity_type=route_leg` | `arrive()` | 409 Conflict if leg is already completed or skipped |
| `entity_type=proof_of_delivery` | `submit_pod()` | 409 Conflict if waypoint is already completed |

HTTP 409 Conflict responses from the endpoint handlers are treated as `duplicate_ignored` — the mutation is considered applied and removed from the client queue.

---

## 7. Retry and Backoff

`src/sync/backoff.ts`:

- Failed mutations are retried with exponential backoff.
- `calculateBackoffDelay(attempts)` increases the delay per attempt.
- `shouldRetry(attempts)` returns `false` beyond the maximum retry count, at which point the mutation is permanently marked `failed` and the user is shown a sync error indicator.

---

## 8. Recovery

When mutations successfully drain:
- The driver's local Dexie records are updated to `status=applied`.
- `useSyncStatus.lastSyncAt` is updated.
- `useSyncStatus.lastError` is cleared.
- Server-side, route legs and orders reflect the submitted field actions.

---

## 9. Conflict Resolution

**Conflict resolution: NOT IMPLEMENTED.**

The sync endpoint does not implement server-wins or client-wins merge logic. Instead, it relies on idempotency: if a mutation's idempotency key is already recorded (via duplicate detection), it is silently acknowledged as `duplicate_ignored`. If the server returns a non-recoverable error (non-409), the mutation is retried up to the retry limit and then marked permanently failed. No field values are merged between concurrent offline modifications.

In practice, conflict scenarios are mitigated by the fact that Driver actions (arrive, POD, discrepancy) target specific `route_leg_id` values that belong exclusively to one driver's trip, so concurrent writes to the same record from multiple clients are not expected in normal operation.

---

## 10. PWA Installation and Offline Launch

The frontend is configured as a Progressive Web App via `vite-plugin-pwa`. The service worker caches the application shell (HTML, JS, CSS) so that the Driver can open the ReTrails PWA and access the interface even without connectivity. API data access (trips, routes) requires prior download while online.

When installed as a PWA on an Android or iOS device, the app launches in standalone mode without the browser chrome, providing a native-like experience for field drivers.
