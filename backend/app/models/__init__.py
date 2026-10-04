"""
Re-exports entities, operational models, schemas, and enums for backward compatibility.
"""

from app.entities.base import BaseEntity, utc_now
from app.entities.brand import Brand
from app.entities.calendar_day import CalendarDay
from app.entities.depot import Depot
from app.entities.district import District
from app.entities.item import Item
from app.entities.outlet import Outlet
from app.entities.price_list import PriceList
from app.entities.user import User
from app.enums.master import DeliveryWindowType, DockType, ParkingConstraint
from app.enums.roles import RoleType, UserType
from app.models.audit import DispatchAuditLogModel
from app.models.dispatch import LiveTripModel
from app.models.driver import DriverModel
from app.models.order import OrderModel
from app.models.route import RouteModel
from app.models.service_allowance import ServiceAllowanceModel
from app.models.vehicle import VehicleModel
from app.schemas.brand import BrandCreate, BrandRead, BrandUpdate
from app.schemas.calendar_day import (
    CalendarDayCreate,
    CalendarDayRead,
    CalendarDayUpdate,
    DemandSurgeRead,
)
from app.schemas.depot import DepotCreate, DepotRead, DepotUpdate
from app.schemas.district import DistrictCreate, DistrictRead, DistrictUpdate
from app.schemas.item import ItemCreate, ItemRead, ItemUpdate
from app.schemas.outlet import OutletCreate, OutletRead, OutletUpdate
from app.schemas.price_list import (
    ActivePriceRead,
    PriceListCreate,
    PriceListRead,
    PriceListUpdate,
)
from app.schemas.user import UserCreate, UserRead, UserUpdate

__all__ = [
    "ActivePriceRead",
    "BaseEntity",
    "Brand",
    "BrandCreate",
    "BrandRead",
    "BrandUpdate",
    "CalendarDay",
    "CalendarDayCreate",
    "CalendarDayRead",
    "CalendarDayUpdate",
    "DeliveryWindowType",
    "DemandSurgeRead",
    "Depot",
    "DepotCreate",
    "DepotRead",
    "DepotUpdate",
    "DispatchAuditLogModel",
    "District",
    "DistrictCreate",
    "DistrictRead",
    "DistrictUpdate",
    "DockType",
    "DriverModel",
    "Item",
    "ItemCreate",
    "ItemRead",
    "ItemUpdate",
    "LiveTripModel",
    "OrderModel",
    "Outlet",
    "OutletCreate",
    "OutletRead",
    "OutletUpdate",
    "ParkingConstraint",
    "PriceList",
    "PriceListCreate",
    "PriceListRead",
    "PriceListUpdate",
    "RoleType",
    "RouteModel",
    "ServiceAllowanceModel",
    "User",
    "UserCreate",
    "UserRead",
    "UserType",
    "UserUpdate",
    "VehicleModel",
    "utc_now",
]
