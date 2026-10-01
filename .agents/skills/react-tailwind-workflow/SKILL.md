---
name: react-tailwind-workflow
description: Standards and guidelines for React + TypeScript + Tailwind CSS + Dexie PWA frontend development in Curl X
---

# React + Tailwind CSS + Dexie PWA Workflow

## 1. Directory Structure (`frontend/src/`)
- `components/`: Clean, reusable UI components (Button, Input, Card, Modal, Table, Toast, Badge, Layout).
- `contexts/`: React context providers (AuthContext, ThemeContext, SyncContext, NetworkContext).
- `data/`: Mock datasets, seed arrays, sample geo-coordinates, and static lookup tables.
- `db/`: Dexie.js database definition, tables, schemas, and live hooks.
- `hooks/`: Custom hooks for network status, offline queries, syncing, and theme.
- `pages/`: Page-level components (Dashboard, Items, Admin, Settings, Auth).
- `services/`: API client with Axios/Fetch, token refresh, and sync worker.
- `types/`: Shared TypeScript models and interfaces.

## 2. Dexie.js Offline-First Rules
1. Every entity has a local Dexie table with indexed fields (`id`, `updated_at`, `sync_status`).
2. Mutations update Dexie first (optimistic UI), and record an entry into `sync_queue` table with:
   - `id`: Auto-incrementing integer / UUID
   - `action`: `'CREATE' | 'UPDATE' | 'DELETE'`
   - `entity`: `'item' | 'user' | 'setting'`
   - `payload`: Object data
   - `created_at`: Timestamp
3. Live reactive rendering uses `useLiveQuery(() => db.items.toArray())`.
4. When `navigator.onLine` fires true, the sync engine drains `sync_queue` in FIFO order.

## 3. Styling Principles
- Use Tailwind CSS with curated slate/indigo/cyan color tokens.
- Support both Light and Dark mode with `dark:` class variants.
- Ensure high accessibility, responsive design (mobile-first), and smooth micro-interactions.
- Add PWA install banners, offline indicators, and sync badges.

## 4. 4-Tier Enterprise Responsive Grid System
Always use the standardized grid tokens and utility classes from `src/index.css`:
- **Wide Command Center ($\ge 1440\text{px}$)**: 12–16 Columns, Gutter: $36\text{px}$, Margins: $64\text{px}$ (or $0\text{px}$ flush)
- **Desktop Planning ($1024\text{px} - 1439\text{px}$)**: 12 Columns, Gutter: $36\text{px}$, Margins: $48\text{px}$ (or $0\text{px}$ flush)
- **Tablet Bay Station ($600\text{px} - 1023\text{px}$)**: 8 Columns, Gutter: $24\text{px}$, Margins: $24\text{px}$ (or $0\text{px}$ flush)
- **Mobile Field Driver/Store ($320\text{px} - 599\text{px}$)**: 4 Columns, Gutter: $16\text{px}$, Margins: $16\text{px}$ (or $0\text{px}$ flush)

### Standard Utility Classes:
- `.page-container-compact`: Single-column mobile container ($< 600\text{px}$) for drivers and store managers.
- `.page-container-tablet`: Tablet container for warehouse bay loading stations ($600\text{px} - 1023\text{px}$).
- `.page-container-desktop`: Dispatcher workspace container (max $1440\text{px}$).
- `.page-container-fluid`: Full-bleed container for live map command walls.
- `.page-grid-padded`: Responsive 4 $\rightarrow$ 8 $\rightarrow$ 12 column grid with standardized gutters and padding.
- `.page-grid-flush`: Responsive grid with zero horizontal padding (ideal for nested card groups).
- `.split-workspace-grid`: Dual-pane layout (stacked on mobile/tablet portrait $\rightarrow$ 5:7 split on tablet landscape & desktop).
- `.command-center-grid`: 3-pane layout (3:6:3 split for live fleet tracking).
- `.gutter-responsive`: Responsive gutter ($16\text{px} \rightarrow 24\text{px} \rightarrow 36\text{px}$).
- `.margin-responsive`: Responsive horizontal padding ($16\text{px} \rightarrow 24\text{px} \rightarrow 48\text{px}$).


