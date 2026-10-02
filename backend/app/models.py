"""Re-exports entities, schemas, and enums for backward compatibility."""

from app.entities.base import BaseEntity, utc_now
from app.entities.depot import Depot
from app.entities.district import District
from app.entities.user import User
from app.enums.roles import RoleType, UserType
from app.schemas.depot import DepotCreate, DepotRead, DepotUpdate
from app.schemas.district import DistrictCreate, DistrictRead, DistrictUpdate
from app.schemas.user import UserCreate, UserRead, UserUpdate

__all__ = [
    "BaseEntity",
    "Depot",
    "DepotCreate",
    "DepotRead",
    "DepotUpdate",
    "District",
    "DistrictCreate",
    "DistrictRead",
    "DistrictUpdate",
    "RoleType",
    "User",
    "UserCreate",
    "UserRead",
    "UserType",
    "UserUpdate",
    "utc_now",
]
