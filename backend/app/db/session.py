import json
import logging
from pathlib import Path
from typing import Dict, Any

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text

from app.core.config import config
from app.db.base import Base
from app.models.question import QuestionModel

logger = logging.getLogger(__name__)

# Create Async Engine & Sessionmaker
engine = create_async_engine(
    config.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def auto_migrate_sqlite_if_needed():
    """Migrates existing questions from SQLite question_bank.db into PostgreSQL on initial run."""
    candidates = [
        Path(config.SQLITE_PATH),
        Path("question_bank.db"),
        Path(__file__).resolve().parent.parent.parent.parent / "question_bank.db",
        Path(__file__).resolve().parent.parent.parent / "question_bank.db"
    ]
    sqlite_path = None
    for p in candidates:
        if p.exists():
            sqlite_path = p
            break

    if not sqlite_path:
        return

    try:
        import aiosqlite
        async with aiosqlite.connect(sqlite_path) as sdb:
            sdb.row_factory = aiosqlite.Row
            async with sdb.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='questions'") as cur:
                table_row = await cur.fetchone()
                if not table_row:
                    return

            async with sdb.execute("SELECT * FROM questions") as cur:
                rows = await cur.fetchall()
                if not rows:
                    return
                
                async with async_session_factory() as session:
                    migrated_count = 0
                    for r in rows:
                        existing = await session.get(QuestionModel, r["id"])
                        if not existing:
                            opts_data = json.loads(r["options_json"]) if r["options_json"] else []
                            rubric_data = json.loads(r["review_rubric_json"]) if r["review_rubric_json"] else None
                            history_data = json.loads(r["iterations_history_json"]) if r["iterations_history_json"] else []

                            new_m = QuestionModel(
                                id=r["id"],
                                section=r["section"],
                                section_label=r["section_label"],
                                subtopic=r["subtopic"],
                                difficulty=r["difficulty"],
                                stimulus_text=r["stimulus_text"],
                                question_stem=r["question_stem"],
                                options=opts_data,
                                correct_answer_id=r["correct_answer_id"],
                                explanation=r["explanation"],
                                image_url=r["image_url"],
                                image_svg=r["image_svg"],
                                image_description=r["image_description"],
                                final_score=r["final_score"],
                                review_rubric=rubric_data,
                                iteration_count=r["iteration_count"],
                                iterations_history=history_data,
                                created_at=r["created_at"],
                                total_tokens=0,
                                prompt_tokens=0,
                                completion_tokens=0,
                                cost_usd=0.0,
                                token_usage_details=[]
                            )
                            session.add(new_m)
                            migrated_count += 1

                    if migrated_count > 0:
                        await session.commit()
                        logger.info(f"Auto-migrated {migrated_count} questions from SQLite into PostgreSQL.")
    except Exception as e:
        logger.warning(f"Could not auto-migrate from SQLite: {e}")

async def init_db():
    """Initializes PostgreSQL tables and migrates legacy data."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            # Safe schema update for token tracking columns
            await conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0;"))
            await conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER DEFAULT 0;"))
            await conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS completion_tokens INTEGER DEFAULT 0;"))
            await conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS cost_usd DOUBLE PRECISION DEFAULT 0.0;"))
            await conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS token_usage_details JSONB;"))

            # Safe schema update for Manager Combination Matrix columns
            await conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS combination_id VARCHAR(64);"))
            await conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS content_domain VARCHAR(128);"))
            await conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type VARCHAR(128);"))
            await conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS interaction_type VARCHAR(64);"))
            await conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS primary_trap VARCHAR(128);"))
            await conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS passage_required VARCHAR(16);"))
            await conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS passage_questions INTEGER;"))
            await conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS visual_type VARCHAR(64);"))
            await conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS stage_outcomes JSONB;"))

            # Safe schema update for Run and Batch UUID columns
            await conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS run_id VARCHAR(64);"))
            await conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS batch_id VARCHAR(64);"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_questions_run_id ON questions (run_id);"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_questions_batch_id ON questions (batch_id);"))
        logger.info("PostgreSQL tables verified / created successfully with matrix columns and token tracking.")
        await auto_migrate_sqlite_if_needed()
    except Exception as e:
        logger.error(f"Failed to initialize PostgreSQL: {e}")
        raise e

async def check_db_health() -> Dict[str, Any]:
    """Tests connectivity to PostgreSQL."""
    try:
        async with engine.connect() as conn:
            res = await conn.execute(text("SELECT version();"))
            row = res.fetchone()
            version_str = row[0] if row else "PostgreSQL"
            return {"connected": True, "version": version_str, "driver": "asyncpg"}
    except Exception as e:
        return {"connected": False, "error": str(e), "driver": "asyncpg"}
