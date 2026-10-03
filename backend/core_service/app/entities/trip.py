import uuid
from datetime import date, datetime, time
from typing import Any

from sqlalchemy import UniqueConstraint
from sqlmodel import Field

from app.entities.base import BaseEntity


class Trip(BaseEntity, table=True):
    """Dispatch trip: one vehicle run for a single brand and district."""

    __tablename__ = "trip"
    __table_args__ = (UniqueConstraint("dispatch_date", "vehicle_id", "trip_sequence"),)

    trip_code: str = Field(unique=True, index=True, nullable=False)
    dispatch_date: date = Field(nullable=False, index=True)
    trip_sequence: int = Field(nullable=False)
    vehicle_id: uuid.UUID = Field(foreign_key="vehicle.id", nullable=False, index=True)
    driver_id: uuid.UUID = Field(foreign_key="staff_profile.id", nullable=False, index=True)
    depot_id: uuid.UUID = Field(foreign_key="depot.id", nullable=False, index=True)
    brand_id: uuid.UUID = Field(foreign_key="brand.id", nullable=False)
    district_id: uuid.UUID = Field(foreign_key="district.id", nullable=False)
    seal_number: str | None = Field(default=None, nullable=True)
    status: str = Field(default="scheduled", index=True, nullable=False)
    planned_start_time: datetime | None = Field(default=None, nullable=True)
    actual_start_time: datetime | None = Field(default=None, nullable=True)
    actual_end_time: datetime | None = Field(default=None, nullable=True)
    outbound_travel_min: float = Field(default=0.0, nullable=False)
    inter_stop_travel_min: float = Field(default=0.0, nullable=False)
    total_handling_min: float = Field(default=0.0, nullable=False)
    total_trip_duration_min: float = Field(default=0.0, nullable=False)
    total_distance_km: float = Field(default=0.0, nullable=False)

    def __init__(self, **data: Any):
        super().__init__(**data)


class RouteLeg(BaseEntity, table=True):
    """One stop on a trip with planned and actual timings."""

    __tablename__ = "route_leg"
    __table_args__ = (UniqueConstraint("trip_id", "seq"),)

    leg_id: str = Field(unique=True, index=True, nullable=False)
    trip_id: uuid.UUID = Field(foreign_key="trip.id", nullable=False, index=True, ondelete="CASCADE")
    seq: int = Field(nullable=False)
    from_point: str = Field(nullable=False)
    to_outlet_id: uuid.UUID = Field(foreign_key="outlet.id", nullable=False, index=True)
    order_id: uuid.UUID | None = Field(default=None, foreign_key="customer_order.id", index=True)
    distance_km: float = Field(nullable=False)
    planned_depart_time: time = Field(nullable=False)
    planned_travel_duration_min: float = Field(nullable=False)
    planned_arrival_time: time = Field(nullable=False)
    actual_depart_time: datetime | None = Field(default=None, nullable=True)
    actual_travel_duration_min: float | None = Field(default=None, nullable=True)
    arrival_time: datetime | None = Field(default=None, nullable=True)
    leave_outlet_time: datetime | None = Field(default=None, nullable=True)
    status: str = Field(default="pending", nullable=False)
    is_post_dispatch_added: bool = Field(default=False, nullable=False)
    sealed_at: datetime | None = Field(default=None, nullable=True)
    sealed_by_staff_id: uuid.UUID | None = Field(default=None, nullable=True)

    def __init__(self, **data: Any):
        super().__init__(**data)


