"""
Shared pytest fixtures for the MCAT Question Bank Generator backend test suite.

Fixtures defined here are automatically discovered and available to all tests
in this directory without explicit import.
"""

import pytest
from app.main import app
from httpx import ASGITransport, AsyncClient


@pytest.fixture(scope="session")
async def client():
    """
    Async HTTP test client bound to the FastAPI application.

    Uses HTTPX's ASGITransport to exercise the full ASGI stack (middleware,
    routing, dependency injection) without starting a real server.

    Scope is ``session`` so the client (and underlying lifespan) is shared
    across the entire test session, avoiding repeated DB init overhead.
    """
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


@pytest.fixture(scope="session")
def anyio_backend():
    """Tells anyio (used by pytest-asyncio) to use the asyncio backend."""
    return "asyncio"
