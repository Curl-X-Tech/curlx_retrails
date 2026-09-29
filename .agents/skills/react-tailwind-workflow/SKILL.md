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
