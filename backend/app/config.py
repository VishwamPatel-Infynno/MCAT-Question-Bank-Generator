"""Backward-compatibility facade for app.core.config.

.. deprecated:: 1.0.0
    Import directly from ``app.core.config`` instead.
"""

from app.core.config import Config, Settings, config

__all__ = ["config", "Config", "Settings"]
