from fastapi import APIRouter

from app.routers.master.brands import router as brands_router
from app.routers.master.calendar import router as calendar_router
from app.routers.master.depots import router as depots_router
from app.routers.master.districts import router as districts_router
from app.routers.master.items import router as items_router
from app.routers.master.outlet_windows import router as outlet_windows_router
from app.routers.master.outlets import router as outlets_router
from app.routers.master.prices import router as prices_router

master_router = APIRouter(prefix="/master")

master_router.include_router(depots_router)
master_router.include_router(districts_router)
master_router.include_router(brands_router)
master_router.include_router(outlet_windows_router)
master_router.include_router(outlets_router)
master_router.include_router(items_router)
master_router.include_router(prices_router)
master_router.include_router(calendar_router)

__all__ = ["master_router"]
