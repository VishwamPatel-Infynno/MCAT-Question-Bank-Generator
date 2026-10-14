import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field


class OptionChoice(BaseModel):
    id: str  # A, B, C, D
    text: str


class ReviewScore(BaseModel):
    audit_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique psychometric audit evaluation UUID4",
    )
    evaluated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    authenticity_score: int = Field(
        ..., ge=0, le=25, description="UCAT authentic tone and style (0-25)"
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
        "", description="Reading passage, clinical case context, or syllogism scenario"
    )
    question_stem: str = Field(..., description="The direct question or prompt to solve")
    options: list[OptionChoice] = Field(
        ..., min_length=4, max_length=4, description="Exactly 4 choices (A, B, C, D)"
    )
    correct_answer_id: str = Field(..., description="Key option id: A, B, C, or D")
    explanation: str = Field(
        ..., description="Comprehensive step-by-step cognitive and pedagogical rationale"
    )
    image_needed: bool = Field(False, description="True if a visual diagram/chart is essential")
    image_prompt_or_type: str | None = Field(
        None, description="Visual description, chart type, or SVG geometry description"
    )


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
    explanation: str
    image_url: str | None = None
    image_svg: str | None = None
    image_description: str | None = None
    final_score: int = 95
    review_rubric: ReviewScore | None = None
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
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

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
    passage_questions: int | None = Field(None, description="Number of passage questions e.g. 3, 4")
    visual_type: str | None = Field("None", description="e.g. None, SVG_Diagram, AI_FLUX_Image")

    # Multi-Stage Raw Outcome JSON
    stage_outcomes: dict[str, Any] | None = Field(
        default_factory=dict, description="Raw outcome JSON of all agent workflow stages"
    )
