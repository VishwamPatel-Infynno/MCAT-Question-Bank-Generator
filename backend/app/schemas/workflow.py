import uuid
from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator

from app.schemas.ucat import Difficulty, UCATSection, normalize_section


class GenerationRequest(BaseModel):
    section: UCATSection
    subtopic: str | None = None
    difficulty: Difficulty = Difficulty.MEDIUM
    require_image: bool = False
    custom_prompt: str | None = None
    model_name: str | None = None
    api_key: str | None = None

    # Execution & Batch UUID Identifiers
    run_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()), description="Unique execution run UUID4"
    )
    batch_id: str | None = Field(
        None, description="Optional batch run UUID4 binding multiple questions"
    )

    # Manager Combination Matrix attributes
    combination_id: str | None = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Combination UUID4 or custom code e.g. CMB00001",
    )
    subcategory: str | None = Field(None, description="e.g. Inference")
    content_domain: str | None = Field(None, description="e.g. Science, Healthcare")
    question_type: str | None = Field(None, description="e.g. Passage_MCQ, True_False_Cant_Tell")
    interaction_type: str | None = Field(
        "single_choice", description="single_choice, multi_choice, drag_drop"
    )
    primary_trap: str | None = Field(None, description="e.g. Keyword_Trap, Partial_Match")
    passage_required: str | bool | None = Field(None, description="Yes or No")
    passage_mode: str | None = Field(
        "single_passage",
        description="single_passage (1 shared passage with linked questions) or independent (separate scenarios)",
    )
    passage_id: str | None = Field(
        None, description="Shared UUID for questions linked to the same passage"
    )
    shared_stimulus: str | None = Field(None, description="Pre-generated shared passage text")
    passage_questions: int | None = Field(None, description="Number of passage questions e.g. 3, 4")
    image_required: str | bool | None = Field(None, description="Yes or No")
    visual_type: str | None = Field("None", description="e.g. None, SVG_Diagram, AI_FLUX_Image")
    questions_to_generate: int | None = Field(
        1, ge=1, le=5, description="Quantity to generate in batch (1-5)"
    )
    single_choice_count: int | None = Field(
        None, ge=0, le=5, description="Number of single-choice items in batch"
    )
    multi_choice_count: int | None = Field(
        None, ge=0, le=5, description="Number of multi-choice items in batch"
    )
    passage_count: int | None = Field(
        None, ge=0, le=5, description="Number of passage-type items in batch"
    )
    passage_question_count: int | None = Field(
        None, ge=1, le=5, description="Number of questions linked to the shared passage"
    )
    passage_single_count: int | None = Field(
        None, ge=0, le=5, description="Single choice count under shared passage"
    )
    passage_multi_count: int | None = Field(
        None, ge=0, le=5, description="Multi choice count under shared passage"
    )
    independent_single_count: int | None = Field(
        None, ge=0, le=5, description="Single choice count for independent questions"
    )
    independent_multi_count: int | None = Field(
        None, ge=0, le=5, description="Multi choice count for independent questions"
    )
    auto_save: bool = Field(
        False,
        description="Whether to automatically persist candidate in PostgreSQL (default: False for admin review)",
    )

    @field_validator("combination_id", mode="before")
    @classmethod
    def validate_combination_id(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            return str(uuid.uuid4())
        return str(v).strip()

    @field_validator("section", mode="before")
    @classmethod
    def validate_section(cls, v):
        if isinstance(v, str):
            return normalize_section(v)
        return v

    @field_validator("difficulty", mode="before")
    @classmethod
    def validate_difficulty(cls, v):
        if isinstance(v, str):
            lower = v.strip().lower()
            if lower in ["easy", "foundational"]:
                return Difficulty.EASY
            if lower in ["medium", "standard", "standard exam"]:
                return Difficulty.MEDIUM
            if lower in ["hard", "top percentile", "mastery"]:
                return Difficulty.HARD
            raise ValueError(
                f"Invalid difficulty '{v}'. Difficulty must strictly be one of: easy, medium, hard."
            )
        return v


class WorkflowEvent(BaseModel):
    event_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()), description="Unique SSE event UUID4"
    )
    run_id: str | None = Field(None, description="Execution run UUID4")
    batch_id: str | None = Field(None, description="Batch execution UUID4")
    event_type: str  # 'workflow_start', 'agent_start', 'agent_complete', 'workflow_complete', 'workflow_rejected', 'workflow_error'
    agent_name: str  # 'Question Generator', 'Question Reviewer', 'Question Re-Generator', 'Image Generator', 'Quality Gate', 'System'
    message: str
    data: dict[str, Any] | None = None
    timestamp: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())
