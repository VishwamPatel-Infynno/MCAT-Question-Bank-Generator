import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.db.base import Base
from app.models.batch import GenerationBatchModel  # noqa: F401 - Registered for Base.metadata
from app.models.job import GenerationJobModel  # noqa: F401 - Registered for Base.metadata
from app.models.passage import PassageModel  # noqa: F401 - Registered for Base.metadata
from app.models.question import QuestionModel  # noqa: F401 - Registered for Base.metadata

logger = logging.getLogger(__name__)


async def init_db_schema(engine: AsyncEngine):
    """Initializes PostgreSQL tables, verifies schema columns, backfills passages/batches, and ensures FTS indexes."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # Safe schema update for token tracking columns (PostgreSQL)
        await conn.execute(
            text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0;")
        )
        await conn.execute(
            text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER DEFAULT 0;")
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
            text("CREATE INDEX IF NOT EXISTS ix_questions_passage_id ON questions (passage_id);")
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
            text("CREATE INDEX IF NOT EXISTS ix_questions_aamc_skill ON questions (aamc_skill);")
        )
        await conn.execute(
            text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS stage_outcomes JSONB;")
        )

        # Safe schema update for Granular Dependent Taxonomy Hierarchy
        await conn.execute(
            text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS subject VARCHAR(128);")
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS ix_questions_subject ON questions (subject);")
        )
        await conn.execute(
            text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS unit VARCHAR(128);")
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS ix_questions_unit ON questions (unit);")
        )
        await conn.execute(
            text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS topic VARCHAR(128);")
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS ix_questions_topic ON questions (topic);")
        )
        await conn.execute(
            text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS subskill VARCHAR(256);")
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS ix_questions_subskill ON questions (subskill);")
        )
        await conn.execute(
            text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS likely_mistake_pattern TEXT;")
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
        await conn.execute(
            text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS job_id VARCHAR(64);")
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS ix_questions_job_id ON questions (job_id);")
        )
        await conn.execute(
            text(
                "ALTER TABLE questions ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'in_bank';"
            )
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS ix_questions_status ON questions (status);")
        )
        await conn.execute(text("UPDATE questions SET status = 'in_bank' WHERE status IS NULL;"))

        # Safe schema update for batch job tracking columns
        await conn.execute(
            text(
                "ALTER TABLE generation_batches ADD COLUMN IF NOT EXISTS total_jobs INTEGER DEFAULT 10;"
            )
        )
        await conn.execute(
            text(
                "ALTER TABLE generation_batches ADD COLUMN IF NOT EXISTS completed_jobs INTEGER DEFAULT 0;"
            )
        )
        await conn.execute(
            text(
                "ALTER TABLE generation_batches ADD COLUMN IF NOT EXISTS failed_jobs INTEGER DEFAULT 0;"
            )
        )
        await conn.execute(
            text("ALTER TABLE generation_batches ADD COLUMN IF NOT EXISTS error_message TEXT;")
        )

        # Safe indexes and image columns for passages and batches
        await conn.execute(text("ALTER TABLE passages ADD COLUMN IF NOT EXISTS image_url TEXT;"))
        await conn.execute(text("ALTER TABLE passages ALTER COLUMN image_url TYPE TEXT;"))
        await conn.execute(text("ALTER TABLE passages ADD COLUMN IF NOT EXISTS image_svg TEXT;"))
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

        # 5. Safe Foreign Key: questions.job_id -> generation_jobs.id
        await conn.execute(
            text(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'fk_questions_job_id'
                    ) THEN
                        ALTER TABLE questions
                        ADD CONSTRAINT fk_questions_job_id
                        FOREIGN KEY (job_id) REFERENCES generation_jobs(id) ON DELETE SET NULL;
                    END IF;
                END $$;
                """
            )
        )

    logger.info(
        "PostgreSQL tables verified / created successfully with passages, batches, matrix columns, FKs, and FTS."
    )
