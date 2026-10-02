from enum import Enum


class DeliveryWindowType(str, Enum):
    """Delivery window constraint types across retail brands."""

    MORNING_STRICT = "morning_strict"
    MALL_BAY_RESTRICTED = "mall_bay_restricted"
    STANDARD_RETAIL = "standard_retail"


class DockType(str, Enum):
    """Outlet loading and unloading dock types."""

    REAR_DOCK = "rear_dock"
    STREET = "street"
    MALL_BAY = "mall_bay"


class ParkingConstraint(str, Enum):
    """Vehicle parking and physical access constraints for retail outlets."""

    NORMAL = "normal"
    VAN_ONLY = "van_only"
    MALL_DOCK = "mall_dock"