class LoadingChecklistItem(BaseEntity, table=True):
    """Pre-departure verification of one order item on a trip."""

    __tablename__ = "loading_checklist_item"
    __table_args__ = (UniqueConstraint("trip_id", "order_item_id"),)

    trip_id: uuid.UUID = Field(foreign_key="trip.id", nullable=False, index=True, ondelete="CASCADE")
    order_item_id: uuid.UUID = Field(foreign_key="order_item.id", nullable=False, index=True)
    status: str = Field(default="pending", nullable=False)
    scanned_barcode: str | None = Field(default=None, nullable=True)
    verified_by_staff_id: uuid.UUID | None = Field(default=None, nullable=True)
    verified_at: datetime | None = Field(default=None, nullable=True)
    shortfall_qty: int = Field(default=0, nullable=False)
    notes: str | None = Field(default=None, nullable=True)

    def __init__(self, **data: Any):
        super().__init__(**data)


class ProofOfDelivery(BaseEntity, table=True):
    """Signed handover record for a delivered order."""

    __tablename__ = "proof_of_delivery"

    trip_id: uuid.UUID = Field(foreign_key="trip.id", nullable=False, index=True)
    route_leg_id: uuid.UUID = Field(foreign_key="route_leg.id", nullable=False, index=True)
    order_id: uuid.UUID = Field(foreign_key="customer_order.id", nullable=False, index=True)
    outlet_id: uuid.UUID = Field(foreign_key="outlet.id", nullable=False)
    recipient_name: str = Field(nullable=False)
    recipient_phone: str | None = Field(default=None, nullable=True)
    signature_svg: str = Field(nullable=False)
    arrived_at: datetime = Field(nullable=False)
    delivered_at: datetime = Field(nullable=False)
    delivery_lat: float | None = Field(default=None, nullable=True)
    delivery_lng: float | None = Field(default=None, nullable=True)
    temperature_reading: float | None = Field(default=None, nullable=True)
    photo_evidence_url: str | None = Field(default=None, nullable=True)
    is_offline_synced: bool = Field(default=False, nullable=False)

    def __init__(self, **data: Any):
        super().__init__(**data)


class DiscrepancyReport(BaseEntity, table=True):
    """Missing, damaged, rejected or temperature-breached goods reported at delivery."""

    __tablename__ = "discrepancy_report"

    trip_id: uuid.UUID = Field(foreign_key="trip.id", nullable=False, index=True)
    order_id: uuid.UUID = Field(foreign_key="customer_order.id", nullable=False, index=True)
    order_item_id: uuid.UUID | None = Field(default=None, foreign_key="order_item.id")
    pod_id: uuid.UUID | None = Field(default=None, foreign_key="proof_of_delivery.id")
    discrepancy_type: str = Field(nullable=False)
    reported_qty: int | None = Field(default=None, nullable=True)
    reported_by_staff_id: uuid.UUID = Field(nullable=False)
    reported_at: datetime = Field(nullable=False)
    description: str = Field(default="", nullable=False)
    photo_url: str | None = Field(default=None, nullable=True)
    resolution_status: str = Field(default="open", nullable=False)

    def __init__(self, **data: Any):
        super().__init__(**data)


class VehicleTelemetry(BaseEntity, table=True):
    """GPS, heading and cold-chain readings reported by a vehicle."""

    __tablename__ = "vehicle_telemetry"

    vehicle_id: uuid.UUID = Field(foreign_key="vehicle.id", nullable=False, index=True)
    trip_id: uuid.UUID | None = Field(default=None, foreign_key="trip.id", index=True)
    recorded_at: datetime = Field(nullable=False, index=True)
    latitude: float = Field(nullable=False)
    longitude: float = Field(nullable=False)
    speed_kmh: float = Field(default=0.0, nullable=False)
    heading_deg: float = Field(default=0.0, nullable=False)
    reefer_temp_celsius: float | None = Field(default=None, nullable=True)
    ambient_temp_celsius: float | None = Field(default=None, nullable=True)
    fuel_level_pct: float | None = Field(default=None, nullable=True)
    battery_pct: float | None = Field(default=None, nullable=True)
    idempotency_key: str | None = Field(default=None, unique=True, nullable=True)

    def __init__(self, **data: Any):
        super().__init__(**data)
