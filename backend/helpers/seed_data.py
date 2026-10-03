"""
Waypoint Group — Seed Existing Data into PostgreSQL.

Seeds:
- data/vehicles.csv          ──► general_db (vehicles table)
- data/outlets.csv           ──► general_db (outlets table)
- data/district_travel.csv   ──► general_db (routes table)
- data/service_allowance.csv ──► general_db (service_allowances table)
"""

import asyncio
import csv
from datetime import datetime, timezone
import os
import sys

import asyncpg
from sqlalchemy import text

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
CORE_SERVICE_DIR = os.path.join(BACKEND_DIR, "core_service")
DATA_DIR = os.path.join(PROJECT_ROOT, "data")

DB_USER = os.getenv("POSTGRES_USER", "waypoint")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "waypoint")
DB_HOST = os.getenv("POSTGRES_HOST", "127.0.0.1")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")


def _clear_app_modules():
    for k in list(sys.modules.keys()):
        if k == "app" or k.startswith("app."):
            del sys.modules[k]


async def ensure_databases():
    """Ensure general_db and planning_db exist on the PostgreSQL server."""
    target_dbs = ["general_db", "planning_db"]

    conn = None
    for default_db in ["waypoint", "postgres"]:
        try:
            conn = await asyncpg.connect(
                user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT, database=default_db
            )
            break
        except Exception:
            continue

    if not conn:
        raise ConnectionError(f"Could not connect to PostgreSQL on {DB_HOST}:{DB_PORT} as {DB_USER}")

    try:
        existing_rows = await conn.fetch("SELECT datname FROM pg_database WHERE datistemplate = false;")
        existing_dbs = {r["datname"] for r in existing_rows}

        for db_name in target_dbs:
            if db_name not in existing_dbs:
                print(f"[Postgres] Creating database: {db_name}")
                await conn.execute(f'CREATE DATABASE "{db_name}" OWNER "{DB_USER}";')
            else:
                print(f"[Postgres] Database '{db_name}' ready.")
    finally:
        await conn.close()


