# API Status

Live: 32 | Pending: 43 | Total: 75

| domain | method | path | roles | offline | status | ui consumer |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| auth | POST | /auth/jwt/login | public | no | live | yes |
| auth | POST | /auth/jwt/logout | public | no | live | yes |
| auth | POST | /auth/forgot-password | public | no | live | yes |
| auth | POST | /auth/reset-password | public | no | live | yes |
| auth | POST | /auth/refresh | public | no | pending | no |
| users | GET | /users/me | public | no | live | yes |
| users | PATCH | /users/me | public | no | live | yes |
| users | GET | /users | system_admin | no | live | yes |
| users | POST | /users | system_admin | no | live | yes |
| users | GET | /users/{id} | system_admin | no | live | yes |
| users | PATCH | /users/{id} | system_admin | no | live | yes |
| users | DELETE | /users/{id} | system_admin | no | live | yes |
| guards | GET | /guards/admin-only | system_admin | no | live | no |
| guards | GET | /guards/store-manager | store_manager | no | live | no |
| guards | GET | /guards/driver | driver | no | live | no |
| master | GET | /master/depots | public | no | live | yes |
| master | GET | /master/depots/{id} | public | no | live | yes |
| master | PUT | /master/depots/{id} | system_admin | no | pending | yes |
| master | GET | /master/districts | public | no | live | yes |
| master | GET | /master/brands | public | no | live | yes |
| master | GET | /master/outlets | public | no | live | yes |
| master | GET | /master/outlets/{id} | public | no | live | yes |
| master | POST | /master/outlets | system_admin | no | pending | yes |
| master | PUT | /master/outlets/{id} | system_admin | no | pending | yes |
| master | DELETE | /master/outlets/{id} | system_admin | no | pending | yes |
| master | GET | /master/items | public | no | live | yes |
| master | GET | /master/items/{id} | public | no | live | yes |
| master | POST | /master/items | system_admin | no | pending | yes |
| master | PUT | /master/items/{id} | system_admin | no | pending | yes |
| master | DELETE | /master/items/{id} | system_admin | no | pending | yes |
| master | GET | /master/prices | public | no | live | yes |
| master | GET | /master/prices/active | public | no | live | yes |
| master | GET | /master/prices/item/{item_id} | public | no | live | yes |
| master | POST | /master/prices | system_admin | no | live | yes |
| master | PUT | /master/prices/{id} | system_admin | no | pending | yes |
| master | GET | /master/calendar/operating-days | public | no | live | yes |
| master | GET | /master/calendar/surge | public | no | live | yes |
| master | GET | /master/calendar/range | public | no | live | yes |
| master | POST | /master/calendar/bulk-generate | system_admin | no | live | yes |
| master | PUT | /master/calendar/{date} | system_admin | no | pending | yes |
| fleet | GET | /fleet/vehicles | public | no | pending | yes |
| fleet | GET | /fleet/vehicles/{id} | public | no | pending | yes |
| fleet | POST | /fleet/vehicles | system_admin | no | pending | yes |
| fleet | PATCH | /fleet/vehicles/{id} | dispatcher, system_admin | no | pending | yes |
| fleet | GET | /fleet/drivers | public | no | pending | yes |
| telemetry | POST | /fleet/telemetry/report | driver | yes | pending | yes |
| telemetry | GET | /fleet/telemetry/live | dispatcher, system_admin | no | pending | yes |
| telemetry | GET | /fleet/vehicles/{id}/telemetry/latest | public | no | pending | yes |
| orders | POST | /orders | store_manager, system_admin | yes | pending | yes |
| orders | GET | /orders | public | no | pending | yes |
| orders | GET | /orders/{id} | public | no | pending | yes |
| orders | PATCH | /orders/{id}/status | dispatcher, system_admin | no | pending | yes |
| deferrals | POST | /orders/{id}/defer | dispatcher, system_admin | no | pending | yes |
| deferrals | GET | /deferrals | dispatcher, system_admin | no | pending | yes |
| deferrals | POST | /deferrals/{id}/re-queue | dispatcher, system_admin | no | pending | yes |
| deferrals | GET | /deferrals/summary | dispatcher, system_admin | no | pending | yes |
| allocations | GET | /allocations | dispatcher, system_admin | no | pending | yes |
| allocations | GET | /allocations/{id} | public | no | pending | yes |
| allocations | POST | /allocations/{id}/confirm | dispatcher, system_admin | no | pending | yes |
| allocations | GET | /allocations/summary | dispatcher, system_admin | no | pending | yes |
| allocations | POST | /allocations/optimize | dispatcher, system_admin | no | pending | yes |
| allocations | GET | /allocations/engine/status | dispatcher, system_admin | no | pending | yes |
| allocations | POST | /allocations/engine/schedule | system_admin | no | pending | yes |
| loader | GET | /loader/bays | loader, dispatcher, system_admin | no | pending | yes |
| loader | GET | /loader/trips/{trip_id}/checklist | loader, system_admin | yes | pending | yes |
| loader | POST | /loader/items/{item_id}/verify | loader | yes | pending | yes |
| loader | POST | /loader/trips/{trip_id}/waypoints/{seq}/seal | loader | yes | pending | yes |
| loader | POST | /loader/trips/{trip_id}/confirm-departure | loader | yes | pending | yes |
| driver | GET | /driver/routes/current | driver | yes | pending | yes |
| deliveries | POST | /deliveries/{waypoint_id}/arrive | driver | yes | pending | yes |
| deliveries | POST | /deliveries/{waypoint_id}/pod | driver | yes | pending | yes |
| deliveries | POST | /deliveries/{waypoint_id}/discrepancy | driver, store_manager | yes | pending | yes |
| sync | POST | /sync/batch | public | no | pending | no |
| system | GET | / | public | no | live | no |
| system | GET | /health | public | no | live | no |
