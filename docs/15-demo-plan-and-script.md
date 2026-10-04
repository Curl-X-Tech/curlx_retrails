# Demo Plan and Script

**Project**: ReTrails — Team CurlX  
**Competition**: Tech-Triathlon 2026 — The Intelligent Enterprise, Phase 2 (Hackathon)  
**Target Duration**: 5–8 minutes  
**Format**: Screen recording with live application demonstration and spoken narration  

---

## 1. Demo Structure Overview

The demonstration presents the end-to-end delivery lifecycle across all four core user roles, showcases the automated vehicle allocation engine with operational constraints, proves offline execution and recovery in field conditions, and explains the technical architecture and codebase.

| Time Window | Segment | Target Focus | Screen / View |
|---|---|---|---|
| 00:00–00:30 | Problem and Solution | Business challenge, Waypoint Group multi-brand logistics, ReTrails solution | Architecture diagram / Landing |
| 00:30–01:30 | Store Manager Workflow | Order creation, brand catalogs, constraints, submission | Store Manager Dashboard / Order Entry |
| 01:30–02:30 | Dispatcher Planning | Daily order cutoff, automated allocation engine run, fleet utilization, deferrals | Dispatcher Operations Center / Fleet Allocation |
| 02:30–03:30 | Loader Staging | Bay station checklist, barcode scan verification, reverse-drop sequence loading | Bay Station Loading Console |
| 03:30–04:30 | Driver Field Delivery | Route manifest, turn-by-turn sequence, drop verification, exception handling | Driver Mobile Cockpit / PWA |
| 04:30–05:00 | Store Receipt & Verification | Inbound delivery inspection, acceptance, discrepancy reporting | Store Receiving Console |
| 05:00–06:00 | Constraints & Offline Recovery | Network disconnect simulation, offline mutation queue, reconnect auto-drain | Network DevTools + Offline Banner |
| 06:00–07:00 | System Architecture | FastAPI async backend, PostgreSQL relational schema, Dexie IndexedDB sync | System Architecture Diagram / Code |
| 07:00–08:00 | Engineering & Quality | Code organization, constraint solver, test suite, and audit compliance | Terminal (pytest, linters, dev.sh) |

---

## 2. Minute-by-Minute Action Plan

| Time | Role / Section | Screen | Action | Spoken Explanation |
|---|---|---|---|---|
| 00:00–00:30 | Introduction | Title slide / System Overview | Display ReTrails overview slide and web app landing page. | Introduce Team CurlX and ReTrails: an intelligent, offline-first delivery management platform built for Waypoint Group's retail networks in Sri Lanka. State the operational bottlenecks: multi-brand logistics, cold chain compliance, loading delays, and intermittent field connectivity. |
| 00:30–01:30 | Store Manager | Store Dashboard (`/store-manager`) | Log in as Store Manager (`manager.colombo@retrails.local`). Click 'Create Order'. Select items across Brand Alpha and Brand Beta. Add a cold chain item (flagging `COL`). Set delivery time window. Submit order. | Demonstrate role-specific dashboard. Show brand-isolated catalog browsing, dynamic cart computation with unit pricing in LKR, and automatic constraint tagging (`COL`, `FRG`). Explain how orders enter `submitted` status before the daily cutoff. |
| 01:30–02:30 | Dispatcher | Dispatcher Console (`/dispatcher`) | Log in as Dispatcher (`dispatcher@retrails.local`). View pending orders across all regions. Trigger 'Run Allocation Engine' for the 16:00 cutoff. | Walk through dispatch orchestration. Explain how the Google OR-Tools CP-SAT and heuristic allocation engine balances volume and weight limits, vehicle types (reefer vs ambient), driver hours, fuel quotas, and mall delivery access (`MAL`). Show generated delivery routes and deferred order management. |
| 02:30–03:30 | Loader | Bay Station View (`/loader`) | Switch to Loader (`loader@retrails.local`). Select staged vehicle `WP-CAD-1021`. Open loading checklist. Scan items into bay. Mark bay release. | Demonstrate warehouse bay station interface. Highlight reverse-drop loading order (LIFO), cold chain reefer compartmentalization, hazardous goods separation (`HAZ`), and final vehicle seal recording. |
| 03:30–04:30 | Driver | Driver Mobile Cockpit (`/driver`) | Log in as Driver (`driver.kamal@retrails.local`). View active route. Start navigation to Stop 1. Mark arrival. Complete delivery sign-off. | Show the mobile-optimized driver interface. Demonstrate route progression, customer contact, delivery time window compliance, digital proof of delivery capture, and handling of partial acceptance or customer refusal. |
| 04:30–05:00 | Store Manager Receipt | Store Receiving (`/store-manager/receiving`) | Switch back to Store Manager. Open incoming delivery notification. Review delivered quantities against dispatch manifest. Confirm acceptance. | Complete the operational loop. Show store manager receiving verification, barcode scan matching, temperature log verification for cold chain items, and instant status transition to `completed`. |
| 05:00–06:00 | Constraints & Offline Operation | Driver View + Network Throttling | Toggle Chrome DevTools to 'Offline'. Attempt delivery completion and status update. Show offline banner. Toggle network back to 'Online'. Show background sync queue draining. | Prove zero-data-loss offline architecture. Explain Dexie.js IndexedDB local mutation logging, retry policies with exponential backoff, and backend idempotent conflict resolution via transactional row locks. |
| 06:00–07:00 | Architecture & Tech Stack | Architecture Diagrams / OpenAPI docs (`/docs`) | Show system architecture diagram, PostgreSQL schema relations, and FastAPI interactive API documentation. | Present the layered architecture: React 18 TypeScript PWA with Tailwind CSS design system, FastAPI async backend with SQLAlchemy 2.0, PostgreSQL 16 relational engine with ACID guarantees, and Google OR-Tools optimization engine. |
| 07:00–08:00 | Engineering & Code Walkthrough | Terminal / IDE (`./dev.sh check`, test output) | Run `./dev.sh test` in terminal. Show passing backend pytest suite and typecheck validation. Highlight clean repository structure. | Highlight engineering standards: 100% async Python pipeline, strict Pydantic v2 domain schemas, comprehensive unit/integration tests, zero security vulnerabilities, Docker Compose one-command orchestration, and ethical AI disclosure. Conclude demo. |

