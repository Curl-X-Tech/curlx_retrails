from fastapi import APIRouter

from app.api.v1.master.brands import router as brands_router
from app.api.v1.master.depots import router as depots_router
from app.api.v1.master.districts import router as districts_router
from app.api.v1.master.outlets import router as outlets_router

master_router = APIRouter(prefix="/master")

master_router.include_router(depots_router)
master_router.include_router(districts_router)
master_router.include_router(brands_router)
master_router.include_router(outlets_router)

__all__ = ["master_router"]
