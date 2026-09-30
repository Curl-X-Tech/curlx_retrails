-- ============================================================
-- ReTrails (Team CurlX) - Master Enterprise Database Schema
-- Target: PostgreSQL 15+
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. Reference & Master Domain Tables
-- ============================================================

-- Depots: Peliyagoda (DC) & Kandy (Regional Hub)
CREATE TABLE IF NOT EXISTS depot (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                    TEXT NOT NULL UNIQUE,          -- 'PEL', 'KDY'
    name                    TEXT NOT NULL UNIQUE,          -- 'Peliyagoda', 'Kandy'
    latitude                DOUBLE PRECISION NOT NULL,
    longitude               DOUBLE PRECISION NOT NULL,
    address                 TEXT,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Districts: 12 Districts served across Western & Central Provinces
CREATE TABLE IF NOT EXISTS district (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    TEXT NOT NULL UNIQUE,          -- 'Colombo', 'Gampaha', 'Kalutara', 'Kandy', etc.
    province                TEXT NOT NULL,                 -- 'Western', 'Central'
    assigned_depot_id       UUID NOT NULL REFERENCES depot(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Brands: Waypoint Fresh (80 outlets), Waypoint Style (25 outlets), Waypoint Tech (15 outlets)
CREATE TABLE IF NOT EXISTS brand (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                    TEXT NOT NULL UNIQUE,          -- 'FRESH', 'STYLE', 'TECH'
    name                    TEXT NOT NULL UNIQUE,          -- 'Fresh', 'Style', 'Tech'
    delivery_window_type    TEXT NOT NULL,                 -- 'morning_strict', 'mall_bay_restricted', 'standard_retail'
    requires_cold_chain     BOOLEAN NOT NULL DEFAULT FALSE,
    daily_time_budget_min   INT NOT NULL,                  -- Fresh: 270 mins (3:30 AM-8:00 AM) | Style/Tech: 480 mins
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Calendar: 2024-01-01 to 2026-06-30 (912 Days)
CREATE TABLE IF NOT EXISTS calendar_day (
    date                    DATE PRIMARY KEY,              -- 'YYYY-MM-DD'
    dow                     INT NOT NULL CHECK (dow BETWEEN 0 AND 6), -- 0 = Monday
    dow_name                VARCHAR(3) NOT NULL,           -- 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
    is_weekend              BOOLEAN NOT NULL DEFAULT FALSE,
    iso_year                INT NOT NULL,
    iso_week                INT NOT NULL,
    is_payday               BOOLEAN NOT NULL DEFAULT FALSE,
    festival                TEXT,                          -- 'thai_pongal', 'sinhala_tamil_new_year', 'vesak', etc.
    festival_ramp           NUMERIC(3,2) NOT NULL DEFAULT 0.0 CHECK (festival_ramp BETWEEN 0.0 AND 1.0),
    is_holiday              BOOLEAN NOT NULL DEFAULT FALSE,
    monsoon                 BOOLEAN NOT NULL DEFAULT FALSE,
    is_operating            BOOLEAN NOT NULL DEFAULT TRUE, -- Waypoint operates Mon-Sat
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- District Travel Matrix: Speeds and Inter-Stop Travel Time Constants
CREATE TABLE IF NOT EXISTS district_travel (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_name                   TEXT NOT NULL,
    depot_name                      TEXT NOT NULL,
    road_class                      TEXT NOT NULL CHECK (road_class IN ('urban', 'suburban', 'highway', 'hill')),
    free_flow_kmh                   NUMERIC(5,2) NOT NULL,
    depot_to_district_km            NUMERIC(6,2) NOT NULL,
    depot_to_district_freeflow_min  NUMERIC(6,2) NOT NULL,
    inter_stop_km                   NUMERIC(6,2) NOT NULL,
    inter_stop_freeflow_min         NUMERIC(6,2) NOT NULL,
    UNIQUE(district_name, depot_name)
);

-- Service Handling Allowance Matrix: Standard Stop Unloading Time Constants
CREATE TABLE IF NOT EXISTS service_allowance (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_name              TEXT NOT NULL,                 -- 'Fresh', 'Style', 'Tech'
    dock_type               TEXT NOT NULL CHECK (dock_type IN ('rear_dock', 'street', 'mall_bay')),
    service_allowance_min   NUMERIC(5,2) NOT NULL,         -- e.g. Fresh + rear_dock = 15, Fresh + street = 16
    UNIQUE(brand_name, dock_type)
);

-- Outlets: 120 Outlets (OUT001 - OUT120) with Dock & Mall Constraints
CREATE TABLE IF NOT EXISTS outlet (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outlet_id               TEXT NOT NULL UNIQUE,          -- 'OUT001' to 'OUT120'
    brand_id                UUID NOT NULL REFERENCES brand(id),
    district_id             UUID NOT NULL REFERENCES district(id),
    depot_id                UUID NOT NULL REFERENCES depot(id),
    name                    TEXT NOT NULL,
    dock_type               TEXT NOT NULL CHECK (dock_type IN ('rear_dock', 'street', 'mall_bay')),
    parking_constraint      TEXT NOT NULL CHECK (parking_constraint IN ('normal', 'van_only', 'mall_dock')),
    mall_window             TEXT,                          -- '09:00-11:00', '10:30-12:30' (NULL if outside mall)
    window_open_time        TIME NOT NULL,                 -- e.g. 05:00:00 (Fresh) or 09:00:00 (Mall)
    window_close_time       TIME NOT NULL,                 -- e.g. 08:00:00 (Fresh stores open) or 11:00:00
    latitude                DOUBLE PRECISION,
    longitude               DOUBLE PRECISION,
    contact_phone           TEXT,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Catalog Items & SKUs
CREATE TABLE IF NOT EXISTS item (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku                     TEXT NOT NULL UNIQUE,
    brand_id                UUID NOT NULL REFERENCES brand(id),
    name                    TEXT NOT NULL,
    category                TEXT NOT NULL,
    unit_weight_kg          NUMERIC(10,3) NOT NULL,
    unit_volume_m3          NUMERIC(10,4) NOT NULL,
    requires_cold_chain     BOOLEAN NOT NULL DEFAULT FALSE,
    special_handling_code   TEXT,                          -- 'COL', 'FRG', 'MAL', 'HAZ'
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. Fleet & Driver Management (60 Vehicles & Driver Credentials)
-- ============================================================

-- Fleet: 60 Vehicles (VEH001 - VEH060)
-- 12 Reefer Trucks, 40 Dry Trucks, 4 Reefer Vans, 4 Ambient Vans
CREATE TABLE IF NOT EXISTS vehicle (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id              TEXT NOT NULL UNIQUE,          -- 'VEH001' to 'VEH060'
    reg_number              TEXT NOT NULL UNIQUE,          -- 'NP-4811', 'WP-3021'
    model_name              TEXT NOT NULL,                 -- 'Isuzu ELF NPR', 'Tata Ace'
    type                    TEXT NOT NULL CHECK (type IN ('truck', 'van')),
    temp                    TEXT NOT NULL CHECK (temp IN ('reefer', 'ambient')),
    weight_cap_kg           NUMERIC(10,2) NOT NULL,        -- Weight limit per trip
    volume_cap_m3           NUMERIC(10,2) NOT NULL,        -- Volume limit per trip
    fuel_type               TEXT NOT NULL DEFAULT 'diesel',
    km_per_l                NUMERIC(4,2) NOT NULL,         -- Fuel efficiency
    weekly_fuel_quota_l     NUMERIC(8,2) NOT NULL,         -- Fuel quota budget
    consumed_fuel_l         NUMERIC(8,2) NOT NULL DEFAULT 0.0,
    depot_id                UUID NOT NULL REFERENCES depot(id), -- Home depot constraint
    status                  TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'loading', 'in_transit', 'in_workshop', 'breakdown')),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Drivers: Dedicated 1-to-1 Vehicle Assignment & Safety Credentials
CREATE TABLE IF NOT EXISTS driver (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_code             TEXT NOT NULL UNIQUE,          -- 'DRV-104', 'DRV-208'
    first_name              TEXT NOT NULL,
    last_name               TEXT NOT NULL,
    phone                   TEXT NOT NULL,
    blood_group             VARCHAR(5) NOT NULL,           -- 'O+', 'A+', 'B+', 'AB-'
    license_number          TEXT NOT NULL UNIQUE,
    license_class           TEXT NOT NULL,                 -- 'Heavy Commercial (Class A)', 'Van (Class B)'
    license_expiry          DATE NOT NULL,
    safety_rating           NUMERIC(3,2) NOT NULL DEFAULT 5.00 CHECK (safety_rating BETWEEN 1.00 AND 5.00),
    total_completed_trips   INT NOT NULL DEFAULT 0,
    depot_id                UUID NOT NULL REFERENCES depot(id),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. Customer Orders, Items & Deferral Tracking
-- ============================================================

-- Orders: Store orders placed before 4:00 PM cutoff
CREATE TABLE IF NOT EXISTS customer_order (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_ref               TEXT NOT NULL UNIQUE,          -- 'S1-000', 'ORD-2024-88491'
    outlet_id               UUID NOT NULL REFERENCES outlet(id),
    order_date              DATE NOT NULL REFERENCES calendar_day(date), -- Target delivery date
    required_date           DATE NOT NULL REFERENCES calendar_day(date),
    temp_requirement        TEXT NOT NULL CHECK (temp_requirement IN ('chilled', 'ambient')),
    order_units             INT NOT NULL DEFAULT 1,
    order_weight_kg         NUMERIC(10,3) NOT NULL,
    order_volume_m3         NUMERIC(10,4) NOT NULL,
    status                  TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'served', 'deferred', 'cancelled')),
    is_urgent               BOOLEAN NOT NULL DEFAULT FALSE,
    deferred_yesterday      INT NOT NULL DEFAULT 0 CHECK (deferred_yesterday IN (0, 1)),
    days_since_last_served  INT NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_item (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id                UUID NOT NULL REFERENCES customer_order(id) ON DELETE CASCADE,
    item_id                 UUID NOT NULL REFERENCES item(id),
    package_code            TEXT NOT NULL UNIQUE,          -- 'PKG-90412-A'
    requested_qty           INT NOT NULL CHECK (requested_qty > 0),
    loaded_qty              INT NOT NULL DEFAULT 0,
    delivered_qty           INT NOT NULL DEFAULT 0,
    unit_weight_kg          NUMERIC(10,3) NOT NULL,
    unit_volume_m3          NUMERIC(10,4) NOT NULL,
    special_handling_code   TEXT,                          -- 'COL', 'FRG', 'MAL'
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deferral Audit Log: Tracks why orders were deferred and prevents consecutive skips
CREATE TABLE IF NOT EXISTS deferral_audit_log (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id                UUID NOT NULL REFERENCES customer_order(id),
    outlet_id               UUID NOT NULL REFERENCES outlet(id),
    dispatch_date           DATE NOT NULL REFERENCES calendar_day(date),
    deferral_reason         TEXT NOT NULL,                 -- 'insufficient_reefer_capacity', 'van_access_shortage', 'time_budget_limit', 'fuel_quota_exceeded'
    limiting_resource       TEXT NOT NULL,                 -- 'weight_cap', 'volume_cap', 'time_budget', 'fleet_downtime'
    decision_maker_id       TEXT NOT NULL,                 -- Dispatcher ID
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. Trips, Multi-Leg Routing & 3D Cargo Staging
-- ============================================================

-- Trips: Max 2 trips per vehicle per day. Enforces Feasibility Rule 1 (Same Brand & Same District)
CREATE TABLE IF NOT EXISTS trip (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_code               TEXT NOT NULL UNIQUE,          -- 'RT-14', 'TRP-8820'
    dispatch_date           DATE NOT NULL REFERENCES calendar_day(date),
    trip_sequence           INT NOT NULL CHECK (trip_sequence IN (1, 2)), -- Trip 1 (Morning) or Trip 2 (Afternoon)
    vehicle_id              UUID NOT NULL REFERENCES vehicle(id),
    driver_id               UUID NOT NULL REFERENCES driver(id),
    depot_id                UUID NOT NULL REFERENCES depot(id),
    brand_id                UUID NOT NULL REFERENCES brand(id),           -- Rule 1: All orders on trip share brand
    district_id             UUID NOT NULL REFERENCES district(id),        -- Rule 1: All orders on trip share district
    seal_number             TEXT,                                         -- 'SL-90821-B' (Recorded before departure)
    status                  TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'loading', 'dispatched', 'in_transit', 'completed', 'cancelled')),
    planned_start_time      TIMESTAMPTZ,
    actual_start_time       TIMESTAMPTZ,
    actual_end_time         TIMESTAMPTZ,
    outbound_travel_min     NUMERIC(6,2) NOT NULL DEFAULT 0.0,
    inter_stop_travel_min   NUMERIC(6,2) NOT NULL DEFAULT 0.0,
    total_handling_min      NUMERIC(6,2) NOT NULL DEFAULT 0.0,
    total_trip_duration_min NUMERIC(6,2) NOT NULL DEFAULT 0.0,            -- outbound + inter-stop + handling
    total_distance_km       NUMERIC(8,2) NOT NULL DEFAULT 0.0,
    total_payload_kg        NUMERIC(10,2) NOT NULL DEFAULT 0.0,
    total_volume_m3         NUMERIC(10,2) NOT NULL DEFAULT 0.0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(dispatch_date, vehicle_id, trip_sequence)                      -- Hard constraint: Max 2 trips per vehicle/day
);

-- Route Legs / Waypoints: Multi-stop journey sequence with actual timestamps
CREATE TABLE IF NOT EXISTS route_leg (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leg_id                      TEXT NOT NULL UNIQUE,      -- 'LEG-0912-1'
    trip_id                     UUID NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
    seq                         INT NOT NULL,              -- 0-indexed position on the route
    from_point                  TEXT NOT NULL,             -- 'DEPOT' for leg 0, else previous outlet_id
    to_outlet_id                UUID NOT NULL REFERENCES outlet(id),
    order_id                    UUID REFERENCES customer_order(id),
    distance_km                 NUMERIC(6,2) NOT NULL,
    planned_depart_time         TIME NOT NULL,
    planned_travel_duration_min NUMERIC(6,2) NOT NULL,
    planned_arrival_time        TIME NOT NULL,
    actual_depart_time          TIMESTAMPTZ,
    actual_travel_duration_min  NUMERIC(6,2),
    arrival_time                TIMESTAMPTZ,
    leave_outlet_time           TIMESTAMPTZ,
    status                      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'arrived', 'completed', 'skipped', 'newly_added')),
    is_post_dispatch_added      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(trip_id, seq)
);

-- 3D Cargo Bay Layout: Visualizes reverse-order (LIFO) bay staging
CREATE TABLE IF NOT EXISTS cargo_bay_allocation (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id                 UUID NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
    order_item_id           UUID NOT NULL REFERENCES order_item(id),
    bay_x                   INT NOT NULL,                  -- Grid column (1 to 4)
    bay_y                   INT NOT NULL,                  -- Grid row (1 to 6)
    bay_z                   INT NOT NULL DEFAULT 1,        -- Tier level (1 = Base, 2 = Stacked)
    is_loaded               BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(trip_id, bay_x, bay_y, bay_z)
);

-- ============================================================
-- 5. Role Execution: Loading Checklist, POD & Discrepancies
-- ============================================================

-- Loader Role: Pre-departure checklist & cargo shortfall flagging
CREATE TABLE IF NOT EXISTS loading_checklist_item (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id                 UUID NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
    order_item_id           UUID NOT NULL REFERENCES order_item(id),
    status                  TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scanned', 'verified', 'flagged')),
    scanned_barcode         TEXT,
    verified_by             TEXT,                          -- Loader ID or Driver Code
    verified_at             TIMESTAMPTZ,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(trip_id, order_item_id)
);

-- Driver & Store Manager Roles: Proof of Delivery (Offline-capable)
CREATE TABLE IF NOT EXISTS proof_of_delivery (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id                 UUID NOT NULL REFERENCES trip(id),
    order_id                UUID NOT NULL REFERENCES customer_order(id),
    outlet_id               UUID NOT NULL REFERENCES outlet(id),
    recipient_name          TEXT NOT NULL,
    recipient_phone         TEXT,
    signature_svg           TEXT NOT NULL,                 -- Vector signature capture
    delivered_at            TIMESTAMPTZ NOT NULL,
    delivery_lat            DOUBLE PRECISION NOT NULL,
    delivery_lng            DOUBLE PRECISION NOT NULL,
    temperature_reading     NUMERIC(4,2),                  -- Temp check on handover for chilled goods
    photo_evidence_url      TEXT,
    is_offline_synced       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Discrepancy Reports: Missing, Damaged, Temperature breaches, or Window violations
CREATE TABLE IF NOT EXISTS discrepancy_report (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id                 UUID NOT NULL REFERENCES trip(id),
    order_id                UUID NOT NULL REFERENCES customer_order(id),
    order_item_id           UUID REFERENCES order_item(id),
    discrepancy_type        TEXT NOT NULL CHECK (discrepancy_type IN ('damaged', 'shortage', 'rejected', 'temp_breach', 'delayed_window')),
    reported_qty            INT,
    reported_by             TEXT NOT NULL,                 -- Driver, Loader, or Store Manager
    reported_at             TIMESTAMPTZ NOT NULL,
    description             TEXT NOT NULL,
    photo_url               TEXT,
    resolution_status       TEXT NOT NULL DEFAULT 'open' CHECK (resolution_status IN ('open', 'under_investigation', 'resolved', 'waived')),
    resolved_by             TEXT,
    resolved_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Live Telemetry: GPS, heading, and Reefer cold-chain temperature logs
CREATE TABLE IF NOT EXISTS vehicle_telemetry (
    id                      BIGSERIAL PRIMARY KEY,
    vehicle_id              UUID NOT NULL REFERENCES vehicle(id),
    trip_id                 UUID REFERENCES trip(id),
    timestamp               TIMESTAMPTZ NOT NULL DEFAULT now(),
    latitude                DOUBLE PRECISION NOT NULL,
    longitude               DOUBLE PRECISION NOT NULL,
    speed_kmh               NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    heading_deg             NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    reefer_temp_celsius     NUMERIC(4,2),
    ambient_temp_celsius    NUMERIC(4,2),
    fuel_level_pct          NUMERIC(5,2),
    battery_pct             NUMERIC(5,2)
);

-- ============================================================
-- 6. Offline Bulk Sync Audit Engine (Hill Country & Kandy Corridor)
-- ============================================================

-- Sync Batch Log: Tracks every multi-mutation session drained from Dexie
CREATE TABLE IF NOT EXISTS sync_batch_log (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id                TEXT NOT NULL UNIQUE,          -- Client UUID 'batch-...'
    client_id               TEXT NOT NULL,                 -- Device fingerprint / PWA ID
    driver_code             TEXT,
    total_mutations         INT NOT NULL,
    processed_count         INT NOT NULL DEFAULT 0,
    failed_count            INT NOT NULL DEFAULT 0,
    client_started_at       TIMESTAMPTZ NOT NULL,
    client_completed_at     TIMESTAMPTZ NOT NULL,
    server_received_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    status                  TEXT NOT NULL CHECK (status IN ('processing', 'success', 'partial_error', 'failed')),
    error_summary           TEXT
);

-- Sync Mutation Audit: Idempotent replay preventing duplicate state execution
CREATE TABLE IF NOT EXISTS sync_mutation_audit_log (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id                TEXT NOT NULL REFERENCES sync_batch_log(batch_id) ON DELETE CASCADE,
    idempotency_key         TEXT NOT NULL UNIQUE,          -- Generated on mobile client
    entity_name             TEXT NOT NULL,                 -- 'checklist_item', 'telemetry', 'pod', 'discrepancy'
    entity_id               TEXT NOT NULL,
    action                  TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
    payload_json            JSONB NOT NULL,
    before_snapshot         JSONB,
    client_timestamp        TIMESTAMPTZ NOT NULL,
    server_timestamp        TIMESTAMPTZ NOT NULL DEFAULT now(),
    status                  TEXT NOT NULL CHECK (status IN ('applied', 'duplicate_ignored', 'conflict_resolved', 'failed')),
    error_message           TEXT
);

-- ============================================================
-- 7. High-Performance Indices
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_outlet_depot_brand ON outlet(depot_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_outlet_district ON outlet(district_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_depot_status ON vehicle(depot_id, status);
CREATE INDEX IF NOT EXISTS idx_order_outlet_date ON customer_order(outlet_id, order_date);
CREATE INDEX IF NOT EXISTS idx_order_status_urgent ON customer_order(status, is_urgent);
CREATE INDEX IF NOT EXISTS idx_trip_dispatch_date ON trip(dispatch_date, status);
CREATE INDEX IF NOT EXISTS idx_trip_vehicle_seq ON trip(vehicle_id, dispatch_date, trip_sequence);
CREATE INDEX IF NOT EXISTS idx_trip_brand_district ON trip(brand_id, district_id);
CREATE INDEX IF NOT EXISTS idx_route_leg_trip_seq ON route_leg(trip_id, seq);
CREATE INDEX IF NOT EXISTS idx_checklist_trip ON loading_checklist_item(trip_id, status);
CREATE INDEX IF NOT EXISTS idx_telemetry_veh_ts ON vehicle_telemetry(vehicle_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sync_idempotency ON sync_mutation_audit_log(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_sync_batch ON sync_mutation_audit_log(batch_id);
