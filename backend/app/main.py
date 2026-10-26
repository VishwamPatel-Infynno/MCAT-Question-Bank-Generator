import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import config
from app.core.logging import configure_logging
from app.db.session import init_db

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    configure_logging()
    logger.info("Initializing Infynno MCAT Question Bank Generator backend...")
    await init_db()
    yield
    logger.info("Shutting down backend...")


app = FastAPI(
    title="Infynno MCAT Question Bank Generator API",
    description="AI Question Writing & Verification System | An Infynno Solutions LLP Product",
    version="2.0.0",
    lifespan=lifespan,
)


# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
    return response


# Enable hardened CORS — origins sourced from Settings (localhost defaults + env overrides)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.effective_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
)

# Mount versioned API routes under /api
app.include_router(api_router)
