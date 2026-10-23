import uuid
from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field

from app.schemas.mcat import calculate_mcat_scaled_score


class OptionChoice(BaseModel):
    id: str  # A, B, C, D
    text: str


class ReviewScore(BaseModel):
    audit_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique psychometric audit evaluation UUID4",
    )
    evaluated_at: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())
    authenticity_score: int = Field(
        ..., ge=0, le=25, description="AAMC MCAT authentic scientific tone and style (0-25)"
    )
    clarity_score: int = Field(
        ..., ge=0, le=25, description="Stem clarity and logical tightness (0-25)"
    )
    distractor_score: int = Field(
        ..., ge=0, le=25, description="Plausibility and sophistication of distractors (0-25)"
    )
    explanation_score: int = Field(
        ..., ge=0, le=25, description="Soundness and rigor of step-by-step key proof (0-25)"
    )
    total_score: int = Field(..., ge=0, le=100, description="Overall psychometric score (0-100)")
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    passed: bool = Field(False, description="True if total_score > 90 benchmark")


class QuestionDraft(BaseModel):
    stimulus_text: str = Field(
        "", description="Reading passage, clinical case context, or research scenario"
    )
    question_stem: str = Field(..., description="The direct question or prompt to solve")
    options: list[OptionChoice] = Field(
        ..., min_length=4, max_length=5, description="4 choices (A, B, C, D)"
    )
    correct_answer_id: str = Field(
        ..., description="Key option id e.g. 'A', or comma-joined keys e.g. 'A, C'"
    )
    correct_answer_ids: list[str] = Field(
        default_factory=list, description="List of correct keys e.g. ['A']"
    )
    explanation: str = Field(
        ..., description="Comprehensive step-by-step cognitive and pedagogical rationale"
    )
    image_needed: bool = Field(False, description="True if a visual diagram/chart is essential")
    image_prompt_or_type: str | None = Field(
        None, description="Visual description, chart type, or SVG geometry description"
    )
    primary_trap: str | None = Field(
        None, description="Primary cognitive distractor trap used (e.g. Scope_Shift, Out_of_Scope)"
    )
    aamc_skill: str | None = Field(
        None, description="AAMC Scientific Inquiry & Reasoning Skill (SIRS) or CARS skill classification"
    )
    subject: str | None = Field(None, description="Taxonomy subject e.g. General Chemistry")
    unit: str | None = Field(None, description="Taxonomy unit e.g. Atomic Structure and Periodicity")
    topic: str | None = Field(None, description="Taxonomy topic e.g. Periodic Trends")
    subskill: str | None = Field(None, description="Granular AAMC subskill focus")
    likely_mistake_pattern: str | None = Field(None, description="Targeted student misconception or mistake pattern")

    def model_post_init(self, __context: Any) -> None:
        # Synchronize correct_answer_id and correct_answer_ids
        if not self.correct_answer_ids and self.correct_answer_id:
            self.correct_answer_ids = [
                k.strip().upper() for k in self.correct_answer_id.split(",") if k.strip()
            ]
        elif self.correct_answer_ids and not self.correct_answer_id:
            self.correct_answer_id = ", ".join(self.correct_answer_ids)
        elif self.correct_answer_ids and self.correct_answer_id:
            # Ensure upper-case
            self.correct_answer_ids = [k.strip().upper() for k in self.correct_answer_ids]
            self.correct_answer_id = self.correct_answer_id.strip().upper()


