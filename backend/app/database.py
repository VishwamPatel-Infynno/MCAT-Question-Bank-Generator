# Backward-compatible facade for app.db, app.models, and app.repositories
from app.db.base import Base
from app.db.session import engine, async_session_factory, init_db, check_db_health, auto_migrate_sqlite_if_needed
from app.models.question import QuestionModel
from app.repositories.question_repo import (
    save_question,
    get_questions,
    get_question_by_id,
    delete_question,
    _model_to_schema
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
    "_model_to_schema"
]
