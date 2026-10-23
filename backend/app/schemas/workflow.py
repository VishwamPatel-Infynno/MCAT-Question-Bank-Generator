import uuid
from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator, model_validator

from app.schemas.mcat import Difficulty, MCATSection, normalize_section


class GenerationRequest(BaseModel):
    section: MCATSection
    subtopic: str | None = None
    difficulty: Difficulty = Difficulty.MEDIUM
    aamc_skill: str | None = Field(
        default=None,
        description="AAMC Scientific Inquiry & Reasoning Skill (SIRS) or CARS skill classification",
    )
    require_image: bool = False
    image_question_indices: list[int] | None = Field(
        default=None,
        description="1-based question numbers in batch that require images, e.g. [1, 3]",
    )
    require_passage_image: bool = Field(
        default=False,
        description="Whether the shared reading passage stimulus requires an image diagram",
    )
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
    content_domain: str | None = Field(None, description="e.g. General_Chemistry, Biochemistry")
    question_type: str | None = Field(None, description="e.g. Passage_Based_Set, Independent_Discrete")
    interaction_type: str | None = Field(
        "single_choice", description="single_choice (standard 4-choice AAMC), multi_choice"
    )
    primary_trap: str | None = Field(None, description="e.g. Out_of_Scope, Distortion_Opposite")
    passage_required: str | bool | None = Field(None, description="Yes or No")
    passage_mode: str | None = Field(
        "single_passage",
        description="single_passage (all 5 linked to 1 passage) or independent (all 5 standalone discretes)",
    )
    passage_id: str | None = Field(
        None, description="Shared UUID for questions linked to the same passage"
    )
    shared_stimulus: str | None = Field(None, description="Pre-generated shared passage text")
    passage_questions: int | None = Field(None, description="Number of passage questions e.g. 5")
    image_required: str | bool | None = Field(None, description="Yes or No")
    visual_type: str | None = Field("None", description="e.g. None, SVG_Diagram, AI_FLUX_Image")
    questions_to_generate: int = Field(
        5,
        ge=1,
        le=5,
        description="Fixed quantity to generate in MCAT batch (strictly 5 for batch runs, 1 for internal item workers)",
    )
    single_choice_count: int | None = Field(
        5, ge=0, le=5, description="Number of single-choice items in batch (default: 5)"
    )
    multi_choice_count: int | None = Field(
        0, ge=0, le=5, description="Number of multi-choice items in batch (default: 0)"
    )
    passage_count: int | None = Field(
        None, ge=0, le=5, description="Number of passage-type items in batch"
    )
    passage_question_count: int | None = Field(
        5, ge=0, le=5, description="Number of questions linked to the shared passage"
    )
    passage_single_count: int | None = Field(
        None, ge=0, le=5, description="Single choice count under shared passage"
    )
    passage_multi_count: int | None = Field(
        None, ge=0, le=5, description="Multi choice count under shared passage"
    )
    independent_single_count: int | None = Field(
        0, ge=0, le=5, description="Single choice count for independent questions"
    )
    independent_multi_count: int | None = Field(
        0, ge=0, le=5, description="Multi choice count for independent questions"
    )
    auto_save: bool = Field(
        False,
        description="Whether to automatically persist candidate in the Question Bank (default: False for admin review)",
    )

    @property
    def is_passage_active(self) -> bool:
        """Determines whether a reading passage stimulus is active for this request."""
        # CARS is strictly 100% passage-based in official MCAT
        if self.section in (MCATSection.CARS, "CARS", "cars"):
            return True
        if self.passage_required is not None:
            return str(self.passage_required).lower() in ("yes", "true", "1")
        if self.shared_stimulus and self.shared_stimulus.strip():
            return True
        return self.passage_mode != "independent"

    @property
    def requires_visual_stimulus(self) -> bool:
        """Determines whether visual image/diagram stimulus generation is required."""
        if self.section in (MCATSection.CARS, "CARS", "cars"):
            return False
        if self.visual_type in ("SVG_Diagram", "AI_FLUX_Image"):
            return True
        if self.require_image or self.require_passage_image:
            return True
        return bool(self.image_question_indices)

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
            if lower in ["hard", "top percentile", "mastery", "elite"]:
                return Difficulty.HARD
            raise ValueError(
                f"Invalid difficulty '{v}'. Difficulty must strictly be one of: easy, medium, hard."
            )
        return v

    @model_validator(mode="after")
    def resolve_binary_passage_and_fixed_count(self) -> "GenerationRequest":
        """Enforces strictly 5 questions for batch runs and binary passage mode (all 5 linked or all 5 independent)."""
        # Allow 1 only for internal individual worker items; all external/batch runs must strictly be 5
        if self.questions_to_generate != 1 and self.questions_to_generate != 5:
            raise ValueError(
                f"MCAT question generation strictly requires exactly 5 questions per run (received {self.questions_to_generate})."
            )

        if self.questions_to_generate == 1:
            if self.section in (MCATSection.CARS, "cars", "CARS"):
                self.passage_mode = "single_passage"
                self.passage_required = "Yes"
                self.passage_question_count = 1
                self.passage_count = 1
                self.passage_single_count = 1
                self.passage_multi_count = 0
                self.single_choice_count = 1
                self.multi_choice_count = 0
                return self

            is_independent = (
                self.passage_mode == "independent"
                or str(self.passage_required).lower() in ("no", "false", "0")
                or (self.passage_question_count == 0 and not self.shared_stimulus)
            )
            if is_independent:
                self.passage_mode = "independent"
                self.passage_required = "No"
                self.passage_question_count = 0
                self.passage_count = 0
                self.passage_single_count = 0
                self.passage_multi_count = 0
                self.independent_single_count = 1
                self.independent_multi_count = 0
                self.single_choice_count = 1
                self.multi_choice_count = 0
            else:
                self.passage_mode = "single_passage"
                self.passage_required = "Yes"
                self.passage_question_count = 1
                self.passage_count = 1
                self.passage_single_count = 1
                self.passage_multi_count = 0
                self.independent_single_count = 0
                self.independent_multi_count = 0
                self.single_choice_count = 1
                self.multi_choice_count = 0
            return self

        # Rule 1: CARS is ALWAYS 100% passage-based (all 5 linked)
        if self.section in (MCATSection.CARS, "cars", "CARS"):
            self.passage_mode = "single_passage"
            self.passage_required = "Yes"
            self.passage_question_count = 5
            self.passage_count = 5
            self.passage_single_count = 5
            self.passage_multi_count = 0
            self.independent_single_count = 0
            self.independent_multi_count = 0
            self.single_choice_count = 5
            self.multi_choice_count = 0
            return self

        # Rule 2: Science sections - binary choice:
        # Either Mode B: Independent Discretes (All 5 questions standalone)
        is_independent = (
            self.passage_mode == "independent"
            or str(self.passage_required).lower() in ("no", "false", "0")
            or (self.passage_question_count == 0 and not self.shared_stimulus)
        )

        if is_independent:
            self.passage_mode = "independent"
            self.passage_required = "No"
            self.passage_question_count = 0
            self.passage_count = 0
            self.passage_single_count = 0
            self.passage_multi_count = 0
            self.independent_single_count = 5
            self.independent_multi_count = 0
            self.single_choice_count = 5
            self.multi_choice_count = 0
        else:
            # Mode A: Passage-Based Set (All 5 questions linked to 1 passage)
            self.passage_mode = "single_passage"
            self.passage_required = "Yes"
            self.passage_question_count = 5
            self.passage_count = 5
            self.passage_single_count = 5
            self.passage_multi_count = 0
            self.independent_single_count = 0
            self.independent_multi_count = 0
            self.single_choice_count = 5
            self.multi_choice_count = 0

        return self


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
