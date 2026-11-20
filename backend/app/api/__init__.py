from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.scans import router as scans_router
from app.api.reports import router as reports_router
from app.api.system import router as system_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(scans_router)
api_router.include_router(reports_router)
api_router.include_router(system_router)