class Question(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    run_id: str | None = Field(None, description="Workflow execution run UUID4")
    batch_id: str | None = Field(
        None, description="Batch execution UUID4 binding multiple questions"
    )
    section: str
    section_label: str
    subtopic: str
    difficulty: str
    stimulus_text: str | None = None
    question_stem: str
    options: list[OptionChoice]
    correct_answer_id: str
    correct_answer_ids: list[str] = Field(default_factory=list)
    explanation: str
    image_url: str | None = None
    image_svg: str | None = None
    image_description: str | None = None
    final_score: int = 95
    review_rubric: ReviewScore | None = None
    mcat_scaled_score: int | None = Field(
        None, description="Calibrated MCAT section scaled score (118-132)"
    )
    mcat_percentile: str | None = Field(
        None, description="Calibrated percentile rank e.g. '96th Percentile (Top Tier)'"
    )
    aamc_skill: str | None = Field(
        None, description="AAMC SIRS or CARS skill classification"
    )

    iteration_count: int = 1
    iterations_history: list[dict[str, Any]] = Field(default_factory=list)
    total_tokens: int = Field(
        0, description="Total tokens consumed across all agent generation & review cycles"
    )
    prompt_tokens: int = Field(0, description="Total prompt tokens consumed")
    completion_tokens: int = Field(0, description="Total completion tokens generated")
    cost_usd: float = Field(
        0.0, description="Total estimated cost in USD based on exact model rates"
    )
    token_usage_details: list[dict[str, Any]] | dict[str, Any] | None = Field(
        default_factory=list, description="Per-agent granular token and cost breakdown"
    )
    created_at: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())
    updated_at: str | None = None

    # Manager Combination Matrix attributes
    combination_id: str | None = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Combination UUID4 or custom manager code",
    )
    content_domain: str | None = Field(None, description="e.g. Science, Healthcare")
    question_type: str | None = Field(None, description="e.g. Passage_MCQ, True_False_Cant_Tell")
    interaction_type: str | None = Field(
        "single_choice", description="single_choice, multi_choice, drag_drop"
    )
    primary_trap: str | None = Field(None, description="e.g. Keyword_Trap, Partial_Match")
    passage_required: str | None = Field(None, description="Yes or No")
    passage_mode: str | None = Field(
        "single_passage",
        description="single_passage (1 shared passage) or independent (separate scenarios)",
    )
    passage_id: str | None = Field(
        None, description="Shared UUID for questions linked to the same passage"
    )
    passage_questions: int | None = Field(None, description="Number of passage questions e.g. 3, 4")
    visual_type: str | None = Field("None", description="e.g. None, SVG_Diagram, AI_FLUX_Image")

    # Granular Dependent Taxonomy Hierarchy
    subject: str | None = Field(None, description="Taxonomy subject e.g. General Chemistry")
    unit: str | None = Field(None, description="Taxonomy unit e.g. Atomic Structure and Periodicity")
    topic: str | None = Field(None, description="Taxonomy topic e.g. Periodic Trends")
    subskill: str | None = Field(None, description="Granular AAMC subskill focus")
    likely_mistake_pattern: str | None = Field(None, description="Targeted student misconception or mistake pattern")

    # Multi-Stage Raw Outcome JSON
    stage_outcomes: dict[str, Any] | None = Field(
        default_factory=dict, description="Raw outcome JSON of all agent workflow stages"
    )
    option_symmetry: dict[str, Any] | None = Field(
        default_factory=dict,
        description="Option length disparity, symmetry score, and anti-guessability balance metrics",
    )

    def model_post_init(self, __context: Any) -> None:
        if not self.correct_answer_ids and self.correct_answer_id:
            self.correct_answer_ids = [
                k.strip().upper() for k in self.correct_answer_id.split(",") if k.strip()
            ]
        elif self.correct_answer_ids and not self.correct_answer_id:
            self.correct_answer_id = ", ".join(self.correct_answer_ids)

        if not self.mcat_scaled_score:
            scaled_info = calculate_mcat_scaled_score(self.final_score, self.difficulty)
            self.mcat_scaled_score = scaled_info["section_score"]
            if not self.mcat_percentile:
                self.mcat_percentile = scaled_info["percentile"]


class Passage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str | None = None
    text: str
    word_count: int | None = None
    section: str | None = None
    subtopic: str | None = None
    image_url: str | None = None
    image_svg: str | None = None
    image_description: str | None = None
    created_at: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())
    updated_at: str | None = None


class GenerationBatch(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    section: str | None = None
    subtopic: str | None = None
    difficulty: str | None = None
    passage_mode: str | None = None
    target_count: int = 0
    actual_count: int = 0
    total_tokens: int = 0
    cost_usd: float = 0.0
    status: str = "completed"
    created_at: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())
    updated_at: str | None = None


class BatchDeleteRequest(BaseModel):
    """Request body for bulk question deletion."""

    ids: list[str]
