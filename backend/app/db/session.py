import json
import logging
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import config
from app.db.base import Base
from app.models.batch import GenerationBatchModel  # noqa: F401 - Registered for Base.metadata
from app.models.passage import PassageModel  # noqa: F401 - Registered for Base.metadata
from app.models.question import QuestionModel

logger = logging.getLogger(__name__)

# Create Async Engine & Sessionmaker
engine = create_async_engine(
    config.DATABASE_URL, echo=False, pool_pre_ping=True, pool_size=10, max_overflow=20
)

async_session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def auto_migrate_sqlite_if_needed():
    """Migrates existing questions from SQLite question_bank.db into PostgreSQL on initial run."""
    candidates = [
        Path(config.SQLITE_PATH),
        Path("question_bank.db"),
        Path(__file__).resolve().parent.parent.parent.parent / "question_bank.db",
        Path(__file__).resolve().parent.parent.parent / "question_bank.db",
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
            async with sdb.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='questions'"
            ) as cur:
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
                            rubric_data = (
                                json.loads(r["review_rubric_json"])
                                if r["review_rubric_json"]
                                else None
                            )
                            history_data = (
                                json.loads(r["iterations_history_json"])
                                if r["iterations_history_json"]
                                else []
                            )

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
                                token_usage_details=[],
                            )
                            session.add(new_m)
                            migrated_count += 1

                    if migrated_count > 0:
                        await session.commit()
                        logger.info(
                            f"Auto-migrated {migrated_count} questions from SQLite into PostgreSQL."
                        )
    except Exception as e:
        logger.warning(f"Could not auto-migrate from SQLite: {e}")