---

## 3. Spoken Demo Script

### Segment 1: Problem and Solution (00:00–00:30)

> "Judges, welcome. We are Team CurlX, presenting ReTrails, an enterprise logistics and delivery management platform developed for Waypoint Group.
> 
> Waypoint Group manages daily distribution across three retail brands, coordinating warehouses, multi-temperature vehicle fleets, and dozens of retail stores throughout Sri Lanka. Their daily operations face severe bottlenecks: strict cold-chain and mall access constraints, unpredictable traffic corridors, manual vehicle allocation inefficiencies, and intermittent mobile connectivity in rural and hill-country delivery zones.
> 
> ReTrails solves this with an end-to-end, role-driven platform featuring automated vehicle allocation powered by constraint programming and an offline-first architecture that guarantees zero data loss in the field. Let us walk through the complete operational lifecycle."

---

### Segment 2: Store Manager Order Placement (00:30–01:30)

> "We begin our walkthrough in the shoes of a Store Manager at our flagship Colombo store.
> 
> Upon logging in, the store manager sees a lean, high-contrast dashboard displaying active inventory replenishment, incoming shipments, and historical orders.
> 
> Clicking 'Create Order' opens the multi-brand ordering interface. The store manager selects ambient retail products from Brand Alpha and perishable dairy products from Brand Beta. Notice that as chilled items are added, the system automatically tags the order line with the `COL` Special Handling Code, mandating refrigerated transport.
> 
> The store manager sets their delivery window for tomorrow morning between 08:00 and 11:00 AM, adhering to local store receiving constraints. Reviewing the line items, unit prices in Sri Lankan Rupees, and total volumetric metrics, the manager submits the order. The order is committed to the database in `submitted` status, awaiting the 16:00 dispatch cutoff."

---

### Segment 3: Dispatcher Planning and Vehicle Allocation (01:30–02:30)

> "Now, we transition to the Dispatcher Operations Center.
> 
> At 16:00, order placement closes for next-day delivery. The dispatcher dashboard consolidates orders from across the network. Here we see our Colombo store's order alongside orders from Kandy, Galle, and Negombo.
> 
> Rather than relying on error-prone manual spreadsheets, the dispatcher clicks 'Run Allocation Engine'. In under two seconds, our hybrid optimization solver—combining Google OR-Tools CP-SAT with priority heuristic fallback—computes the optimal fleet assignment.
> 
> The engine satisfies all hard constraints simultaneously:
> First, vehicle capacity: no truck exceeds its maximum weight or cubic volume limits.
> Second, equipment compatibility: refrigerated orders tagged `COL` are strictly routed to reefer-equipped vehicles.
> Third, mall access: outlets in commercial shopping centers tagged `MAL` are assigned solely to low-clearance delivery vans.
> 
> Orders that cannot be serviced due to fleet quota or time window exhaustion are automatically tagged as `deferred`, recorded with audit reasons, and scheduled for priority inclusion in the next cycle. The dispatcher approves the dispatch plan with a single click, transitioning orders to `assigned`."

---

### Segment 4: Bay Station Loading (02:30–03:30)

> "Next, we move to the warehouse loading bay station, where the Loader prepares vehicle `WP-CAD-1021`.
> 
> The loader tablet interface presents an interactive loading manifest organized strictly in reverse delivery sequence—Last In, First Out (LIFO). This ensures the goods needed for the first delivery stop are positioned right at the rear door.
> 
> The loader uses the barcode scanner input to verify each cargo pallet as it is moved into the vehicle. The system validates the item code and handling tags in real time. If a loader attempts to place fragile items (`FRG`) beneath heavy bulk goods or place temperature-sensitive dairy into an ambient van, the system triggers an immediate validation alert.
> 
> Once all pallets are verified and scanned, the loader records the vehicle physical seal number and marks the bay loading complete. Vehicle status shifts to `loaded`."

