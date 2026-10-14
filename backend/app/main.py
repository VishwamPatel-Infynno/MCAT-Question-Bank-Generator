import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.db.session import init_db

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    logger.info("Initializing UK UCAT Question Bank Generator backend...")
    await init_db()
    yield
    logger.info("Shutting down backend...")

app = FastAPI(
    title="UK UCAT Question Bank Generator API",
    description="Multi-Agent System & Workflow for UK UCAT Preparation",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount versioned API routes under /api
app.include_router(api_router)