async def init_db():
    """Initializes PostgreSQL tables, verifies matrix columns, backfills passages/batches, and ensures FTS indexes."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            # Safe schema update for token tracking columns
            await conn.execute(
                text(
                    "ALTER TABLE questions ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0;"
                )
            )
            await conn.execute(
                text(
                    "ALTER TABLE questions ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER DEFAULT 0;"
                )
            )
            await conn.execute(
                text(
                    "ALTER TABLE questions ADD COLUMN IF NOT EXISTS completion_tokens INTEGER DEFAULT 0;"
                )
            )
            await conn.execute(
                text(
                    "ALTER TABLE questions ADD COLUMN IF NOT EXISTS cost_usd DOUBLE PRECISION DEFAULT 0.0;"
                )
            )
            await conn.execute(
                text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS token_usage_details JSONB;")
            )

            # Safe schema update for Manager Combination Matrix columns
            await conn.execute(
                text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS combination_id VARCHAR(64);")
            )
            await conn.execute(
                text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS content_domain VARCHAR(128);")
            )
            await conn.execute(
                text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type VARCHAR(128);")
            )
            await conn.execute(
                text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS interaction_type VARCHAR(64);")
            )
            await conn.execute(
                text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS primary_trap VARCHAR(128);")
            )
            await conn.execute(
                text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS passage_required VARCHAR(16);")
            )
            await conn.execute(
                text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS passage_mode VARCHAR(32);")
            )
            await conn.execute(
                text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS passage_id VARCHAR(64);")
            )
            await conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_questions_passage_id ON questions (passage_id);"
                )
            )
            await conn.execute(
                text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS passage_questions INTEGER;")
            )
            await conn.execute(
                text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS visual_type VARCHAR(64);")
            )
            await conn.execute(
                text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS mcat_scaled_score INTEGER;")
            )
            await conn.execute(
                text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS aamc_skill VARCHAR(128);")
            )
            await conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_questions_mcat_scaled_score ON questions (mcat_scaled_score);"
                )
            )
            await conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_questions_aamc_skill ON questions (aamc_skill);"
                )
            )
            await conn.execute(
                text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS stage_outcomes JSONB;")
            )

            # Safe schema update for Run and Batch UUID columns and timestamps
            await conn.execute(
                text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS run_id VARCHAR(64);")
            )
            await conn.execute(
                text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS batch_id VARCHAR(64);")
            )
            await conn.execute(
                text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS updated_at VARCHAR(64);")
            )
            await conn.execute(
                text("CREATE INDEX IF NOT EXISTS ix_questions_run_id ON questions (run_id);")
            )
            await conn.execute(
                text("CREATE INDEX IF NOT EXISTS ix_questions_batch_id ON questions (batch_id);")
            )

            # Safe indexes and image columns for passages and batches
            await conn.execute(
                text("ALTER TABLE passages ADD COLUMN IF NOT EXISTS image_url TEXT;")
            )
            await conn.execute(text("ALTER TABLE passages ALTER COLUMN image_url TYPE TEXT;"))
            await conn.execute(
                text("ALTER TABLE passages ADD COLUMN IF NOT EXISTS image_svg TEXT;")
            )
            await conn.execute(
                text("ALTER TABLE passages ADD COLUMN IF NOT EXISTS image_description TEXT;")
            )
            await conn.execute(
                text("CREATE INDEX IF NOT EXISTS ix_passages_section ON passages (section);")
            )
            await conn.execute(
                text("CREATE INDEX IF NOT EXISTS ix_passages_created_at ON passages (created_at);")
            )
            await conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_batches_created_at ON generation_batches (created_at);"
                )
            )

            # GIN Full-Text Search index on questions
            await conn.execute(
                text(
                    """
                    CREATE INDEX IF NOT EXISTS ix_questions_fts ON questions USING gin (
                        to_tsvector('english',
                            coalesce(question_stem, '') || ' ' ||
                            coalesce(stimulus_text, '') || ' ' ||
                            coalesce(subtopic, '') || ' ' ||
                            coalesce(explanation, '')
                        )
                    );
                    """
                )
            )

        await auto_migrate_sqlite_if_needed()

        # Data Backfill & Foreign Key Constraints
        async with engine.begin() as conn:
            # 1. Backfill passages from existing questions having passage_id & stimulus_text
            await conn.execute(
                text(
                    """
                    INSERT INTO passages (id, text, section, subtopic, created_at, updated_at)
                    SELECT DISTINCT ON (passage_id)
                        passage_id,
                        stimulus_text,
                        section,
                        subtopic,
                        created_at,
                        updated_at
                    FROM questions
                    WHERE passage_id IS NOT NULL AND stimulus_text IS NOT NULL AND trim(stimulus_text) != ''
                    ON CONFLICT (id) DO NOTHING;
                    """
                )
            )

            # Ensure any other orphaned passage_id is covered before setting FK
            await conn.execute(
                text(
                    """
                    INSERT INTO passages (id, text, created_at)
                    SELECT DISTINCT q.passage_id, coalesce(q.stimulus_text, ''), q.created_at
                    FROM questions q
                    LEFT JOIN passages p ON q.passage_id = p.id
                    WHERE q.passage_id IS NOT NULL AND p.id IS NULL
                    ON CONFLICT (id) DO NOTHING;
                    """
                )
            )

            # 2. Backfill generation_batches from existing questions having batch_id
            await conn.execute(
                text(
                    """
                    INSERT INTO generation_batches (
                        id, section, subtopic, difficulty, passage_mode,
                        actual_count, total_tokens, cost_usd, status, created_at, updated_at
                    )
                    SELECT
                        batch_id,
                        max(section) as section,
                        max(subtopic) as subtopic,
                        max(difficulty) as difficulty,
                        max(passage_mode) as passage_mode,
                        count(id) as actual_count,
                        coalesce(sum(total_tokens), 0) as total_tokens,
                        coalesce(sum(cost_usd), 0.0) as cost_usd,
                        'completed' as status,
                        min(created_at) as created_at,
                        max(updated_at) as updated_at
                    FROM questions
                    WHERE batch_id IS NOT NULL
                    GROUP BY batch_id
                    ON CONFLICT (id) DO NOTHING;
                    """
                )
            )

            # Ensure any orphaned batch_id is covered before setting FK
            await conn.execute(
                text(
                    """
                    INSERT INTO generation_batches (id, created_at)
                    SELECT DISTINCT q.batch_id, q.created_at
                    FROM questions q
                    LEFT JOIN generation_batches b ON q.batch_id = b.id
                    WHERE q.batch_id IS NOT NULL AND b.id IS NULL
                    ON CONFLICT (id) DO NOTHING;
                    """
                )
            )

            # 3. Safe Foreign Key: questions.passage_id -> passages.id
            await conn.execute(
                text(
                    """
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint WHERE conname = 'fk_questions_passage_id'
                        ) THEN
                            ALTER TABLE questions
                            ADD CONSTRAINT fk_questions_passage_id
                            FOREIGN KEY (passage_id) REFERENCES passages(id) ON DELETE SET NULL;
                        END IF;
                    END $$;
                    """
                )
            )

            # 4. Safe Foreign Key: questions.batch_id -> generation_batches.id
            await conn.execute(
                text(
                    """
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint WHERE conname = 'fk_questions_batch_id'
                        ) THEN
                            ALTER TABLE questions
                            ADD CONSTRAINT fk_questions_batch_id
                            FOREIGN KEY (batch_id) REFERENCES generation_batches(id) ON DELETE SET NULL;
                        END IF;
                    END $$;
                    """
                )
            )

        logger.info(
            "PostgreSQL tables verified / created successfully with passages, batches, matrix columns, FKs, and FTS."
        )

        # Seed authentic publication-grade MCAT questions across all 4 sections if needed
        await seed_mcat_questions_if_empty()
    except Exception as e:
        logger.error(f"Failed to initialize PostgreSQL: {e}")
        raise e


async def seed_mcat_questions_if_empty():
    """Seeds authentic MCAT questions across all 4 sections if the bank has legacy questions or is empty."""
    from app.agents.mock_fixtures import _build_raw_mock_draft
    from app.schemas.mcat import (
        MCAT_SECTION_LABELS,
        MCATSection,
        calculate_mcat_scaled_score,
    )
    from app.schemas.workflow import GenerationRequest

    try:
        async with async_session_factory() as session:
            # 1. Check for legacy UCAT questions and clean them up
            legacy_res = await session.execute(
                select(QuestionModel).where(
                    QuestionModel.section.in_(
                        [
                            "verbal_reasoning",
                            "decision_making",
                            "quantitative_reasoning",
                            "abstract_reasoning",
                            "situational_judgement",
                            "VR",
                            "DM",
                            "QR",
                            "AR",
                            "SJT",
                        ]
                    )
                )
            )
            legacy_rows = legacy_res.scalars().all()
            if legacy_rows:
                for row in legacy_rows:
                    await session.delete(row)
                await session.commit()
                logger.info(
                    f"Cleaned {len(legacy_rows)} legacy UCAT questions from Question Bank repository."
                )

            # 2. Check if any questions exist
            res = await session.execute(select(func.count(QuestionModel.id)))
            count = res.scalar() or 0
            if count == 0:
                logger.info("Seeding authentic publication-grade MCAT questions across all 4 sections...")
                now_iso = datetime.now(UTC).isoformat()
                for sec in [
                    MCATSection.CHEM_PHYS,
                    MCATSection.CARS,
                    MCATSection.BIO_BIOCHEM,
                    MCATSection.PSYCH_SOC,
                ]:
                    req = GenerationRequest(section=sec)
                    draft = _build_raw_mock_draft(req)
                    scaled = calculate_mcat_scaled_score(95, "medium")
                    q_model = QuestionModel(
                        id=str(uuid.uuid4()),
                        section=sec.value,
                        section_label=MCAT_SECTION_LABELS[sec],
                        subtopic=draft.aamc_skill or "Foundational Concepts",
                        difficulty="medium",
                        stimulus_text=draft.stimulus_text,
                        question_stem=draft.question_stem,
                        options=[opt.model_dump() for opt in draft.options],
                        correct_answer_id=draft.correct_answer_id,
                        correct_answer_ids=draft.correct_answer_ids,
                        explanation=draft.explanation,
                        final_score=95,
                        mcat_scaled_score=scaled["section_score"],
                        aamc_skill=draft.aamc_skill or "Skill_2",
                        primary_trap=draft.primary_trap or "Distortion_Opposite",
                        passage_required="Yes" if draft.stimulus_text else "No",
                        visual_type="None",
                        iteration_count=1,
                        created_at=now_iso,
                        updated_at=now_iso,
                        total_tokens=0,
                        prompt_tokens=0,
                        completion_tokens=0,
                        cost_usd=0.0,
                    )
                    session.add(q_model)
                await session.commit()
                logger.info("Successfully seeded 4 authentic MCAT question sets into Question Bank.")
    except Exception as e:
        logger.warning(f"Could not seed MCAT questions: {e}")


async def check_db_health() -> dict[str, Any]:
    """Tests connectivity to the database."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1;"))
            return {"connected": True, "status": "ready"}
    except Exception as e:
        return {"connected": False, "error": str(e), "status": "unavailable"}
