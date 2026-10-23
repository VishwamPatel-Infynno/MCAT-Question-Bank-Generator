import logging

from fastapi import APIRouter

from app.core.config import config
from app.db.session import check_db_health
from app.schemas.mcat import (
    AAMC_REASONING_SKILLS,
    CONTENT_DOMAINS_DETAILED,
    DEPENDENT_TAXONOMY,
    LIKELY_MISTAKE_PATTERNS,
    MCAT_PACING,
    MCAT_SECTION_CODES,
    MCAT_SECTION_LABELS,
    MCAT_SUBTOPICS,
    PRIMARY_TRAPS_DETAILED,
    QUESTION_TYPES_DETAILED,
    TAXONOMY_SKILLS,
    MCATSection,
    get_section_tree,
    get_skills_for_section,
    get_taxonomy_data,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health & Metadata"])


@router.get("/health")
async def health_check():
    """Health check reporting database status, exam standard, and active pricing."""
    db_status = await check_db_health()
    return {
        "status": "healthy",
        "exam": "AAMC MCAT",
        "database": "connected" if db_status.get("connected") else "disconnected",
        "database_connected": db_status.get("connected", False),
        "database_status": db_status.get(
            "status", "ready" if db_status.get("connected") else "unavailable"
        ),
        "default_text_model": config.DEFAULT_TEXT_MODEL,
        "default_image_model": config.DEFAULT_IMAGE_MODEL,
        "has_deepinfra_key": bool(config.DEEPINFRA_API_KEY),
        "has_gemini_key": bool(config.GEMINI_API_KEY),
        "has_openai_key": bool(config.OPENAI_API_KEY),
        "max_regenerations": config.MAX_REGENERATION_ATTEMPTS,
        "passing_threshold": config.PASSING_SCORE_THRESHOLD,
        "cost_per_million_input": config.COST_PER_MILLION_INPUT_TOKENS,
        "cost_per_million_output": config.COST_PER_MILLION_OUTPUT_TOKENS,
        "image_width": config.IMAGE_WIDTH,
        "image_height": config.IMAGE_HEIGHT,
        "image_iters": config.IMAGE_ITERS,
        "current_image_cost_usd": config.calculate_flux_image_cost(),
    }


def _build_rich_sections_payload():
    sections_list = []
    for sec in MCATSection:
        code = MCAT_SECTION_CODES[sec]
        tree = get_section_tree(sec)
        subjects = tree.get("subjects", []) if tree else []
        # Flatten all subtopics across all topics in all units in all subjects for fallback compatibility
        all_subtopics = []
        for subj in subjects:
            for unit in subj.get("units", []):
                for topic in unit.get("topics", []):
                    all_subtopics.extend(topic.get("subtopics", []))

        subtopics = all_subtopics if all_subtopics else MCAT_SUBTOPICS.get(sec, [])

        sections_list.append({
            "id": sec.value,
            "code": code,
            "label": MCAT_SECTION_LABELS[sec],
            "pacing": MCAT_PACING[sec],
            "subtopics": subtopics,
            "subjects": subjects,
            "skills": get_skills_for_section(sec),
        })

    return {
        "exam": "MCAT",
        "exam_full_name": "Medical College Admission Test (AAMC)",
        "selection_flow": DEPENDENT_TAXONOMY.get("selection_flow", [
            "section", "subject", "unit", "topic", "subtopic", "skill", "subskill"
        ]),
        "sections": sections_list,
        "skills": TAXONOMY_SKILLS,
        "aamc_skills": AAMC_REASONING_SKILLS,
        "generation_options": {
            "difficulty": DEPENDENT_TAXONOMY.get("generation_options", {}).get("difficulty", []),
            "question_type": QUESTION_TYPES_DETAILED,
            "content_domain": CONTENT_DOMAINS_DETAILED,
            "primary_trap": PRIMARY_TRAPS_DETAILED,
            "likely_mistake_pattern": DEPENDENT_TAXONOMY.get("generation_options", {}).get(
                "likely_mistake_pattern", {}
            ),
            "number_of_questions": DEPENDENT_TAXONOMY.get("generation_options", {}).get(
                "number_of_questions", {"default": 5, "minimum": 1, "maximum": 10}
            ),
        },
        "generation_form_fields": DEPENDENT_TAXONOMY.get("generation_form_fields", []),
    }


_CACHED_SECTIONS_PAYLOAD = _build_rich_sections_payload()


@router.get("/sections")
async def get_sections():
    """Returns official AAMC MCAT sections and their categorized subtopics (in-memory pre-cached)."""
    return _CACHED_SECTIONS_PAYLOAD


@router.get("/taxonomy")
async def get_taxonomy():
    """Returns the official manager-provided MCAT Dependent Taxonomy."""
    return get_taxonomy_data()
