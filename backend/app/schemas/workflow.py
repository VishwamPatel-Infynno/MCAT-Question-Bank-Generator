import uuid
from datetime import datetime
from typing import Optional, Dict, Any, Union
from pydantic import BaseModel, Field, field_validator

from app.schemas.ucat import UCATSection, Difficulty, normalize_section

class GenerationRequest(BaseModel):
    section: UCATSection
    subtopic: Optional[str] = None
    difficulty: Difficulty = Difficulty.MEDIUM
    require_image: bool = False
    custom_prompt: Optional[str] = None
    model_name: Optional[str] = None
    api_key: Optional[str] = None

    # Execution & Batch UUID Identifiers
    run_id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique execution run UUID4")
    batch_id: Optional[str] = Field(None, description="Optional batch run UUID4 binding multiple questions")

    # Manager Combination Matrix attributes
    combination_id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), description="Combination UUID4 or custom code e.g. CMB00001")
    subcategory: Optional[str] = Field(None, description="e.g. Inference")
    content_domain: Optional[str] = Field(None, description="e.g. Science, Healthcare")
    question_type: Optional[str] = Field(None, description="e.g. Passage_MCQ, True_False_Cant_Tell")
    interaction_type: Optional[str] = Field("single_choice", description="single_choice, multi_choice, drag_drop")
    primary_trap: Optional[str] = Field(None, description="e.g. Keyword_Trap, Partial_Match")
    passage_required: Optional[Union[str, bool]] = Field(None, description="Yes or No")
    passage_questions: Optional[int] = Field(None, description="Number of passage questions e.g. 3, 4")
    image_required: Optional[Union[str, bool]] = Field(None, description="Yes or No")
    visual_type: Optional[str] = Field("None", description="e.g. None, SVG_Diagram, AI_FLUX_Image")
    questions_to_generate: Optional[int] = Field(1, description="Quantity to generate from this combination")

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
        return v

class WorkflowEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique SSE event UUID4")
    run_id: Optional[str] = Field(None, description="Execution run UUID4")
    batch_id: Optional[str] = Field(None, description="Batch execution UUID4")
    event_type: str  # 'workflow_start', 'agent_start', 'agent_complete', 'workflow_complete', 'workflow_rejected', 'workflow_error'
    agent_name: str  # 'Question Generator', 'Question Reviewer', 'Question Re-Generator', 'Image Generator', 'Quality Gate', 'System'
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