---

### Segment 5: Driver Field Delivery (03:30–04:30)

> "Now we follow Driver Kamal on the mobile field interface.
> 
> As Kamal begins the run, the PWA cockpit displays his ordered sequence of delivery stops, estimated arrival times, and customer store contact details.
> 
> Approaching Stop 1 at Colombo Central Store, Kamal taps 'Arrived at Store'. The system logs the GPS timestamp in UTC. Kamal presents the digital delivery manifest to the store receiving team.
> 
> The interface allows line-item confirmation. If all goods are intact, the driver captures the receiver's digital signature and confirmation code directly on the mobile glass. Upon submission, the order is marked `delivered`, and real-time delivery telemetry propagates back to the central dispatcher."

---

### Segment 6: Store Receipt and Acceptance (04:30–05:00)

> "Back at the Colombo retail outlet, the Store Manager verifies the inbound shipment.
> 
> Opening the receiving portal, the manager reviews the delivered items against the original purchase order. The system highlights the verified delivery timestamp and the temperature logger confirmation for the cold chain line items.
> 
> The store manager confirms full receipt. The order lifecycle successfully reaches `completed`. Had there been damaged items, the manager could record partial acceptance with photo evidence, triggering an immediate credit note request in the backend."

---

### Segment 7: Constraint Handling and Offline Operation (05:00–06:00)

> "Field logistics in Sri Lanka frequently encounter network dead zones. Here we demonstrate our zero-data-loss offline capability.
> 
> We simulate complete signal loss by setting network throttling in Chrome DevTools to 'Offline'. The application instantly displays the solid offline status indicator.
> 
> While offline, Driver Kamal continues his route: he navigates to the next stop, opens the manifest cached locally in Dexie.js IndexedDB, captures delivery verification, and submits the drop confirmation.
> 
> Instead of crashing or displaying a network error, ReTrails commits the transaction locally and enqueues the signed mutation into an IndexedDB sync queue.
> 
> Watch what happens when connectivity is restored: we toggle DevTools back to 'Online'. Within 1.5 seconds, the background sync worker drains the queue, transmits the payload to the FastAPI backend, resolves timestamps, and reconciles state with zero manual intervention."

---

### Segment 8: System Architecture (06:00–07:00)

> "Under the hood, ReTrails is built on a modern, decoupled architecture designed for high availability and strict data integrity.
> 
> The frontend is a responsive React 18 Progressive Web Application styled with a custom Tailwind CSS 4-tier layout system optimized across 4K command centers, desktops, warehouse tablets, and driver smartphones.
> 
> The backend is built with asynchronous FastAPI and Python 3.12, adhering to clean domain-driven architecture. Database persistence is handled by PostgreSQL 16 through SQLAlchemy 2.0 with strict foreign key constraints, check constraints for positive capacities and valid status enums, and automated audit triggers.
> 
> Every operational timestamp is recorded in UTC, while business day cutoffs evaluate against Sri Lanka Standard Time. Transactional email notifications are powered by React Email templates."

---

### Segment 9: Engineering Quality and Code Walkthrough (07:00–08:00)

> "Finally, let us review our engineering standards.
> 
> In the terminal, running our dev automation script `./dev.sh check` executes our full linting, type-checking, and test validation suite.
> 
> Our backend test suite covers unit tests for the OR-Tools constraint solver, route optimization heuristics, role-based security guards, and database transactions.
> 
> The entire stack is containerized with Docker Compose, allowing reproducible one-command setup for both local evaluation and cloud deployment.
> 
> In summary, ReTrails delivers a battle-tested, resilient, and enterprise-grade delivery management platform for Waypoint Group. Thank you, and we welcome your questions."

---

## 4. Verification Checklist for Evaluators

| Step | Verification Target | Expected Result | Pass / Fail |
|---|---|---|---|
| 1 | Store Manager Login & Order Entry | User can log in, select products, specify quantities, tag handling constraints, and submit. | [ ] |
| 2 | Cutoff & Allocation Execution | Dispatcher can trigger allocation engine; routes are generated respecting capacity and reefer rules. | [ ] |
| 3 | Reverse-Sequence Loading Manifest | Loader can view LIFO loading checklist and record vehicle seal. | [ ] |
| 4 | Driver Delivery Completion | Driver can view assigned stops, record delivery progress, and capture proof of delivery. | [ ] |
| 5 | Store Receipt Verification | Store manager can review delivered items and confirm acceptance. | [ ] |
| 6 | Offline Persistence & Drain | Offline mutations succeed locally in Dexie and sync cleanly to PostgreSQL upon reconnection. | [ ] |
| 7 | Role-Based Access Control | Unauthorized cross-role navigation is rejected with 403 Forbidden. | [ ] |
| 8 | Automated Test Suite | `./dev.sh test` runs and passes with zero test failures. | [ ] |
