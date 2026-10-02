"""Re-exports entities, schemas, and enums for backward compatibility."""

from app.entities.base import BaseEntity, utc_now
from app.entities.brand import Brand
from app.entities.depot import Depot
from app.entities.district import District
from app.entities.outlet import Outlet
from app.entities.user import User
from app.enums.master import DeliveryWindowType, DockType, ParkingConstraint
from app.enums.roles import RoleType, UserType
from app.schemas.brand import BrandCreate, BrandRead, BrandUpdate
from app.schemas.depot import DepotCreate, DepotRead, DepotUpdate
from app.schemas.district import DistrictCreate, DistrictRead, DistrictUpdate
from app.schemas.outlet import OutletCreate, OutletRead, OutletUpdate
from app.schemas.user import UserCreate, UserRead, UserUpdate

__all__ = [
    "BaseEntity",
    "Brand",
    "BrandCreate",
    "BrandRead",
    "BrandUpdate",
    "DeliveryWindowType",
    "Depot",
    "DepotCreate",
    "DepotRead",
    "DepotUpdate",
    "District",
    "DistrictCreate",
    "DistrictRead",
    "DistrictUpdate",
    "DockType",
    "Outlet",
    "OutletCreate",
    "OutletRead",
    "OutletUpdate",
    "ParkingConstraint",
    "RoleType",
    "User",
    "UserCreate",
    "UserRead",
    "UserType",
    "UserUpdate",
    "utc_now",
]
