from enum import StrEnum


class RoleType(StrEnum):
    STORE_MANAGER = "STORE_MANAGER"
    DRIVER = "DRIVER"
    LOADER = "LOADER"
    DISPATCHER = "DISPATCHER"


UserType = StrEnum(
    "UserType",
    {m.name: m.value for m in RoleType} | {"SYSTEM_ADMIN": "SYSTEM_ADMIN"},
)
