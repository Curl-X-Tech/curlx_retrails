"""
Data Provider for Planning Engine Service.

Fetches master data (Outlets, Routes, Vehicles, Service Allowances) and Orders
required for fleet allocation and VRPTW scheduling.

Strategy:
1. Calls downstream microservices via HTTP (microservice boundary compliance).
2. If HTTP service is unreachable, falls back to direct PostgreSQL query on localhost:5432.
3. If database table is empty, falls back to data/*.csv files.
"""

from __future__ import annotations

import csv
import datetime
from datetime import date, timezone
import os
from pathlib import Path
from typing import Any

import asyncpg
import httpx

from app.domain.Order import Order
from app.domain.Outlet import Outlet
from app.domain.Route import Route
from app.domain.Vehicle import Vehicle
from app.domain.Service_allowance import ServiceAllowance
from app.core.config import get_settings

DATA_DIR = Path(os.getenv("DATA_DIR", "data"))
settings = get_settings()

DB_USER = os.getenv("POSTGRES_USER", "waypoint")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "waypoint")
DB_HOST = os.getenv("POSTGRES_HOST", "127.0.0.1")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")


def _now() -> datetime.datetime:
    return datetime.datetime.now(timezone.utc).replace(tzinfo=None)


async def _db_fetch(db_name: str, query: str, *args) -> list[dict[str, Any]]:
    try:
        conn = await asyncpg.connect(user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT, database=db_name)
        try:
            records = await conn.fetch(query, *args)
            return [dict(r) for r in records]
        finally:
            await conn.close()
    except Exception as e:
        print(f"[data-provider] DB query error on {db_name}: {e}")
        return []


# ── Outlets ───────────────────────────────────────────────────────────────── #


