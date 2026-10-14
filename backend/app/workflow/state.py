from typing import List, Dict, Any, Optional, TypedDict

class AgentWorkflowState(TypedDict, total=False):
    request: Dict[str, Any]
    current_draft: Optional[Dict[str, Any]]
    current_review: Optional[Dict[str, Any]]
    iteration_count: int
    iterations_history: List[Dict[str, Any]]
    image_url: Optional[str]
    image_svg: Optional[str]
    image_description: Optional[str]
    final_question: Optional[Dict[str, Any]]
    rejection_data: Optional[Dict[str, Any]]
    status: str
    active_agent: str
    log_messages: List[str]
    # Token usage & cost tracking
    total_tokens: int
    total_prompt_tokens: int
    total_completion_tokens: int
    total_cost_usd: float
    agent_usage_breakdown: List[Dict[str, Any]]
    latest_usage: Optional[Dict[str, Any]]
