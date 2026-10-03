from enum import Enum
from typing import Any


class RoleType(str, Enum):
    STORE_MANAGER = "store_manager"
    DRIVER = "driver"
    LOADER = "loader"
    DISPATCHER = "dispatcher"

    @classmethod
    def _missing_(cls, value: Any) -> Any:
        if isinstance(value, str):
            val_lower = value.strip().lower()
            for member in cls:
                if member.value == val_lower or member.name.lower() == val_lower:
                    return member
        return None


class UserType(str, Enum):
    STORE_MANAGER = "store_manager"
    DRIVER = "driver"
    LOADER = "loader"
    DISPATCHER = "dispatcher"
    SYSTEM_ADMIN = "system_admin"

    @classmethod
    def _missing_(cls, value: Any) -> Any:
        if isinstance(value, str):
            val_lower = value.strip().lower()
            for member in cls:
                if member.value == val_lower or member.name.lower() == val_lower:
                    return member
        return None
