from enum import Enum


class RoleType(str, Enum):
    STORE_MANAGER = "STORE_MANAGER"
    DRIVER = "DRIVER"
    LOADER = "LOADER"
    DISPATCHER = "DISPATCHER"


class UserType(str, Enum):
    STORE_MANAGER = "STORE_MANAGER"
    DRIVER = "DRIVER"
    LOADER = "LOADER"
    DISPATCHER = "DISPATCHER"
    SYSTEM_ADMIN = "SYSTEM_ADMIN"
