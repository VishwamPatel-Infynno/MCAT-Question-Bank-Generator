import logging
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import config
from app.db.schema import init_db_schema

logger = logging.getLogger(__name__)

# Create Async Engine & Sessionmaker
engine = create_async_engine(
    config.DATABASE_URL, echo=False, pool_pre_ping=True, pool_size=10, max_overflow=20
)

async_session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    """Coordinates database schema creation, DDL migrations, and table verification."""
    logger.info("Initializing PostgreSQL schema and tables...")
    await init_db_schema(engine, async_session_factory)


async def check_db_health() -> dict[str, Any]:
    """Probes database connection health for readiness/liveness checks."""
    try:
        async with async_session_factory() as session:
            await session.execute(text("SELECT 1;"))
            return {"connected": True, "status": "ready"}
    except Exception as e:
        logger.error(f"PostgreSQL connection check failed: {e}")
        return {"connected": False, "status": "unavailable", "error": str(e)}
