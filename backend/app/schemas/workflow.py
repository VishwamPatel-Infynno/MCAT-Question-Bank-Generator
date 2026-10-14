from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

from app.schemas.ucat import UCATSection, Difficulty

class GenerationRequest(BaseModel):
    section: UCATSection
    subtopic: Optional[str] = None
    difficulty: Difficulty = Difficulty.MEDIUM
    require_image: bool = False
    custom_prompt: Optional[str] = None
    model_name: Optional[str] = None
    api_key: Optional[str] = None

class WorkflowEvent(BaseModel):
    event_type: str  # 'workflow_start', 'agent_start', 'agent_complete', 'workflow_complete', 'workflow_rejected', 'workflow_error'
    agent_name: str  # 'Question Generator', 'Question Reviewer', 'Question Re-Generator', 'Image Generator', 'Quality Gate', 'System'
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
