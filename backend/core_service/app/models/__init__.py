"""Import all domain models to register their metadata with Base."""

from app.models.order import OrderModel  # noqa: F401
from app.models.outlet import OutletModel  # noqa: F401
from app.models.route import RouteModel  # noqa: F401
from app.models.service_allowance import ServiceAllowanceModel  # noqa: F401
from app.models.vehicle import VehicleModel  # noqa: F401
from app.models.dispatch import LiveTripModel  # noqa: F401
from app.models.driver import DriverModel  # noqa: F401
from app.models.audit import DispatchAuditLogModel  # noqa: F401
from app.entities.user import User  # noqa: F401
from app.entities.base import BaseEntity  # noqa: F401
from app.enums.roles import RoleType, UserType  # noqa: F401
from app.schemas.user import UserCreate, UserRead, UserUpdate  # noqa: F401

__all__ = [
    "OrderModel",
    "OutletModel",
    "RouteModel",
    "ServiceAllowanceModel",
    "VehicleModel",
    "LiveTripModel",
    "DriverModel",
    "DispatchAuditLogModel",
    "BaseEntity",
    "User",
    "RoleType",
    "UserType",
    "UserCreate",
    "UserRead",
    "UserUpdate",
]
