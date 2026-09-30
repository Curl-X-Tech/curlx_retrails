-- ============================================================
-- ReTrails (Team CurlX) - Master Enterprise Database Schema
-- Target: PostgreSQL 15+ (Hackathon Core Engine)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. Reference & Master Domain Tables
-- ============================================================

-- Depots: Peliyagoda (Distribution Center) & Kandy (Regional Hub)
CREATE TABLE IF NOT EXISTS depot (
    id                      UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    code                    TEXT NOT NULL UNIQUE,          -- 'PEL', 'KDY'
    name                    TEXT NOT NULL UNIQUE,          -- 'Peliyagoda', 'Kandy'
    latitude                DOUBLE PRECISION NOT NULL,
    longitude               DOUBLE PRECISION NOT NULL,
    address                 TEXT,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Districts: 12 Districts served across Western & Central Provinces
CREATE TABLE IF NOT EXISTS district (
    id                      UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    name                    TEXT NOT NULL UNIQUE,          -- 'Colombo', 'Gampaha', 'Kalutara', 'Kandy', etc.
    province                TEXT NOT NULL,                 -- 'Western', 'Central'
    assigned_depot_id       UUID NOT NULL REFERENCES depot(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Brands: Waypoint Fresh (80 outlets), Waypoint Style (25 outlets), Waypoint Tech (15 outlets)
CREATE TABLE IF NOT EXISTS brand (
    id                      UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    code                    TEXT NOT NULL UNIQUE,          -- 'FRESH', 'STYLE', 'TECH'
    name                    TEXT NOT NULL UNIQUE,          -- 'Fresh', 'Style', 'Tech'
    delivery_window_type    TEXT NOT NULL,                 -- 'morning_strict', 'mall_bay_restricted', 'standard_retail'
    requires_cold_chain     BOOLEAN NOT NULL DEFAULT FALSE,
    daily_time_budget_min   INT NOT NULL,                  -- Fresh: 270 mins (3:30 AM-8:00 AM) | Style/Tech: 480 mins
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Calendar: Operating days, monsoons, and festival demand surge tracking
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
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Outlets: 120 Outlets (OUT001 - OUT120) with Dock & Mall Constraints
CREATE TABLE IF NOT EXISTS outlet (
    id                      UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
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
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Catalog Items & SKUs (Product Master)
CREATE TABLE IF NOT EXISTS item (
    id                      UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    sku                     TEXT NOT NULL UNIQUE,
    brand_id                UUID NOT NULL REFERENCES brand(id),
    name                    TEXT NOT NULL,
    category                TEXT NOT NULL,
    unit_weight_kg          NUMERIC(10,3) NOT NULL,
    unit_volume_m3          NUMERIC(10,4) NOT NULL,
    requires_cold_chain     BOOLEAN NOT NULL DEFAULT FALSE,
    special_handling_code   TEXT,                          -- 'COL', 'FRG', 'MAL', 'HAZ'
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Temporal Price List: Effective Date Tracking
CREATE TABLE IF NOT EXISTS price_list (
    id                      UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    item_id                 UUID NOT NULL REFERENCES item(id) ON DELETE CASCADE,
    cost_price              NUMERIC(10,2) NOT NULL DEFAULT 0.00,        -- Buying / wholesale cost (LKR)
    unit_price              NUMERIC(10,2) NOT NULL DEFAULT 0.00,        -- Selling price to outlet (LKR)
    currency                VARCHAR(3) NOT NULL DEFAULT 'LKR',
    effective_from          DATE NOT NULL DEFAULT CURRENT_DATE,         -- Active start date (defaults to current date)
    effective_to            DATE,                                       -- NULL means currently active indefinitely
    price_change_reason     TEXT,                                       -- 'standard_pricing', 'festival_promo', 'supplier_revision', 'seasonal_adjustment'
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

-- Active Price View
CREATE OR REPLACE VIEW v_active_price_list AS
SELECT DISTINCT ON (item_id)
    id AS price_list_id,
    item_id,
    cost_price,
    unit_price,
    currency,
    effective_from,
    effective_to,
    price_change_reason
FROM price_list
WHERE is_active = TRUE
  AND CURRENT_DATE >= effective_from
  AND (effective_to IS NULL OR CURRENT_DATE <= effective_to)
ORDER BY item_id, effective_from DESC, created_at DESC;

-- ============================================================
-- 2. Staff Profiles (5 Roles) & Fleet Management
-- ============================================================

-- Unified Staff Profile: system_admin, dispatcher, loader, driver, store_manager
CREATE TABLE IF NOT EXISTS staff_profile (
    id                      UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    employee_code           TEXT NOT NULL UNIQUE,          -- 'EMP-001', 'DRV-104', 'MGR-022'
    first_name              TEXT NOT NULL,
    last_name               TEXT NOT NULL,
    email                   TEXT NOT NULL UNIQUE,
    phone                   TEXT NOT NULL,
    role                    TEXT NOT NULL CHECK (role IN ('system_admin', 'dispatcher', 'loader', 'driver', 'store_manager')),
    depot_id                UUID REFERENCES depot(id),     -- For Dispatchers, Loaders, Drivers
    outlet_id               UUID REFERENCES outlet(id),    -- For Store Managers
    
    -- Driver-specific credentials (populated when role = 'driver')
    blood_group             VARCHAR(5),                    -- 'O+', 'A+', 'B+', 'AB-'
    license_number          TEXT UNIQUE,
    license_class           TEXT,                          -- 'Heavy Commercial (Class A)', 'Van (Class B)'
    license_expiry          DATE,
    safety_rating           NUMERIC(3,2) DEFAULT 5.00 CHECK (safety_rating BETWEEN 1.00 AND 5.00),
    total_completed_trips   INT DEFAULT 0,
    
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fleet: 60 Vehicles (VEH001 - VEH060)
-- 12 Reefer Trucks, 40 Dry Trucks, 4 Reefer Vans, 4 Ambient Vans
CREATE TABLE IF NOT EXISTS vehicle (
    id                      UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
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
    assigned_driver_id      UUID REFERENCES staff_profile(id),  -- 1-to-1 default driver pairing
    status                  TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'loading', 'in_transit', 'in_workshop', 'breakdown')),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. Customer Orders, Items & Deferral Tracking (Normalized)
-- ============================================================

-- Orders: Store orders placed before 4:00 PM cutoff (Header)
CREATE TABLE IF NOT EXISTS customer_order (
    id                      UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    order_ref               TEXT NOT NULL UNIQUE,          -- 'S1-000', 'ORD-2024-88491'
    outlet_id               UUID NOT NULL REFERENCES outlet(id),
    created_by_staff_id     UUID REFERENCES staff_profile(id), -- Store Manager who placed the order
    order_date              DATE NOT NULL REFERENCES calendar_day(date), -- Target delivery date
    required_date           DATE NOT NULL REFERENCES calendar_day(date),
    temp_requirement        TEXT NOT NULL CHECK (temp_requirement IN ('chilled', 'ambient')),
    status                  TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'served', 'deferred', 'cancelled')),
    is_urgent               BOOLEAN NOT NULL DEFAULT FALSE,
    deferred_yesterday      INT NOT NULL DEFAULT 0 CHECK (deferred_yesterday IN (0, 1)),
    days_since_last_served  INT NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Items: Line-item source of truth with physical dimensions, barcodes & price
CREATE TABLE IF NOT EXISTS order_item (
    id                      UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    order_id                UUID NOT NULL REFERENCES customer_order(id) ON DELETE CASCADE,
    item_id                 UUID NOT NULL REFERENCES item(id),
    package_code            TEXT NOT NULL UNIQUE,          -- 'PKG-90412-A'
    requested_qty           INT NOT NULL CHECK (requested_qty > 0),
    loaded_qty              INT NOT NULL DEFAULT 0,
    delivered_qty           INT NOT NULL DEFAULT 0,
    unit_weight_kg          NUMERIC(10,3) NOT NULL,
    unit_volume_m3          NUMERIC(10,4) NOT NULL,
    unit_price              NUMERIC(10,2) NOT NULL DEFAULT 0.00, -- Locked price from price_list at order time
    special_handling_code   TEXT,                          -- 'COL', 'FRG', 'MAL'
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dynamic Order Aggregation View
CREATE OR REPLACE VIEW v_customer_order_summary AS
SELECT 
    o.id,
    o.order_ref,
    o.outlet_id,
    o.created_by_staff_id,
    o.order_date,
    o.required_date,
    o.temp_requirement,
    o.status,
    o.is_urgent,
    o.deferred_yesterday,
    o.days_since_last_served,
    COUNT(oi.id) AS total_items,
    COALESCE(SUM(oi.requested_qty * oi.unit_weight_kg), 0.0) AS total_weight_kg,
    COALESCE(SUM(oi.requested_qty * oi.unit_volume_m3), 0.0) AS total_volume_m3,
    COALESCE(SUM(oi.requested_qty * oi.unit_price), 0.0) AS total_order_value_lkr,
    COALESCE(SUM(oi.loaded_qty * oi.unit_weight_kg), 0.0) AS loaded_weight_kg,
    COALESCE(SUM(oi.loaded_qty * oi.unit_volume_m3), 0.0) AS loaded_volume_m3
FROM customer_order o
LEFT JOIN order_item oi ON oi.order_id = o.id
GROUP BY o.id;

-- Deferral Audit Log: Tracks why orders were deferred and prevents consecutive skips
CREATE TABLE IF NOT EXISTS deferral_audit_log (
    id                      UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    order_id                UUID NOT NULL REFERENCES customer_order(id),
    outlet_id               UUID NOT NULL REFERENCES outlet(id),
    dispatch_date           DATE NOT NULL REFERENCES calendar_day(date),
    deferral_reason         TEXT NOT NULL,                 -- 'insufficient_reefer_capacity', 'van_access_shortage', 'time_budget_limit', 'fuel_quota_exceeded'
    limiting_resource       TEXT NOT NULL,                 -- 'weight_cap', 'volume_cap', 'time_budget', 'fleet_downtime'
    decision_maker_staff_id UUID NOT NULL REFERENCES staff_profile(id), -- Dispatcher Staff ID
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. Trips, Multi-Leg Routing & 3D Cargo Staging
-- ============================================================

-- Trips: Max 2 trips per vehicle per day. Enforces Feasibility Rule 1 (Same Brand & Same District)
CREATE TABLE IF NOT EXISTS trip (
    id                      UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    trip_code               TEXT NOT NULL UNIQUE,          -- 'RT-14', 'TRP-8820'
    dispatch_date           DATE NOT NULL REFERENCES calendar_day(date),
    trip_sequence           INT NOT NULL CHECK (trip_sequence IN (1, 2)), -- Trip 1 (Morning) or Trip 2 (Afternoon)
    vehicle_id              UUID NOT NULL REFERENCES vehicle(id),
    driver_id               UUID NOT NULL REFERENCES staff_profile(id),   -- Driver Staff ID
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
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(dispatch_date, vehicle_id, trip_sequence)                      -- Hard constraint: Max 2 trips per vehicle/day
);

-- Route Legs / Waypoints: Multi-stop journey sequence with actual timestamps
CREATE TABLE IF NOT EXISTS route_leg (
    id                          UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
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
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(trip_id, seq)
);

-- Dynamic Trip Payload Summary View
CREATE OR REPLACE VIEW v_trip_payload_summary AS
SELECT 
    t.id AS trip_id,
    t.trip_code,
    t.dispatch_date,
    t.vehicle_id,
    t.driver_id,
    v.weight_cap_kg,
    v.volume_cap_m3,
    COUNT(DISTINCT rl.order_id) AS total_orders,
    COUNT(oi.id) AS total_packages,
    COALESCE(SUM(oi.requested_qty * oi.unit_weight_kg), 0.0) AS total_payload_kg,
    COALESCE(SUM(oi.requested_qty * oi.unit_volume_m3), 0.0) AS total_volume_m3,
    COALESCE(SUM(oi.requested_qty * oi.unit_price), 0.0) AS total_cargo_value_lkr,
    ROUND((COALESCE(SUM(oi.requested_qty * oi.unit_weight_kg), 0.0) / NULLIF(v.weight_cap_kg, 0)) * 100, 1) AS weight_utilization_pct,
    ROUND((COALESCE(SUM(oi.requested_qty * oi.unit_volume_m3), 0.0) / NULLIF(v.volume_cap_m3, 0)) * 100, 1) AS volume_utilization_pct
FROM trip t
JOIN vehicle v ON v.id = t.vehicle_id
LEFT JOIN route_leg rl ON rl.trip_id = t.id
LEFT JOIN order_item oi ON oi.order_id = rl.order_id
GROUP BY t.id, t.driver_id, v.weight_cap_kg, v.volume_cap_m3;

-- 3D Cargo Bay Layout: Visualizes reverse-order (LIFO) bay staging
CREATE TABLE IF NOT EXISTS cargo_bay_allocation (
    id                      UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    trip_id                 UUID NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
    order_item_id           UUID NOT NULL REFERENCES order_item(id),
    bay_x                   INT NOT NULL,                  -- Grid column (1 to 4)
    bay_y                   INT NOT NULL,                  -- Grid row (1 to 6)
    bay_z                   INT NOT NULL DEFAULT 1,        -- Tier level (1 = Base, 2 = Stacked)
    is_loaded               BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(trip_id, bay_x, bay_y, bay_z)
);

-- ============================================================
-- 5. Role Execution: Loading Checklist, POD & Discrepancies
-- ============================================================

-- Loader Role: Pre-departure checklist & cargo shortfall flagging
CREATE TABLE IF NOT EXISTS loading_checklist_item (
    id                      UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    trip_id                 UUID NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
    order_item_id           UUID NOT NULL REFERENCES order_item(id),
    status                  TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scanned', 'verified', 'flagged')),
    scanned_barcode         TEXT,
    verified_by_staff_id    UUID REFERENCES staff_profile(id), -- Loader Staff ID
    verified_at             TIMESTAMPTZ,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(trip_id, order_item_id)
);

-- Driver & Store Manager Roles: Proof of Delivery (Offline-capable)
CREATE TABLE IF NOT EXISTS proof_of_delivery (
    id                      UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
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
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Discrepancy Reports: Missing, Damaged, Temperature breaches, or Window violations
CREATE TABLE IF NOT EXISTS discrepancy_report (
    id                      UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    trip_id                 UUID NOT NULL REFERENCES trip(id),
    order_id                UUID NOT NULL REFERENCES customer_order(id),
    order_item_id           UUID REFERENCES order_item(id),
    discrepancy_type        TEXT NOT NULL CHECK (discrepancy_type IN ('damaged', 'shortage', 'rejected', 'temp_breach', 'delayed_window')),
    reported_qty            INT,
    reported_by_staff_id    UUID NOT NULL REFERENCES staff_profile(id), -- Driver, Loader, or Store Manager
    reported_at             TIMESTAMPTZ NOT NULL,
    description             TEXT NOT NULL,
    photo_url               TEXT,
    resolution_status       TEXT NOT NULL DEFAULT 'open' CHECK (resolution_status IN ('open', 'under_investigation', 'resolved', 'waived')),
    resolved_by_staff_id    UUID REFERENCES staff_profile(id),
    resolved_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Live Telemetry: GPS, heading, and Reefer cold-chain temperature logs
CREATE TABLE IF NOT EXISTS vehicle_telemetry (
    id                      BIGSERIAL PRIMARY KEY,
    vehicle_id              UUID NOT NULL REFERENCES vehicle(id),
    trip_id                 UUID REFERENCES trip(id),
    timestamp               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
    id                      UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    batch_id                TEXT NOT NULL UNIQUE,          -- Client UUID 'batch-...'
    client_id               TEXT NOT NULL,                 -- Device fingerprint / PWA ID
    staff_id                UUID REFERENCES staff_profile(id),
    total_mutations         INT NOT NULL,
    processed_count         INT NOT NULL DEFAULT 0,
    failed_count            INT NOT NULL DEFAULT 0,
    client_started_at       TIMESTAMPTZ NOT NULL,
    client_completed_at     TIMESTAMPTZ NOT NULL,
    server_received_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status                  TEXT NOT NULL CHECK (status IN ('processing', 'success', 'partial_error', 'failed')),
    error_summary           TEXT
);

-- Sync Mutation Audit: Idempotent replay preventing duplicate state execution
CREATE TABLE IF NOT EXISTS sync_mutation_audit_log (
    id                      UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    batch_id                TEXT NOT NULL REFERENCES sync_batch_log(batch_id) ON DELETE CASCADE,
    idempotency_key         TEXT NOT NULL UNIQUE,          -- Generated on mobile client
    entity_name             TEXT NOT NULL,                 -- 'checklist_item', 'telemetry', 'pod', 'discrepancy'
    entity_id               TEXT NOT NULL,
    action                  TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
    payload_json            JSONB NOT NULL,
    before_snapshot         JSONB,
    client_timestamp        TIMESTAMPTZ NOT NULL,
    server_timestamp        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status                  TEXT NOT NULL CHECK (status IN ('applied', 'duplicate_ignored', 'conflict_resolved', 'failed')),
    error_message           TEXT
);

-- ============================================================
-- 7. High-Performance Indices
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_staff_role_depot ON staff_profile(role, depot_id);
CREATE INDEX IF NOT EXISTS idx_staff_outlet ON staff_profile(outlet_id);
CREATE INDEX IF NOT EXISTS idx_price_list_lookup ON price_list(item_id, effective_from, effective_to, is_active);
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

-- ============================================================
-- 8. Automated Database Triggers & Business Logic Functions
-- ============================================================

-- Function: Automatically update updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers to mutable tables
CREATE OR REPLACE TRIGGER trg_depot_updated_at BEFORE UPDATE ON depot FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE OR REPLACE TRIGGER trg_brand_updated_at BEFORE UPDATE ON brand FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE OR REPLACE TRIGGER trg_outlet_updated_at BEFORE UPDATE ON outlet FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE OR REPLACE TRIGGER trg_item_updated_at BEFORE UPDATE ON item FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE OR REPLACE TRIGGER trg_price_list_updated_at BEFORE UPDATE ON price_list FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE OR REPLACE TRIGGER trg_staff_profile_updated_at BEFORE UPDATE ON staff_profile FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE OR REPLACE TRIGGER trg_vehicle_updated_at BEFORE UPDATE ON vehicle FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE OR REPLACE TRIGGER trg_customer_order_updated_at BEFORE UPDATE ON customer_order FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE OR REPLACE TRIGGER trg_trip_updated_at BEFORE UPDATE ON trip FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE OR REPLACE TRIGGER trg_loading_checklist_updated_at BEFORE UPDATE ON loading_checklist_item FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- Function: Auto-lock item price from active price_list upon order placement
CREATE OR REPLACE FUNCTION fn_auto_lock_order_item_price()
RETURNS TRIGGER AS $$
DECLARE
    v_active_price NUMERIC(10,2);
BEGIN
    IF NEW.unit_price IS NULL OR NEW.unit_price <= 0.00 THEN
        SELECT unit_price INTO v_active_price
        FROM v_active_price_list
        WHERE item_id = NEW.item_id;

        IF v_active_price IS NOT NULL THEN
            NEW.unit_price := v_active_price;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_order_item_auto_price
BEFORE INSERT ON order_item
FOR EACH ROW EXECUTE FUNCTION fn_auto_lock_order_item_price();

-- Function: Recompute Trip Distance and Duration when route legs change
CREATE OR REPLACE FUNCTION fn_sync_trip_metrics()
RETURNS TRIGGER AS $$
DECLARE
    v_trip_id UUID;
    v_total_dist NUMERIC(8,2);
    v_total_dur NUMERIC(6,2);
BEGIN
    v_trip_id := COALESCE(NEW.trip_id, OLD.trip_id);
    
    SELECT 
        COALESCE(SUM(distance_km), 0.0),
        COALESCE(SUM(planned_travel_duration_min), 0.0)
    INTO v_total_dist, v_total_dur
    FROM route_leg
    WHERE trip_id = v_trip_id;

    UPDATE trip
    SET total_distance_km = v_total_dist,
        total_trip_duration_min = v_total_dur + outbound_travel_min + total_handling_min
    WHERE id = v_trip_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_route_leg_sync_trip
AFTER INSERT OR UPDATE OR DELETE ON route_leg
FOR EACH ROW EXECUTE FUNCTION fn_sync_trip_metrics();

-- Function: Automatically flag cold-chain breach (> 4.0°C) from live telematics
CREATE OR REPLACE FUNCTION fn_telemetry_cold_chain_guard()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reefer_temp_celsius IS NOT NULL AND NEW.reefer_temp_celsius > 4.00 AND NEW.trip_id IS NOT NULL THEN
        -- Insert automated temperature breach discrepancy if not already flagged in last 30 minutes
        IF NOT EXISTS (
            SELECT 1 FROM discrepancy_report 
            WHERE trip_id = NEW.trip_id 
              AND discrepancy_type = 'temp_breach' 
              AND reported_at >= NOW() - INTERVAL '30 minutes'
        ) THEN
            INSERT INTO discrepancy_report (
                trip_id,
                order_id,
                discrepancy_type,
                reported_by_staff_id,
                reported_at,
                description,
                resolution_status
            )
            SELECT 
                NEW.trip_id,
                rl.order_id,
                'temp_breach',
                t.driver_id,
                NOW(),
                'AUTOMATED TELEMETRY ALERT: Reefer cargo temperature breached threshold at ' || NEW.reefer_temp_celsius || '°C (Limit: 4.0°C)',
                'open'
            FROM trip t
            LEFT JOIN route_leg rl ON rl.trip_id = t.id
            WHERE t.id = NEW.trip_id
            LIMIT 1;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_telemetry_cold_chain_alert
AFTER INSERT ON vehicle_telemetry
FOR EACH ROW EXECUTE FUNCTION fn_telemetry_cold_chain_guard();

-- Function: Increment Driver completed trips counter upon Trip completion
CREATE OR REPLACE FUNCTION fn_driver_trip_completed_counter()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE staff_profile
        SET total_completed_trips = total_completed_trips + 1
        WHERE id = NEW.driver_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_trip_driver_stats
AFTER UPDATE ON trip
FOR EACH ROW EXECUTE FUNCTION fn_driver_trip_completed_counter();
