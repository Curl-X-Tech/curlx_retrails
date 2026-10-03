# Refactor Plan

## 1. Target Folder Structure
- `src/features/<name>/components/`: Feature-specific subcomponents under 150 lines.
- `src/features/<name>/hooks/`: Feature query, mutation, and interaction hooks.
- `src/features/<name>/repo.ts`: Feature Dexie IndexedDB access layer.
- `src/features/<name>/store.ts`: Feature Zustand UI-only state with selectors.
- `src/features/<name>/types.ts`: Feature-specific interfaces and view models.
- `src/components/shared/`: Shared reusable UI components wrapping design system tokens.
- `src/components/layout/`: Slim shell layouts for each user role.
- `src/pages/<role>/`: Thin route orchestrator pages under 150 lines.
- `src/lib/`: Unified API client, Dexie schema, and sync utilities.

## 2. Large Files Breakdown
- `src/pages/dispatcher/deferrals-page.tsx` -> `features/dispatcher/components/deferrals-*.tsx`, `features/dispatcher/hooks/use-deferrals.ts`, thin page.
- `src/pages/dispatcher/order-queue-page.tsx` -> `features/dispatcher/components/queue-*.tsx`, `features/dispatcher/hooks/use-order-queue.ts`, thin page.
- `src/pages/dispatcher/allocation-summary-page.tsx` -> `features/dispatcher/components/allocation-*.tsx`, `features/dispatcher/hooks/use-allocations.ts`, thin page.
- `src/pages/store/store-create-order-page.tsx` -> `features/store/components/order-form-*.tsx`, `features/store/hooks/use-order-builder.ts`, thin page.
- `src/pages/store/store-orders-page.tsx` -> `features/store/components/order-list-*.tsx`, `features/store/hooks/use-store-orders.ts`, thin page.
- `src/pages/admin/admin-users-page.tsx` -> `features/admin/components/user-*.tsx`, `features/admin/hooks/use-admin-users.ts`, thin page.
- `src/pages/admin/admin-outlets-page.tsx` -> `features/admin/components/outlet-*.tsx`, `features/admin/hooks/use-admin-outlets.ts`, thin page.
- `src/pages/admin/admin-items-page.tsx` -> `features/admin/components/item-*.tsx`, `features/admin/hooks/use-admin-items.ts`, thin page.
- `src/pages/admin/admin-calendar-page.tsx` -> `features/admin/components/calendar-*.tsx`, `features/admin/hooks/use-admin-calendar.ts`, thin page.
- `src/pages/loader/loader-manifests-page.tsx` -> `features/loader/components/manifest-*.tsx`, `features/loader/hooks/use-loader-manifests.ts`, thin page.
- `src/pages/loader/loader-bays-page.tsx` -> `features/loader/components/bay-*.tsx`, `features/loader/hooks/use-loader-bays.ts`, thin page.
- `src/pages/driver/driver-unloading-page.tsx` -> `features/driver/components/unloading-*.tsx`, `features/driver/hooks/use-driver-unloading.ts`, thin page.
- `src/components/layout/sidebar.tsx` -> `components/layout/sidebar-{nav,user,header}.tsx`, `components/layout/sidebar-constants.ts`, slim sidebar component.

## 3. Shared Components
- `AdminCrudShell` | `title, search, filters, actions, children` | Admin feature pages.
- `DataTable` | `columns, data, isLoading, onRowClick, pagination` | Admin, dispatcher, and store management pages.
- `FilterBar` | `search, placeholder, filters, onReset, activeCount` | Admin, dispatcher, and store filter controls.
- `FormDialog` | `title, isOpen, onClose, onSubmit, isSubmitting, children` | Admin and store create/edit modals.
- `PageHeader` | `title, description, badge, actions, children` | Top-level role dashboard and planning views.
- `ConfirmDialog` | `isOpen, title, description, confirmLabel, onConfirm, onCancel` | Delete and state change confirmations.
- `HoldToConfirmButton` | `label, onConfirmed, durationMs, variant, disabled` | Loader bay verification and driver delivery confirm.

## 4. Shared Hooks and Utilities
- `apiRequest<T>` | Unified HTTP request helper handling tokens, headers, and error parsing.
- `useDebounce<T>` | Debounces search query input values across all filter bars.
- `usePagination` | Computes current page, offset, limit, and page navigation actions.
- `useTableFilter` | Generic client-side filtering, searching, and sorting management.

## 5. State Ownership
- Server entity data (users, outlets, items, orders, trips) | TanStack Query.
- Active UI selections, filter states, and dialog open flags | Zustand store with selectors.
- Driver offline trips, bay loading checklist, local delivery signatures | Dexie IndexedDB repository.
- Background mutation queue and pending sync items | Dexie sync repository.

## 6. Dexie, Sync, and PWA File Locations
- `src/lib/dexie-db.ts`: Canonical Dexie database instance, tables, and schema migrations.
- `src/features/<feature>/repo.ts`: Feature-specific offline data repositories wrapping Dexie queries.
- `src/lib/sync-engine.ts`: Background synchronization queue manager syncing local mutations with backend.
- `src/lib/pwa.ts`: Progressive Web App service worker registration and update listeners.

## 7. Dead Code to Delete
- Dependency `lucide-react`: Zero references in codebase; replaced by Phosphor icons.
- Dependency `maplibre-gl`: Zero references in codebase; map rendering uses Leaflet.
- `src/lib/api.ts`: `setStoredToken`, `updateCurrentUser`, and `getUserById` unused exports.
- `src/hooks/use-master-data.ts`: Unused mutation hooks for outlets, items, prices, and depots.
- `src/hooks/use-users-data.ts`: Unused `useSystemGuardsCheck` function export.
- `src/lib/map-tile-prefetch.ts`: Unused `latLngToTile` helper function.
- `src/lib/simulated-delay.ts`: Unused `getSimulatedDelayMs` and `lazyWithDelay` exports.
- `src/data/mock-store-orders.ts`: Unused `INITIAL_STORE_ORDERS` and `getStoreOrderById` exports.
- `src/data/mock-allocation-details.ts`: Unused `mockAllocationManifests` export.

## 8. Refactor Phases
- [x] Phase 1: Remove unused dependencies and dead function exports.
- [x] Phase 2: Create shared UI components, shared hooks, and unified API client.
- [x] Phase 3: Modularize sidebar and application layout components.
- [x] Phase 4: Refactor Auth feature into feature directory.
- [x] Phase 5: Refactor Admin feature pages and modular subcomponents.
- [x] Phase 6: Refactor Store feature order creation and history pages.
- [x] Phase 7: Refactor Loader feature manifests and bay staging workflows.
- [x] Phase 8: Refactor Driver feature active trip and unloading workflows with Dexie repo.
- [x] Phase 9: Refactor Dispatcher feature order queue, deferrals, and allocation views.
- [x] Phase 10: Run full validation suite and synchronize knowledge graph.
