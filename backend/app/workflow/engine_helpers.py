"""
engine_helpers.py — Pure helper functions for the workflow engine.

Extracted from engine.py to keep the main streaming generator focused
on orchestration. These functions have no side-effects and do not touch
the event queue or shared state directly.
"""

import uuid

from app.schemas import GenerationRequest, MCATSection
from app.workflow.state import AgentWorkflowState


def _build_batch_worker_request(
    req: GenerationRequest,
    idx: int,
    total_qty: int,
    batch_id: str | None,
    effective_passage_count: int,
    shared_passage_id: str | None,
    shared_passage_text: str | None,
) -> tuple[GenerationRequest, str, bool, str]:
    """
    Builds an isolated GenerationRequest for an individual question worker within a batch,
    resolving whether the question is passage-linked or independent (strictly single-choice MCAT format).

    Args:
        req: The parent GenerationRequest for the batch.
        idx: Zero-based index of this question within the batch.
        total_qty: Total number of questions in the batch.
        batch_id: UUID of the parent batch record.
        effective_passage_count: Number of questions that are passage-linked (0 = all independent).
        shared_passage_id: UUID shared by all passage-linked items in this batch.
        shared_passage_text: Pre-generated passage text, or None if not yet generated.

    Returns:
        Tuple of (item_req, item_run_id, is_passage_item, item_interaction) where:
        - item_req: Cloned GenerationRequest scoped to a single question.
        - item_run_id: Unique UUID for this question's run.
        - is_passage_item: True if this question is linked to the shared passage.
        - item_interaction: Always "single_choice" (official MCAT format).
    """
    item_run_id = str(uuid.uuid4()) if total_qty > 1 else req.run_id
    is_passage_item = idx < effective_passage_count
    item_interaction = "single_choice"

    if is_passage_item:
        item_passage = "Yes"
        item_passage_mode = "single_passage"
        item_passage_id = shared_passage_id
        item_stimulus = shared_passage_text
    else:
        item_passage = "No"
        item_passage_mode = "independent"
        item_passage_id = None
        item_stimulus = None

    item_req = req.model_copy(
        update={
            "run_id": item_run_id,
            "batch_id": batch_id,
            "questions_to_generate": 1,
            "interaction_type": item_interaction,
            "passage_required": item_passage,
            "passage_mode": item_passage_mode,
            "passage_id": item_passage_id,
            "shared_stimulus": item_stimulus,
        }
    )
    return item_req, item_run_id, is_passage_item, item_interaction


def _determine_item_diagram_requirement(
    state: AgentWorkflowState,
    idx: int,
    is_passage_item: bool,
) -> bool:
    """
    Evaluates whether a specific question item within a batch requires a visual stimulus diagram.

    Respects section type (CARS never has diagrams), passage attachment (passage-linked items
    share the passage diagram and never have their own), explicit image flags from the request,
    and the autonomous AI decision stored in the generated draft.

    Args:
        state: Current AgentWorkflowState for this question worker.
        idx: Zero-based index of this question (informational; not used in logic).
        is_passage_item: Whether this question is linked to the shared reading passage.

    Returns:
        True if a visual stimulus diagram should be generated for this question.
    """
    req_data = state["request"]
    sec_raw = req_data.get("section", "")
    section_val = sec_raw.value if hasattr(sec_raw, "value") else str(sec_raw)
    allow_ai_images = req_data.get("allow_ai_images", False)
    explicit_image = req_data.get("require_image", False)
    visual_type = req_data.get("visual_type", "None")

    # CARS strictly has no figures, data tables or diagrams in official AAMC format
    if section_val in (MCATSection.CARS.value, "CARS", "cars"):
        return False
    if is_passage_item:
        # Passage question items share the passage diagram; they never have internal images
        return False

    # Check if visual generation is permitted at all
    visuals_permitted = (
        allow_ai_images or explicit_image or visual_type in ("SVG_Diagram", "AI_FLUX_Image")
    )
    if not visuals_permitted:
        return False

    # Autonomous AI determination for independent items
    return bool(state.get("current_draft", {}).get("image_needed", False))