async def seed_vehicles():
    """Seed vehicles.csv into general_db."""
    csv_file = os.path.join(DATA_DIR, "vehicles.csv")
    if not os.path.exists(csv_file):
        print(f"[Vehicles] File not found: {csv_file}")
        return

    _clear_app_modules()
    if CORE_SERVICE_DIR not in sys.path:
        sys.path.insert(0, CORE_SERVICE_DIR)
    from app.core.database import Base, engine
    import app.models.vehicle  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    records = []
    with open(csv_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append(
                {
                    "ID": row["vehicle_id"],
                    "CreateTime": now,
                    "UpdateTime": now,
                    "CreatedBy": "SYSTEM_SEED",
                    "UpdatedBy": "SYSTEM_SEED",
                    "IsActive": True,
                    "type": row["type"],
                    "temp_condition": row["temp"],
                    "weight_cap_kg": float(row["weight_cap_kg"]),
                    "volume_cap_m3": float(row["volume_cap_m3"]),
                    "fuel_type": row["fuel_type"],
                    "km_per_l": float(row["km_per_l"]),
                    "weekly_fuel_quota": float(row["weekly_fuel_quota"]),
                    "depot": row["depot"],
                    "service_milage": float(row.get("service_milage", 0.0) or 0.0),
                    "trip_count_today": 0,
                    "max_per_day_trip_count": int(row.get("max_per_day_trip_count", 2)),
                }
            )

    async with engine.begin() as conn:
        for r in records:
            stmt = text("""
                INSERT INTO vehicles (
                    "ID", "CreateTime", "UpdateTime", "CreatedBy", "UpdatedBy", "IsActive",
                    "type", "temp_condition", "weight_cap_kg", "volume_cap_m3",
                    "fuel_type", "km_per_l", "weekly_fuel_quota", "depot",
                    "service_milage", "trip_count_today", "max_per_day_trip_count"
                ) VALUES (
                    :ID, :CreateTime, :UpdateTime, :CreatedBy, :UpdatedBy, :IsActive,
                    :type, :temp_condition, :weight_cap_kg, :volume_cap_m3,
                    :fuel_type, :km_per_l, :weekly_fuel_quota, :depot,
                    :service_milage, :trip_count_today, :max_per_day_trip_count
                )
                ON CONFLICT ("ID") DO UPDATE SET
                    "type" = EXCLUDED."type",
                    "temp_condition" = EXCLUDED."temp_condition",
                    "weight_cap_kg" = EXCLUDED."weight_cap_kg",
                    "volume_cap_m3" = EXCLUDED."volume_cap_m3",
                    "fuel_type" = EXCLUDED."fuel_type",
                    "km_per_l" = EXCLUDED."km_per_l",
                    "weekly_fuel_quota" = EXCLUDED."weekly_fuel_quota",
                    "depot" = EXCLUDED."depot",
                    "service_milage" = EXCLUDED."service_milage",
                    "UpdateTime" = EXCLUDED."UpdateTime";
            """)
            await conn.execute(stmt, r)

    print(f"[Vehicles] Successfully seeded {len(records)} vehicles into general_db.")
    await engine.dispose()
    _clear_app_modules()


async def seed_outlets():
    """Seed outlets.csv into general_db."""
    csv_file = os.path.join(DATA_DIR, "outlets.csv")
    if not os.path.exists(csv_file):
        print(f"[Outlets] File not found: {csv_file}")
        return

    _clear_app_modules()
    if CORE_SERVICE_DIR not in sys.path:
        sys.path.insert(0, CORE_SERVICE_DIR)
    from app.core.database import Base, engine
    import app.models.outlet  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    records = []
    with open(csv_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            mall_window = row.get("mall_window")
            if not mall_window or mall_window.strip() == "":
                mall_window = None

            records.append(
                {
                    "ID": row["outlet_id"],
                    "CreateTime": now,
                    "UpdateTime": now,
                    "CreatedBy": "SYSTEM_SEED",
                    "UpdatedBy": "SYSTEM_SEED",
                    "IsActive": True,
                    "brand": row["brand"],
                    "district": row["district"],
                    "depot": row["depot"],
                    "dock_type": row["dock_type"],
                    "parking_constraint": row["parking_constraint"],
                    "mall_window": mall_window,
                    "window_open_time": row["window_open_time"],
                    "window_close_time": row["window_close_time"],
                }
            )

    async with engine.begin() as conn:
        for r in records:
            stmt = text("""
                INSERT INTO outlets (
                    "ID", "CreateTime", "UpdateTime", "CreatedBy", "UpdatedBy", "IsActive",
                    "brand", "district", "depot", "dock_type", "parking_constraint",
                    "mall_window", "window_open_time", "window_close_time"
                ) VALUES (
                    :ID, :CreateTime, :UpdateTime, :CreatedBy, :UpdatedBy, :IsActive,
                    :brand, :district, :depot, :dock_type, :parking_constraint,
                    :mall_window, :window_open_time, :window_close_time
                )
                ON CONFLICT ("ID") DO UPDATE SET
                    "brand" = EXCLUDED."brand",
                    "district" = EXCLUDED."district",
                    "depot" = EXCLUDED."depot",
                    "dock_type" = EXCLUDED."dock_type",
                    "parking_constraint" = EXCLUDED."parking_constraint",
                    "mall_window" = EXCLUDED."mall_window",
                    "window_open_time" = EXCLUDED."window_open_time",
                    "window_close_time" = EXCLUDED."window_close_time",
                    "UpdateTime" = EXCLUDED."UpdateTime";
            """)
            await conn.execute(stmt, r)

    print(f"[Outlets] Successfully seeded {len(records)} outlets into general_db.")
    await engine.dispose()
    _clear_app_modules()


async def seed_routes_and_allowances():
    """Seed district_travel.csv and service_allowance.csv into general_db."""
    _clear_app_modules()
    if CORE_SERVICE_DIR not in sys.path:
        sys.path.insert(0, CORE_SERVICE_DIR)
    from app.core.database import Base, engine
    import app.models.route  # noqa: F401
    import app.models.service_allowance  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # 1. Routes
    routes_csv = os.path.join(DATA_DIR, "district_travel.csv")
    route_records = []
    if os.path.exists(routes_csv):
        with open(routes_csv, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                route_records.append(
                    {
                        "ID": f"{row['depot']}_{row['district']}",
                        "CreateTime": now,
                        "UpdateTime": now,
                        "CreatedBy": "SYSTEM_SEED",
                        "UpdatedBy": "SYSTEM_SEED",
                        "IsActive": True,
                        "district": row["district"],
                        "depot": row["depot"],
                        "road_class": row["road_class"],
                        "free_flow_kmh": float(row["free_flow_kmh"]),
                        "depot_to_district_km": float(row["depot_to_district_km"]),
                        "depot_to_district_freeflow_min": float(row["depot_to_district_freeflow_min"]),
                        "inter_stop_km": float(row["inter_stop_km"]),
                        "inter_stop_freeflow_min": float(row["inter_stop_freeflow_min"]),
                    }
                )

    async with engine.begin() as conn:
        for r in route_records:
            stmt = text("""
                INSERT INTO routes (
                    "ID", "CreateTime", "UpdateTime", "CreatedBy", "UpdatedBy", "IsActive",
                    "district", "depot", "road_class", "free_flow_kmh",
                    "depot_to_district_km", "depot_to_district_freeflow_min",
                    "inter_stop_km", "inter_stop_freeflow_min"
                ) VALUES (
                    :ID, :CreateTime, :UpdateTime, :CreatedBy, :UpdatedBy, :IsActive,
                    :district, :depot, :road_class, :free_flow_kmh,
                    :depot_to_district_km, :depot_to_district_freeflow_min,
                    :inter_stop_km, :inter_stop_freeflow_min
                )
                ON CONFLICT ("ID") DO UPDATE SET
                    "road_class" = EXCLUDED."road_class",
                    "free_flow_kmh" = EXCLUDED."free_flow_kmh",
                    "depot_to_district_km" = EXCLUDED."depot_to_district_km",
                    "depot_to_district_freeflow_min" = EXCLUDED."depot_to_district_freeflow_min",
                    "inter_stop_km" = EXCLUDED."inter_stop_km",
                    "inter_stop_freeflow_min" = EXCLUDED."inter_stop_freeflow_min",
                    "UpdateTime" = EXCLUDED."UpdateTime";
            """)
            await conn.execute(stmt, r)
        print(f"[Routes] Successfully seeded {len(route_records)} routes into general_db.")

    # 2. Service Allowances
    sa_csv = os.path.join(DATA_DIR, "service_allowance.csv")
    sa_records = []
    if os.path.exists(sa_csv):
        with open(sa_csv, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                sa_records.append(
                    {
                        "ID": f"{row['brand']}_{row['dock_type']}",
                        "CreateTime": now,
                        "UpdateTime": now,
                        "CreatedBy": "SYSTEM_SEED",
                        "UpdatedBy": "SYSTEM_SEED",
                        "IsActive": True,
                        "brand": row["brand"],
                        "dock_type": row["dock_type"],
                        "service_allowance_min": float(row["service_allowance_min"]),
                    }
                )

    async with engine.begin() as conn:
        for r in sa_records:
            stmt = text("""
                INSERT INTO service_allowances (
                    "ID", "CreateTime", "UpdateTime", "CreatedBy", "UpdatedBy", "IsActive",
                    "brand", "dock_type", "service_allowance_min"
                ) VALUES (
                    :ID, :CreateTime, :UpdateTime, :CreatedBy, :UpdatedBy, :IsActive,
                    :brand, :dock_type, :service_allowance_min
                )
                ON CONFLICT ("ID") DO UPDATE SET
                    "service_allowance_min" = EXCLUDED."service_allowance_min",
                    "UpdateTime" = EXCLUDED."UpdateTime";
            """)
            await conn.execute(stmt, r)
        print(f"[ServiceAllowances] Successfully seeded {len(sa_records)} service allowances into general_db.")

    await engine.dispose()
    _clear_app_modules()


async def main():
    print("=" * 60)
    print("Starting Waypoint Data Seeder (Vehicles, Outlets, Routes, Allowances)")
    print("=" * 60)
    await ensure_databases()
    await seed_vehicles()
    await seed_outlets()
    await seed_routes_and_allowances()
    print("=" * 60)
    print("Database seeding completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
