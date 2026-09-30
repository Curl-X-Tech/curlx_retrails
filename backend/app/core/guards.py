"""Deprecated shim. Import directly from app.guards."""

from app.guards import (
    RateLimitGuard,
    RoleGuard,
    api_rate_limiter,
    auth_rate_limiter,
    register_rate_limiter,
    require_dispatcher,
    require_driver,
    require_loader,
    require_store_manager,
    require_system_admin,
)

__all__ = [
    "RateLimitGuard",
    "RoleGuard",
    "api_rate_limiter",
    "auth_rate_limiter",
    "register_rate_limiter",
    "require_dispatcher",
    "require_driver",
    "require_loader",
    "require_store_manager",
    "require_system_admin",
]
