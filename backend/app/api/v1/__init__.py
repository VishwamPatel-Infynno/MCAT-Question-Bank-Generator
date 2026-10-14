from fastapi import APIRouter

from app.api.v1.config import router as config_router
from app.api.v1.generation import router as generation_router
from app.api.v1.health import router as health_router
from app.api.v1.questions import router as questions_router

v1_router = APIRouter()
v1_router.include_router(generation_router)
v1_router.include_router(questions_router)
v1_router.include_router(config_router)
v1_router.include_router(health_router)

__all__ = ["v1_router"]
