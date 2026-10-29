"""
Shared pytest fixtures for the MCAT Question Bank Generator backend test suite.

Fixtures defined here are automatically discovered and available to all tests
in this directory without explicit import.
"""

import socket

import pytest
from app.main import app
from httpx import ASGITransport, AsyncClient


def is_postgres_available(host: str = "localhost", port: int = 5432, timeout: float = 0.5) -> bool:
    """Probes whether a local PostgreSQL server is actively listening on the target port."""
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


POSTGRES_AVAILABLE = is_postgres_available()


@pytest.fixture(autouse=True)
def auto_skip_db_tests(request):
    """Automatically skips tests marked with @pytest.mark.requires_db if PostgreSQL is not reachable."""
    if request.node.get_closest_marker("requires_db") and not POSTGRES_AVAILABLE:
        pytest.skip("PostgreSQL on localhost:5432 is offline. Skipping database-dependent test.")


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
