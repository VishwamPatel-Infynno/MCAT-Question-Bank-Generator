"""Backward-compatibility facade for app.db, app.models, and app.repositories.

.. deprecated:: 1.0.0
    Import directly from ``app.db.session``, ``app.models.question``,
    or ``app.repositories.question_repo`` instead.
"""

from app.db.base import Base
from app.db.session import (
    async_session_factory,
    auto_migrate_sqlite_if_needed,
    check_db_health,
    engine,
    init_db,
)
from app.models.question import QuestionModel
from app.repositories.question_repo import (
    _model_to_schema,
    delete_question,
    get_question_by_id,
    get_questions,
    save_question,
)

__all__ = [
    "Base",
    "engine",
    "async_session_factory",
    "init_db",
    "check_db_health",
    "auto_migrate_sqlite_if_needed",
    "QuestionModel",
    "save_question",
    "get_questions",
    "get_question_by_id",
    "delete_question",
    "_model_to_schema",
]
