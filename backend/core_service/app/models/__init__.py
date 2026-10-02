"""Import all domain models to register their metadata with Base."""

from app.models.order import OrderModel  # noqa: F401
from app.models.outlet import OutletModel  # noqa: F401
from app.models.route import RouteModel  # noqa: F401
from app.models.service_allowance import ServiceAllowanceModel  # noqa: F401
from app.models.vehicle import VehicleModel  # noqa: F401
from app.models.dispatch import LiveTripModel  # noqa: F401
from app.models.driver import DriverModel  # noqa: F401
from app.models.audit import DispatchAuditLogModel  # noqa: F401