async def fetch_outlets() -> list[Outlet]:
    """Fetch all active outlets."""
    data = []
    # 1. Try HTTP
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{settings.CORE_SERVICE_URL}/outlets/v1/outlets?limit=500")
            if resp.status_code == 200:
                data = resp.json().get("items", [])
    except Exception:
        pass

    # 2. Fallback to DB
    if not data:
        data = await _db_fetch("general_db", 'SELECT * FROM outlets WHERE "IsActive" = true;')

    # 3. Fallback to CSV
    if not data:
        csv_path = DATA_DIR / "outlets.csv"
        if csv_path.exists():
            with open(csv_path, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for r in reader:
                    data.append(
                        {
                            "ID": r["outlet_id"],
                            "brand": r["brand"],
                            "district": r["district"],
                            "depot": r["depot"],
                            "dock_type": r["dock_type"],
                            "parking_constraint": r["parking_constraint"],
                            "mall_window": r.get("mall_window"),
                            "window_open_time": r.get("window_open_time", "07:00"),
                            "window_close_time": r.get("window_close_time", "17:00"),
                            "CreateTime": _now(),
                            "UpdateTime": _now(),
                            "CreatedBy": "SYSTEM",
                            "UpdatedBy": "SYSTEM",
                            "IsActive": True,
                        }
                    )

    outlets = []
    for r in data:
        outlets.append(
            Outlet(
                ID=r.get("ID") or r.get("outlet_id"),
                CreateTime=r.get("CreateTime", _now()),
                UpdateTime=r.get("UpdateTime", _now()),
                CreatedBy=r.get("CreatedBy", "SYSTEM"),
                UpdatedBy=r.get("UpdatedBy", "SYSTEM"),
                IsActive=bool(r.get("IsActive", True)),
                brand=r["brand"],
                district=r["district"],
                depot=r["depot"],
                dock_type=r["dock_type"],
                parking_constraint=r["parking_constraint"],
                mall_window=r.get("mall_window"),
                window_open_time=str(r.get("window_open_time", "07:00"))[:5],
                window_close_time=str(r.get("window_close_time", "17:00"))[:5],
            )
        )
    return outlets


# ── Routes ────────────────────────────────────────────────────────────────── #


async def fetch_routes() -> list[Route]:
    """Fetch all active routes."""
    data = []
    # 1. Try HTTP
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{settings.CORE_SERVICE_URL}/routes/v1/routes?limit=500")
            if resp.status_code == 200:
                data = resp.json().get("items", [])
    except Exception:
        pass

    # 2. Fallback to DB
    if not data:
        data = await _db_fetch("general_db", 'SELECT * FROM routes WHERE "IsActive" = true;')

    # 3. Fallback to CSV
    if not data:
        csv_path = DATA_DIR / "district_travel.csv"
        if csv_path.exists():
            with open(csv_path, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for r in reader:
                    depot_km = float(r["depot_to_district_km"])
                    speed = float(r["free_flow_kmh"])
                    depot_min = (depot_km / speed) * 60.0
                    data.append(
                        {
                            "ID": f"{r['depot']}_{r['district']}",
                            "district": r["district"],
                            "depot": r["depot"],
                            "road_class": r["road_class"],
                            "free_flow_kmh": speed,
                            "depot_to_district_km": depot_km,
                            "depot_to_district_freeflow_min": depot_min,
                            "inter_stop_km": float(r.get("inter_stop_km", 5.0)),
                            "inter_stop_freeflow_min": float(r.get("inter_stop_freeflow_min", 15.0)),
                            "CreateTime": _now(),
                            "UpdateTime": _now(),
                            "CreatedBy": "SYSTEM",
                            "UpdatedBy": "SYSTEM",
                            "IsActive": True,
                        }
                    )

    routes = []
    for r in data:
        depot_km = float(r.get("depot_to_district_km", 20.0))
        speed = float(r.get("free_flow_kmh", 40.0))
        depot_min = float(r.get("depot_to_district_freeflow_min") or ((depot_km / speed) * 60.0))
        inter_stop_km = float(r.get("inter_stop_km", 5.0))
        inter_stop_min = float(r.get("inter_stop_freeflow_min") or ((inter_stop_km / speed) * 60.0))

        routes.append(
            Route(
                ID=r["ID"],
                CreateTime=r.get("CreateTime", _now()),
                UpdateTime=r.get("UpdateTime", _now()),
                CreatedBy=r.get("CreatedBy", "SYSTEM"),
                UpdatedBy=r.get("UpdatedBy", "SYSTEM"),
                IsActive=bool(r.get("IsActive", True)),
                district=r["district"],
                depot=r["depot"],
                road_class=r["road_class"],
                free_flow_kmh=speed,
                depot_to_district_km=depot_km,
                depot_to_district_freeflow_min=depot_min,
                inter_stop_km=inter_stop_km,
                inter_stop_freeflow_min=inter_stop_min,
            )
        )
    return routes


# ── Service Allowances ────────────────────────────────────────────────────── #


async def fetch_service_allowances() -> list[ServiceAllowance]:
    """Fetch all active service allowances."""
    data = []
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{settings.CORE_SERVICE_URL}/routes/v1/service-allowances?limit=500")
            if resp.status_code == 200:
                data = resp.json().get("items", [])
    except Exception:
        pass

    if not data:
        data = await _db_fetch("general_db", 'SELECT * FROM service_allowances WHERE "IsActive" = true;')

    if not data:
        csv_path = DATA_DIR / "service_allowance.csv"
        if csv_path.exists():
            with open(csv_path, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for r in reader:
                    data.append(
                        {
                            "ID": f"{r['brand']}_{r['dock_type']}",
                            "brand": r["brand"],
                            "dock_type": r["dock_type"],
                            "service_allowance_min": float(r["service_allowance_min"]),
                            "CreateTime": _now(),
                            "UpdateTime": _now(),
                            "CreatedBy": "SYSTEM",
                            "UpdatedBy": "SYSTEM",
                            "IsActive": True,
                        }
                    )

    return [
        ServiceAllowance(
            ID=r["ID"],
            CreateTime=r.get("CreateTime", _now()),
            UpdateTime=r.get("UpdateTime", _now()),
            CreatedBy=r.get("CreatedBy", "SYSTEM"),
            UpdatedBy=r.get("UpdatedBy", "SYSTEM"),
            IsActive=bool(r.get("IsActive", True)),
            brand=r["brand"],
            dock_type=r["dock_type"],
            service_allowance_min=float(r["service_allowance_min"]),
        )
        for r in data
    ]


# ── Vehicles ──────────────────────────────────────────────────────────────── #


async def fetch_vehicles() -> list[Vehicle]:
    """Fetch all active vehicles."""
    data = []
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{settings.CORE_SERVICE_URL}/vehicles/v1/vehicles?limit=500")
            if resp.status_code == 200:
                data = resp.json().get("items", [])
    except Exception:
        pass

    if not data:
        data = await _db_fetch("general_db", 'SELECT * FROM vehicles WHERE "IsActive" = true;')

    if not data:
        csv_path = DATA_DIR / "vehicles.csv"
        if csv_path.exists():
            with open(csv_path, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for r in reader:
                    data.append(
                        {
                            "ID": r["vehicle_id"],
                            "type": r["vehicle_type"],
                            "temp_condition": r["temp_condition"],
                            "weight_cap_kg": float(r["weight_capacity"]),
                            "volume_cap_m3": float(r["volume_cap_m3"]),
                            "fuel_type": r.get("fuel_type", "diesel"),
                            "km_per_l": float(r["km_per_l"]),
                            "weekly_fuel_quota": float(r["weekly_fuel_quota"]),
                            "depot": r["depot"],
                            "service_milage": float(r.get("service_milage", 0.0) or 0.0),
                            "CreateTime": _now(),
                            "UpdateTime": _now(),
                            "CreatedBy": "SYSTEM",
                            "UpdatedBy": "SYSTEM",
                            "IsActive": True,
                        }
                    )

    vehicles = []
    for r in data:
        vehicles.append(
            Vehicle(
                ID=r.get("ID") or r.get("vehicle_id"),
                CreateTime=r.get("CreateTime", _now()),
                UpdateTime=r.get("UpdateTime", _now()),
                CreatedBy=r.get("CreatedBy", "SYSTEM"),
                UpdatedBy=r.get("UpdatedBy", "SYSTEM"),
                IsActive=bool(r.get("IsActive", True)),
                type=r["type"],
                temp_condition=r["temp_condition"],
                weight_cap_kg=float(r["weight_cap_kg"]),
                volume_cap_m3=float(r["volume_cap_m3"]),
                fuel_type=r.get("fuel_type", "diesel"),
                km_per_l=float(r["km_per_l"]),
                weekly_fuel_quota=float(r["weekly_fuel_quota"]),
                depot=r["depot"],
                service_milage=float(r.get("service_milage", 0.0) or 0.0),
            )
        )
    return vehicles


# ── Orders ────────────────────────────────────────────────────────────────── #


async def fetch_orders(
    order_ids: list[str] | None = None,
    planning_date: date | None = None,
) -> list[Order]:
    """Fetch orders matching order_ids or planning_date."""
    data = []
    # 1. Try DB first for specific order_ids
    if order_ids:
        query = 'SELECT * FROM orders WHERE "ID" = ANY($1) AND "IsActive" = true;'
        data = await _db_fetch("general_db", query, order_ids)
    elif planning_date:
        query = 'SELECT * FROM orders WHERE order_date = $1 AND "IsActive" = true;'
        data = await _db_fetch("general_db", query, planning_date)
    else:
        query = 'SELECT * FROM orders WHERE "IsActive" = true LIMIT 150;'
        data = await _db_fetch("general_db", query)

    # 2. Try HTTP if DB returned none
    if not data:
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                params = {"limit": 500}
                if planning_date:
                    params["order_date"] = planning_date.isoformat()
                resp = await client.get(f"{settings.CORE_SERVICE_URL}/orders/v1/orders", params=params)
                if resp.status_code == 200:
                    items = resp.json().get("items", [])
                    if order_ids:
                        target_set = set(order_ids)
                        data = [i for i in items if i["ID"] in target_set]
                    else:
                        data = items
        except Exception:
            pass

    orders = []
    for r in data:
        ot = r["order_time"]
        if hasattr(ot, "strftime"):
            ot_str = ot.strftime("%H:%M")
        else:
            ot_str = str(ot)[:5]

        od = r["order_date"]
        if isinstance(od, str):
            od = datetime.date.fromisoformat(od)

        orders.append(
            Order(
                ID=r["ID"],
                CreateTime=r.get("CreateTime", _now()),
                UpdateTime=r.get("UpdateTime", _now()),
                CreatedBy=r.get("CreatedBy", "SYSTEM"),
                UpdatedBy=r.get("UpdatedBy", "SYSTEM"),
                IsActive=bool(r.get("IsActive", True)),
                outlet_id=r["outlet_id"],
                order_date=od,
                order_time=ot_str,
                weight_kg=float(r["weight_kg"]),
                volume_m3=float(r["volume_m3"]),
                temp_condition=str(r["temp_condition"]),
            )
        )
    return orders
