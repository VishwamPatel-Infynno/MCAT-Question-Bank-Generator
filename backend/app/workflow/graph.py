import asyncio
import json
import logging
import uuid
from collections.abc import AsyncGenerator
from typing import Any

from langgraph.graph import END, StateGraph

from app.agents.generator import (
    generate_passage_stimulus,
    generate_question,
    generate_question_with_self_critique,
)
from app.agents.image_generator import generate_image_stimulus
from app.agents.option_balancer import (
    balance_and_shuffle_options,
    calculate_option_symmetry,
)
from app.agents.regenerator import regenerate_question
from app.agents.reviewer import review_question
from app.core.config import config
from app.repositories.question_repo import save_question
from app.schemas import (
    UCAT_SECTION_LABELS,
    GenerationRequest,
    OptionChoice,
    Question,
    QuestionDraft,
    ReviewScore,
    UCATSection,
    WorkflowEvent,
)
from app.workflow.state import AgentWorkflowState

logger = logging.getLogger(__name__)


async def fused_generator_node(state: AgentWorkflowState) -> dict[str, Any]:
    """
    Fused Draft-and-Critique node:
    Generates the question AND self-scores it in a single LLM round-trip.
    If self_score > 90, sets fused_self_passed=True to bypass redundant review calls.
    If self_score <= 90 or critique is missing, sets fused_self_passed=False to route
    to the standard Reviewer node for a full independent audit and remediation loop.
    """
    req = GenerationRequest(**state["request"])
    logger.info("Executing Fused Question Generator & Self-Critique Agent...")
    draft, self_review, usage = await generate_question_with_self_critique(req)

    agent_entry = {
        "agent": "Question Generator",
        "iteration": 1,
        "prompt_tokens": usage.prompt_tokens,
        "completion_tokens": usage.completion_tokens,
        "total_tokens": usage.total_tokens,
        "cost_usd": usage.cost_usd,
    }

    breakdown = list(state.get("agent_usage_breakdown", []))
    breakdown.append(agent_entry)

    p_tokens = state.get("total_prompt_tokens", 0) + usage.prompt_tokens
    c_tokens = state.get("total_completion_tokens", 0) + usage.completion_tokens
    t_tokens = state.get("total_tokens", 0) + usage.total_tokens
    t_cost = round(state.get("total_cost_usd", 0.0) + usage.cost_usd, 7)

    outcomes = dict(state.get("stage_outcomes", {}))
    outcomes["drafting"] = draft.model_dump()
    outcomes["option_symmetry"] = calculate_option_symmetry(draft.options, draft.correct_answer_ids)
    if self_review:
        outcomes["self_critique"] = self_review.model_dump()
        outcomes["quality_audit"] = self_review.model_dump()

    fused_self_passed = (
        self_review is not None
        and self_review.total_score > config.PASSING_SCORE_THRESHOLD
    )

    existing_history = list(state.get("iterations_history", []))
    if self_review:
        existing_history.append({
            "iteration": 1,
            "draft": draft.model_dump(),
            "review": self_review.model_dump(),
            "usage": usage.model_dump(),
        })

    return {
        "current_draft": draft.model_dump(),
        "current_review": self_review.model_dump() if self_review else None,
        "active_agent": "Question Generator",
        "status": "fused_passed" if fused_self_passed else "fused_drafted",
        "iteration_count": 1,
        "iterations_history": existing_history,
        "total_tokens": t_tokens,
        "total_prompt_tokens": p_tokens,
        "total_completion_tokens": c_tokens,
        "total_cost_usd": t_cost,
        "agent_usage_breakdown": breakdown,
        "latest_usage": usage.model_dump(),
        "stage_outcomes": outcomes,
        "fused_self_passed": fused_self_passed,
    }


def route_after_fused_generation(state: AgentWorkflowState) -> str:
    """Routes to finalize (or image_generator) if fused self-score > 90; else to reviewer."""
    fused_passed = state.get("fused_self_passed", False)
    if not fused_passed:
        logger.info("Fused self-critique <= threshold or unverified. Routing to Reviewer for standard audit.")
        return "reviewer"

    req_data = state["request"]
    sec_raw = req_data.get("section", "")
    section_val = sec_raw.value if hasattr(sec_raw, "value") else str(sec_raw)
    explicit_image = req_data.get("require_image", False)
    visual_type = req_data.get("visual_type", "None")

    if explicit_image or visual_type in ("SVG_Diagram", "AI_FLUX_Image"):
        requires_image = True
    elif section_val in (
        UCATSection.VERBAL_REASONING.value,
        UCATSection.SITUATIONAL_JUDGEMENT.value,
        "VR",
        "SJT",
    ):
        requires_image = False
    elif section_val in (UCATSection.ABSTRACT_REASONING.value, "AR"):
        requires_image = True
    else:
        requires_image = bool(state.get("current_draft", {}).get("image_needed", False))

    if requires_image:
        logger.info("Fused draft passed (> 90). Routing to Image Generator.")
        return "image_generator"

    logger.info("Fused draft passed (> 90). Routing directly to Finalize.")
    return "finalize"


async def generator_node(state: AgentWorkflowState) -> dict[str, Any]:
    req = GenerationRequest(**state["request"])
    logger.info("Executing Question Generator Agent...")
    draft, usage = await generate_question(req)

    agent_entry = {
        "agent": "Question Generator",
        "iteration": 1,
        "prompt_tokens": usage.prompt_tokens,
        "completion_tokens": usage.completion_tokens,
        "total_tokens": usage.total_tokens,
        "cost_usd": usage.cost_usd,
    }

    breakdown = list(state.get("agent_usage_breakdown", []))
    breakdown.append(agent_entry)

    p_tokens = state.get("total_prompt_tokens", 0) + usage.prompt_tokens
    c_tokens = state.get("total_completion_tokens", 0) + usage.completion_tokens
    t_tokens = state.get("total_tokens", 0) + usage.total_tokens
    t_cost = round(state.get("total_cost_usd", 0.0) + usage.cost_usd, 7)

    outcomes = dict(state.get("stage_outcomes", {}))
    outcomes["drafting"] = draft.model_dump()
    outcomes["option_symmetry"] = calculate_option_symmetry(draft.options, draft.correct_answer_ids)

    return {
        "current_draft": draft.model_dump(),
        "active_agent": "Question Generator",
        "status": "generated_draft",
        "iteration_count": 1,
        "total_tokens": t_tokens,
        "total_prompt_tokens": p_tokens,
        "total_completion_tokens": c_tokens,
        "total_cost_usd": t_cost,
        "agent_usage_breakdown": breakdown,
        "latest_usage": usage.model_dump(),
        "stage_outcomes": outcomes,
    }


async def reviewer_node(state: AgentWorkflowState) -> dict[str, Any]:
    req = GenerationRequest(**state["request"])
    draft = QuestionDraft(**state["current_draft"])
    iteration = state.get("iteration_count", 1)

    logger.info(f"Executing Question Reviewer Agent (Iteration {iteration})...")
    review, usage = await review_question(draft, req, iteration)

    agent_entry = {
        "agent": "Question Reviewer",
        "iteration": iteration,
        "prompt_tokens": usage.prompt_tokens,
        "completion_tokens": usage.completion_tokens,
        "total_tokens": usage.total_tokens,
        "cost_usd": usage.cost_usd,
    }
    breakdown = list(state.get("agent_usage_breakdown", []))
    breakdown.append(agent_entry)

    p_tokens = state.get("total_prompt_tokens", 0) + usage.prompt_tokens
    c_tokens = state.get("total_completion_tokens", 0) + usage.completion_tokens
    t_tokens = state.get("total_tokens", 0) + usage.total_tokens
    t_cost = round(state.get("total_cost_usd", 0.0) + usage.cost_usd, 7)

    history_entry = {
        "iteration": iteration,
        "draft": draft.model_dump(),
        "review": review.model_dump(),
        "usage": usage.model_dump(),
    }

    existing_history = list(state.get("iterations_history", []))
    existing_history.append(history_entry)

    outcomes = dict(state.get("stage_outcomes", {}))
    outcomes["quality_audit"] = review.model_dump()

    return {
        "current_review": review.model_dump(),
        "iterations_history": existing_history,
        "active_agent": "Question Reviewer",
        "status": f"reviewed_iteration_{iteration}",
        "total_tokens": t_tokens,
        "total_prompt_tokens": p_tokens,
        "total_completion_tokens": c_tokens,
        "total_cost_usd": t_cost,
        "agent_usage_breakdown": breakdown,
        "latest_usage": usage.model_dump(),
        "stage_outcomes": outcomes,
    }


async def regenerator_node(state: AgentWorkflowState) -> dict[str, Any]:
    req = GenerationRequest(**state["request"])
    draft = QuestionDraft(**state["current_draft"])
    review = ReviewScore(**state["current_review"])
    next_iteration = state.get("iteration_count", 1) + 1

    logger.info(
        f"Executing Question Re-Generator Agent (Score {review.total_score} <= 90 -> Iteration {next_iteration})..."
    )
    new_draft, usage = await regenerate_question(draft, review, req, next_iteration)
    new_draft, _ = balance_and_shuffle_options(new_draft)
    reg_symmetry = calculate_option_symmetry(new_draft.options, new_draft.correct_answer_ids)

    agent_entry = {
        "agent": "Question Re-Generator",
        "iteration": next_iteration,
        "prompt_tokens": usage.prompt_tokens,
        "completion_tokens": usage.completion_tokens,
        "total_tokens": usage.total_tokens,
        "cost_usd": usage.cost_usd,
    }
    breakdown = list(state.get("agent_usage_breakdown", []))
    breakdown.append(agent_entry)

    p_tokens = state.get("total_prompt_tokens", 0) + usage.prompt_tokens
    c_tokens = state.get("total_completion_tokens", 0) + usage.completion_tokens
    t_tokens = state.get("total_tokens", 0) + usage.total_tokens
    t_cost = round(state.get("total_cost_usd", 0.0) + usage.cost_usd, 7)

    outcomes = dict(state.get("stage_outcomes", {}))
    outcomes["option_symmetry"] = reg_symmetry
    outcomes["polish_refine"] = {
        "iteration": next_iteration,
        "improved_draft": new_draft.model_dump(),
        "usage": usage.model_dump(),
    }

    return {
        "current_draft": new_draft.model_dump(),
        "iteration_count": next_iteration,
        "active_agent": "Question Re-Generator",
        "status": f"regenerated_draft_{next_iteration}",
        "total_tokens": t_tokens,
        "total_prompt_tokens": p_tokens,
        "total_completion_tokens": c_tokens,
        "total_cost_usd": t_cost,
        "agent_usage_breakdown": breakdown,
        "latest_usage": usage.model_dump(),
        "stage_outcomes": outcomes,
    }


def route_after_review(state: AgentWorkflowState) -> str:
    review = state.get("current_review")
    iteration = state.get("iteration_count", 1)
    req_data = state["request"]

    score = review.get("total_score", 100) if review else 100
    threshold = config.PASSING_SCORE_THRESHOLD
    max_attempts = config.MAX_REGENERATION_ATTEMPTS

    # Strict Quality Gate check
    if score <= threshold:
        if iteration < max_attempts:
            logger.info(
                f"Score {score} <= {threshold} and iteration {iteration} < {max_attempts}. Routing to Re-Generator."
            )
            return "regenerator"
        else:
            logger.warning(
                f"Score {score} <= {threshold} after max attempts ({max_attempts}). Strict Quality Gate: Halting workflow."
            )
            return "reject"

    # Passing score (> 90): check if image generation is required
    sec_raw = req_data.get("section", "")
    section_val = sec_raw.value if hasattr(sec_raw, "value") else str(sec_raw)
    explicit_image = req_data.get("require_image", False)
    visual_type = req_data.get("visual_type", "None")

    if explicit_image or visual_type in ("SVG_Diagram", "AI_FLUX_Image"):
        requires_image = True
    elif section_val in (
        UCATSection.VERBAL_REASONING.value,
        UCATSection.SITUATIONAL_JUDGEMENT.value,
        "VR",
        "SJT",
    ):
        # Strict Exam Rubric Guard: Verbal Reasoning and SJT are 100% textual, bypass image generator
        requires_image = False
    elif section_val in (UCATSection.ABSTRACT_REASONING.value, "AR"):
        # Abstract Reasoning always requires visual geometric stimulus
        requires_image = True
    else:
        # Decision Making (Venn/Logic) or Quantitative Reasoning: respect draft image_needed flag
        requires_image = bool(state.get("current_draft", {}).get("image_needed", False))

    if requires_image:
        logger.info(f"Score {score} > {threshold}. Routing to Image Generator.")
        return "image_generator"

    logger.info(f"Score {score} > {threshold}. Routing to Finalize.")
    return "finalize"


async def reject_node(state: AgentWorkflowState) -> dict[str, Any]:
    """
    Quality Gate Reject Node:
    Triggered when candidate question fails to score > 90 after max attempts.
    Halts workflow: Bypasses image generation and does NOT persist to database.
    """
    req = GenerationRequest(**state["request"])
    draft = QuestionDraft(**state["current_draft"])
    review = ReviewScore(**state["current_review"]) if state.get("current_review") else None

    final_score = review.total_score if review else 0
    iteration = state.get("iteration_count", 1)

    logger.warning(
        f"Strict Quality Gate: Question rejected. Score: {final_score}/100 <= {config.PASSING_SCORE_THRESHOLD} after {iteration} attempts. NOT saving to PostgreSQL."
    )

    rejection_payload = {
        "section": req.section.value,
        "section_label": UCAT_SECTION_LABELS.get(req.section, req.section.value),
        "subtopic": req.subtopic or "Core Syllabus",
        "difficulty": req.difficulty.value,
        "final_score": final_score,
        "threshold": config.PASSING_SCORE_THRESHOLD,
        "review_rubric": review.model_dump() if review else None,
        "iteration_count": iteration,
        "iterations_history": state.get("iterations_history", []),
        "draft": draft.model_dump(),
        "total_tokens": state.get("total_tokens", 0),
        "total_prompt_tokens": state.get("total_prompt_tokens", 0),
        "total_completion_tokens": state.get("total_completion_tokens", 0),
        "total_cost_usd": state.get("total_cost_usd", 0.0),
        "agent_usage_breakdown": state.get("agent_usage_breakdown", []),
        "reason": f"Question scored {final_score}/100, which is less than or equal to the required {config.PASSING_SCORE_THRESHOLD}-point quality benchmark after {iteration} iteration attempts. Generation halted and question discarded from Question Bank.",
    }

    return {
        "status": "rejected_below_threshold",
        "active_agent": "Quality Gate",
        "rejection_data": rejection_payload,
    }


async def image_node(state: AgentWorkflowState) -> dict[str, Any]:
    req = GenerationRequest(**state["request"])
    draft = QuestionDraft(**state["current_draft"])

    logger.info("Executing Image Generator Agent...")
    img_url, img_svg, img_desc, usage = await generate_image_stimulus(draft, req)

    # Accumulate image generation cost and itemized breakdown
    current_cost = state.get("total_cost_usd", 0.0)
    image_cost = usage.get("cost_usd", 0.0) if usage else 0.0
    new_total_cost = round(current_cost + image_cost, 6)

    usage_list = list(state.get("agent_usage_breakdown", []))
    if usage:
        usage_list.append(usage)

    outcomes = dict(state.get("stage_outcomes", {}))
    outcomes["visual_stimulus"] = {
        "image_url": img_url,
        "image_svg": img_svg,
        "image_description": img_desc,
        "usage": usage,
    }

    return {
        "image_url": img_url,
        "image_svg": img_svg,
        "image_description": img_desc,
        "active_agent": "Image Generator",
        "status": "image_generated",
        "total_cost_usd": new_total_cost,
        "agent_usage_breakdown": usage_list,
        "latest_usage": usage,
        "stage_outcomes": outcomes,
    }


async def finalize_node(state: AgentWorkflowState) -> dict[str, Any]:
    req = GenerationRequest(**state["request"])
    draft = QuestionDraft(**state["current_draft"])
    review = ReviewScore(**state["current_review"]) if state.get("current_review") else None

    options = [OptionChoice(**o) if isinstance(o, dict) else o for o in draft.options]
    section_label = UCAT_SECTION_LABELS.get(req.section, req.section.value)
    symmetry = calculate_option_symmetry(options, draft.correct_answer_ids)

    outcomes = dict(state.get("stage_outcomes", {}))
    outcomes["option_symmetry"] = symmetry
    if "polish_refine" not in outcomes:
        outcomes["polish_refine"] = {
            "status": "bypassed",
            "reason": f"Draft achieved passing quality score ({review.total_score if review else 95}/100) on initial audit; regeneration loop was not required.",
        }
    if "visual_stimulus" not in outcomes:
        outcomes["visual_stimulus"] = {
            "status": "bypassed",
            "reason": f"No visual stimulus needed (image_required='{req.image_required or 'No'}', visual_type='{req.visual_type or 'None'}').",
        }
    outcomes["final_payload"] = {
        "id": draft.question_stem[:12],  # placeholder until final_q created below
        "run_id": req.run_id,
        "batch_id": req.batch_id,
        "section": req.section.value,
        "section_label": section_label,
        "combination_id": req.combination_id,
        "content_domain": req.content_domain,
        "question_type": req.question_type,
        "interaction_type": req.interaction_type or "single_choice",
        "primary_trap": req.primary_trap,
        "passage_required": str(req.passage_required) if req.passage_required is not None else None,
        "passage_mode": req.passage_mode or "single_passage",
        "passage_id": req.passage_id,
        "passage_questions": req.passage_questions,
        "visual_type": req.visual_type or "None",
        "image_svg": state.get("image_svg"),
        "image_url": state.get("image_url"),
        "image_description": state.get("image_description"),
        "final_score": review.total_score if review else 95,
        "correct_answer_id": draft.correct_answer_id,
        "correct_answer_ids": draft.correct_answer_ids,
        "total_tokens": state.get("total_tokens", 0),
        "cost_usd": state.get("total_cost_usd", 0.0),
        "option_symmetry": symmetry,
    }

    final_q = Question(
        run_id=req.run_id,
        batch_id=req.batch_id,
        section=req.section.value,
        section_label=section_label,
        subtopic=req.subtopic or "Core Syllabus",
        difficulty=req.difficulty.value,
        stimulus_text=draft.stimulus_text,
        question_stem=draft.question_stem,
        options=options,
        correct_answer_id=draft.correct_answer_id,
        correct_answer_ids=draft.correct_answer_ids,
        explanation=draft.explanation,
        image_url=state.get("image_url"),
        image_svg=state.get("image_svg"),
        image_description=state.get("image_description"),
        final_score=review.total_score if review else 95,
        review_rubric=review,
        iteration_count=state.get("iteration_count", 1),
        iterations_history=state.get("iterations_history", []),
        total_tokens=state.get("total_tokens", 0),
        prompt_tokens=state.get("total_prompt_tokens", 0),
        completion_tokens=state.get("total_completion_tokens", 0),
        cost_usd=state.get("total_cost_usd", 0.0),
        token_usage_details=state.get("agent_usage_breakdown", []),
        combination_id=req.combination_id,
        content_domain=req.content_domain,
        question_type=req.question_type,
        interaction_type=req.interaction_type or "single_choice",
        primary_trap=req.primary_trap,
        passage_required=str(req.passage_required) if req.passage_required is not None else None,
        passage_mode=req.passage_mode or "single_passage",
        passage_id=req.passage_id,
        passage_questions=req.passage_questions,
        visual_type=req.visual_type or "None",
        stage_outcomes=outcomes,
        option_symmetry=symmetry,
    )
    outcomes["final_payload"]["id"] = final_q.id

    # Persist in PostgreSQL ONLY if auto_save is explicitly requested (e.g. testing)
    if getattr(req, "auto_save", False):
        await save_question(final_q)
        logger.info(
            f"Question auto-saved to PostgreSQL Question Bank: {final_q.id} (Score: {final_q.final_score}, Cost: ${final_q.cost_usd:.5f})"
        )
    else:
        logger.info(
            f"Question candidate verified ({final_q.id}, Score: {final_q.final_score}). Staged for Admin Review & Approval."
        )

    return {
        "final_question": final_q.model_dump(),
        "status": "completed",
        "active_agent": "Completed",
        "stage_outcomes": outcomes,
    }


def create_ucat_graph() -> StateGraph:
    """Builds and compiles the multi-agent LangGraph workflow with Fused Generator."""
    workflow = StateGraph(AgentWorkflowState)

    workflow.add_node("fused_generator", fused_generator_node)
    workflow.add_node("generator", generator_node)
    workflow.add_node("reviewer", reviewer_node)
    workflow.add_node("regenerator", regenerator_node)
    workflow.add_node("image_generator", image_node)
    workflow.add_node("finalize", finalize_node)
    workflow.add_node("reject", reject_node)

    # Edges
    workflow.set_entry_point("fused_generator")
    workflow.add_conditional_edges(
        "fused_generator",
        route_after_fused_generation,
        {
            "reviewer": "reviewer",
            "image_generator": "image_generator",
            "finalize": "finalize",
        },
    )
    workflow.add_edge("generator", "reviewer")

    workflow.add_conditional_edges(
        "reviewer",
        route_after_review,
        {
            "regenerator": "regenerator",
            "image_generator": "image_generator",
            "finalize": "finalize",
            "reject": "reject",
        },
    )

    workflow.add_edge("regenerator", "reviewer")
    workflow.add_edge("image_generator", "finalize")
    workflow.add_edge("finalize", END)
    workflow.add_edge("reject", END)

    return workflow.compile()


# Global compiled graph
ucat_graph = create_ucat_graph()


async def run_workflow_stream(req: GenerationRequest) -> AsyncGenerator[str, None]:
    """
    Streams multi-agent workflow events in real time as Server-Sent Events (SSE).
    Supports generating single or multiple questions in one shot (batch).
    Emits batch_progress and question_generated as each question finishes,
    culminating in workflow_complete with all staged questions for user confirmation.
    """
    total_qty = min(max(req.questions_to_generate or 1, 1), 5)
    batch_id = req.batch_id or (str(uuid.uuid4()) if total_qty > 1 else None)

    # Determine format breakdown
    if req.multi_choice_count is not None:
        multi_count = min(max(req.multi_choice_count, 0), total_qty)
    elif req.interaction_type == "multi_choice":
        multi_count = total_qty
    else:
        multi_count = 0
    single_count = total_qty - multi_count

    if req.passage_count is not None:
        passage_count = min(max(req.passage_count, 0), total_qty)
    elif req.passage_required and str(req.passage_required).lower() in ("yes", "true"):
        passage_count = total_qty
    else:
        passage_count = 0

    passage_mode = req.passage_mode or "single_passage"
    # Single passage set activated when passage_mode == "single_passage" and passage required or passage questions requested
    is_passage_mode_active = (
        passage_mode == "single_passage"
        and (
            str(req.passage_required).lower() in ("yes", "true")
            or passage_count > 0
            or req.passage_question_count is not None
        )
    )

    if is_passage_mode_active:
        effective_passage_count = min(req.passage_question_count if req.passage_question_count is not None else total_qty, total_qty)
        is_single_passage_set = effective_passage_count > 0
    else:
        effective_passage_count = 0
        is_single_passage_set = False

    independent_count = total_qty - effective_passage_count
    is_mixed_set = effective_passage_count > 0 and independent_count > 0

    # Format breakdown for passage-linked questions
    if req.passage_multi_count is not None:
        p_multi = min(req.passage_multi_count, effective_passage_count)
    elif req.multi_choice_count is not None:
        p_multi = min(req.multi_choice_count, effective_passage_count)
    elif req.interaction_type == "multi_choice":
        p_multi = effective_passage_count
    else:
        p_multi = 0
    p_single = effective_passage_count - p_multi

    # Format breakdown for independent questions
    if req.independent_multi_count is not None:
        ind_multi = min(req.independent_multi_count, independent_count)
    elif req.multi_choice_count is not None:
        rem_multi = max(0, req.multi_choice_count - p_multi)
        ind_multi = min(rem_multi, independent_count)
    elif req.interaction_type == "multi_choice":
        ind_multi = independent_count
    else:
        ind_multi = 0
    ind_single = independent_count - ind_multi

    # Total aggregated single and multi counts across the entire batch
    total_batch_multi = p_multi + ind_multi
    total_batch_single = p_single + ind_single

    shared_passage_id = req.passage_id or (str(uuid.uuid4()) if is_single_passage_set else None)
    shared_passage_text = req.shared_stimulus
    passage_tokens = 0
    passage_prompt_tokens = 0
    passage_completion_tokens = 0
    passage_cost = 0.0

    def make_event(
        event_type: str,
        agent_name: str,
        message: str,
        data: dict[str, Any] | None = None,
        run_id: str | None = None,
    ) -> WorkflowEvent:
        return WorkflowEvent(
            run_id=run_id or req.run_id,
            batch_id=batch_id,
            event_type=event_type,
            agent_name=agent_name,
            message=message,
            data=data,
        )

    all_staged_questions: list[dict[str, Any]] = []
    cumulative_tokens = 0
    cumulative_prompt_tokens = 0
    cumulative_completion_tokens = 0
    cumulative_cost = 0.0
    all_agent_usage = []
    tasks: list[asyncio.Task] = []

    try:
        # If Single Passage Set mode, generate the shared reading passage first if not already provided
        if is_single_passage_set:
            if not shared_passage_text:
                passage_start_evt = make_event(
                    event_type="agent_start",
                    agent_name="Passage Writer",
                    message=f"Writing 250-400 word shared reading passage for {effective_passage_count} linked questions ({req.section.value})...",
                    data={
                        "stage": "passage_drafting",
                        "total_questions": total_qty,
                        "passage_question_count": effective_passage_count,
                        "independent_question_count": independent_count,
                        "batch_id": batch_id,
                        "passage_id": shared_passage_id,
                    },
                )
                yield f"data: {passage_start_evt.model_dump_json()}\n\n"

                shared_passage_text, passage_usage = await generate_passage_stimulus(req)
                passage_tokens = passage_usage.total_tokens
                passage_prompt_tokens = passage_usage.prompt_tokens
                passage_completion_tokens = passage_usage.completion_tokens
                passage_cost = passage_usage.cost_usd

                all_agent_usage.append({
                    "agent": "Passage Writer",
                    "iteration": 1,
                    "prompt_tokens": passage_usage.prompt_tokens,
                    "completion_tokens": passage_usage.completion_tokens,
                    "total_tokens": passage_usage.total_tokens,
                    "cost_usd": passage_usage.cost_usd,
                })

                word_count = len(shared_passage_text.split())
                passage_done_evt = make_event(
                    event_type="agent_complete",
                    agent_name="Passage Writer",
                    message=f"Shared reading passage completed ({word_count} words). Now drafting questions ({effective_passage_count} linked, {independent_count} independent)...",
                    data={
                        "stage": "passage_drafting",
                        "passage_text": shared_passage_text,
                        "passage_id": shared_passage_id,
                        "word_count": word_count,
                        "latest_usage": passage_usage.model_dump(),
                    },
                )
                yield f"data: {passage_done_evt.model_dump_json()}\n\n"

        # Initial workflow start
        if is_mixed_set:
            start_msg = f"Starting UK UCAT Mixed Batch ({total_qty} questions: {effective_passage_count} linked to shared passage [{p_single} Single, {p_multi} Multi], {independent_count} independent [{ind_single} Single, {ind_multi} Multi])..."
        elif is_single_passage_set:
            start_msg = f"Starting UK UCAT Passage Set ({total_qty} questions: {p_single} Single, {p_multi} Multi-Choice) on shared passage..."
        elif total_qty == 1:
            start_msg = f"Starting UK UCAT Generation Workflow for {req.section.value} ({req.difficulty.value}) using {req.model_name or config.DEFAULT_TEXT_MODEL}..."
        else:
            start_msg = f"Starting UK UCAT Parallel Batch Generation: {total_qty} questions ({total_batch_single} Single, {total_batch_multi} Multi-Choice) in parallel..."

        start_evt = make_event(
            event_type="workflow_start",
            agent_name="System",
            message=start_msg,
            data={
                "total_questions": total_qty,
                "single_count": total_batch_single,
                "multi_count": total_batch_multi,
                "passage_count": effective_passage_count,
                "passage_question_count": effective_passage_count,
                "independent_question_count": independent_count,
                "passage_single_count": p_single,
                "passage_multi_count": p_multi,
                "independent_single_count": ind_single,
                "independent_multi_count": ind_multi,
                "is_mixed_set": is_mixed_set,
                "batch_id": batch_id,
                "passage_id": shared_passage_id,
                "passage_mode": "mixed_set" if is_mixed_set else ("single_passage" if is_single_passage_set else "independent"),
                "shared_passage": shared_passage_text if is_single_passage_set else None,
            },
        )
        yield f"data: {start_evt.model_dump_json()}\n\n"

        MAX_CONCURRENCY = 5
        semaphore = asyncio.Semaphore(MAX_CONCURRENCY)
        event_queue: asyncio.Queue[WorkflowEvent | None] = asyncio.Queue()

        outcomes_questions: list[dict[str, Any] | None] = [None] * total_qty
        outcomes_tokens: list[int] = [0] * total_qty
        outcomes_prompt_tokens: list[int] = [0] * total_qty
        outcomes_completion_tokens: list[int] = [0] * total_qty
        outcomes_costs: list[float] = [0.0] * total_qty
        outcomes_usage: list[list[dict[str, Any]]] = [[] for _ in range(total_qty)]

        async def _worker(idx: int) -> None:
            async with semaphore:
                item_run_id = str(uuid.uuid4()) if total_qty > 1 else req.run_id
                is_passage_item = (idx < effective_passage_count)

                if is_passage_item:
                    is_item_multi = (idx < p_multi)
                    item_interaction = "multi_choice" if is_item_multi else "single_choice"
                    item_passage = "Yes"
                    item_passage_mode = "single_passage"
                    item_passage_id = shared_passage_id
                    item_stimulus = shared_passage_text
                else:
                    rel_idx = idx - effective_passage_count
                    is_item_multi = (rel_idx < ind_multi)
                    item_interaction = "multi_choice" if is_item_multi else "single_choice"
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

                if total_qty > 1:
                    if is_passage_item:
                        worker_msg = f"[{idx + 1}/{total_qty}] Writing linked {item_interaction.replace('_', ' ').title()} question from shared passage..."
                    else:
                        worker_msg = f"[{idx + 1}/{total_qty}] Writing independent {item_interaction.replace('_', ' ').title()} question (standalone scenario)..."

                    batch_prog_evt = make_event(
                        event_type="batch_progress",
                        agent_name="System",
                        message=worker_msg,
                        data={
                            "current_index": idx + 1,
                            "total_count": total_qty,
                            "interaction_type": item_interaction,
                            "passage_required": item_passage,
                            "passage_mode": item_passage_mode,
                            "passage_id": item_passage_id,
                            "is_passage_item": is_passage_item,
                            "batch_id": batch_id,
                        },
                        run_id=item_run_id,
                    )
                    await event_queue.put(batch_prog_evt)

                state: AgentWorkflowState = {
                    "request": item_req.model_dump(),
                    "run_id": item_run_id,
                    "batch_id": batch_id,
                    "iteration_count": 1,
                    "iterations_history": [],
                    "log_messages": [],
                    "total_tokens": 0,
                    "total_prompt_tokens": 0,
                    "total_completion_tokens": 0,
                    "total_cost_usd": 0.0,
                    "agent_usage_breakdown": [],
                    "stage_outcomes": {},
                }

                # Step 1: Question Writer
                gen_evt = make_event(
                    event_type="agent_start",
                    agent_name="Question Writer",
                    message=f"Writing question draft {idx + 1}/{total_qty} ({'Multi-Choice' if is_item_multi else 'Single Choice'})...",
                    data={
                        "index": idx + 1,
                        "total": total_qty,
                        "stage": "drafting",
                        "interaction_type": item_interaction,
                        "passage_required": item_passage,
                    },
                    run_id=item_run_id,
                )
                await event_queue.put(gen_evt)

                gen_res = await fused_generator_node(state)
                state.update(gen_res)

                gen_usage = state.get("latest_usage", {})
                gen_done_evt = make_event(
                    event_type="agent_complete",
                    agent_name="Question Writer",
                    message=f"Draft written for Question {idx + 1} ({gen_usage.get('total_tokens', 0)} tokens, ${gen_usage.get('cost_usd', 0.0):.5f}).",
                    data={
                        "draft": state["current_draft"],
                        "latest_usage": gen_usage,
                        "index": idx + 1,
                        "total": total_qty,
                        "stage": "drafting",
                    },
                    run_id=item_run_id,
                )
                await event_queue.put(gen_done_evt)

                # Quality Review / Remediation Loop
                question_passed = True
                if state.get("fused_self_passed"):
                    self_review = state.get("current_review") or {}
                    score = self_review.get("total_score", 95)
                    rev_done_evt = make_event(
                        event_type="agent_complete",
                        agent_name="Quality Reviewer",
                        message=f"Quality review passed (Self-Critique: {score}/100) for Question {idx + 1}.",
                        data={
                            "review": self_review,
                            "iteration": 1,
                            "latest_usage": gen_usage,
                            "index": idx + 1,
                            "total": total_qty,
                            "stage": "reviewing",
                            "score": score,
                        },
                        run_id=item_run_id,
                    )
                    await event_queue.put(rev_done_evt)
                else:
                    while True:
                        iteration = state.get("iteration_count", 1)

                        rev_start_evt = make_event(
                            event_type="agent_start",
                            agent_name="Quality Reviewer",
                            message=f"Reviewing draft {idx + 1}/{total_qty} (Round {iteration}) against 90+ quality standards...",
                            data={
                                "index": idx + 1,
                                "total": total_qty,
                                "stage": "reviewing",
                                "iteration": iteration,
                            },
                            run_id=item_run_id,
                        )
                        await event_queue.put(rev_start_evt)

                        rev_res = await reviewer_node(state)
                        state.update(rev_res)

                        review = state["current_review"]
                        score = review["total_score"]
                        rev_usage = state.get("latest_usage", {})

                        rev_done_evt = make_event(
                            event_type="agent_complete",
                            agent_name="Quality Reviewer",
                            message=f"Quality review completed for Question {idx + 1}. Score: {score}/100.",
                            data={
                                "review": review,
                                "iteration": iteration,
                                "latest_usage": rev_usage,
                                "index": idx + 1,
                                "total": total_qty,
                                "stage": "reviewing",
                                "score": score,
                            },
                            run_id=item_run_id,
                        )
                        await event_queue.put(rev_done_evt)

                        # Route
                        next_step = route_after_review(state)
                        if next_step == "regenerator":
                            regen_start_evt = make_event(
                                event_type="agent_start",
                                agent_name="Question Improver",
                                message=f"Question {idx + 1} score {score}/100 needs improvement. Question Improver is refining answer options...",
                                data={
                                    "index": idx + 1,
                                    "total": total_qty,
                                    "stage": "remediating",
                                    "iteration": iteration,
                                    "score": score,
                                },
                                run_id=item_run_id,
                            )
                            await event_queue.put(regen_start_evt)

                            regen_res = await regenerator_node(state)
                            state.update(regen_res)

                            regen_usage = state.get("latest_usage", {})
                            regen_done_evt = make_event(
                                event_type="agent_complete",
                                agent_name="Question Improver",
                                message=f"Question {idx + 1} improved (Draft v{state['iteration_count']} • {regen_usage.get('total_tokens', 0)} tokens, ${regen_usage.get('cost_usd', 0.0):.5f}). Re-checking with Quality Reviewer...",
                                data={
                                    "draft": state["current_draft"],
                                    "latest_usage": regen_usage,
                                    "index": idx + 1,
                                    "total": total_qty,
                                    "stage": "remediating",
                                },
                                run_id=item_run_id,
                            )
                            await event_queue.put(regen_done_evt)
                            continue
                        elif next_step == "reject":
                            rej_res = await reject_node(state)
                            state.update(rej_res)
                            question_passed = False
                            rej_data = state.get("rejection_data") or {}
                            if isinstance(rej_data, dict):
                                rej_data["index"] = idx + 1
                                rej_data["stage"] = "rejected"
                            rej_evt = make_event(
                                event_type="workflow_rejected",
                                agent_name="Quality Gate",
                                message=f"Quality check not passed for Question {idx + 1} (Score {score}/100 after {iteration} attempts).",
                                data=rej_data,
                                run_id=item_run_id,
                            )
                            await event_queue.put(rej_evt)
                            break
                        else:
                            break

                if question_passed:
                    # Image Generation if required (guarded by Section Image Guard)
                    req_data = state["request"]
                    sec_raw = req_data.get("section", "")
                    section_val = sec_raw.value if hasattr(sec_raw, "value") else str(sec_raw)
                    explicit_image = req_data.get("require_image", False)
                    visual_type = req_data.get("visual_type", "None")

                    if explicit_image or visual_type in ("SVG_Diagram", "AI_FLUX_Image"):
                        requires_image = True
                    elif section_val in (
                        UCATSection.VERBAL_REASONING.value,
                        UCATSection.SITUATIONAL_JUDGEMENT.value,
                        "VR",
                        "SJT",
                    ):
                        requires_image = False
                    elif section_val in (UCATSection.ABSTRACT_REASONING.value, "AR"):
                        requires_image = True
                    else:
                        requires_image = bool(state.get("current_draft", {}).get("image_needed", False))

                    if requires_image:
                        img_start_evt = make_event(
                            event_type="agent_start",
                            agent_name="Diagram & Chart Maker",
                            message=f"Drawing visual stimulus diagram for Question {idx + 1}...",
                            data={
                                "index": idx + 1,
                                "total": total_qty,
                                "stage": "image",
                            },
                            run_id=item_run_id,
                        )
                        await event_queue.put(img_start_evt)

                        img_res = await image_node(state)
                        state.update(img_res)

                        img_done_evt = make_event(
                            event_type="agent_complete",
                            agent_name="Diagram & Chart Maker",
                            message=f"Visual diagram drawn and attached to Question {idx + 1}.",
                            data={
                                "has_svg": bool(state.get("image_svg")),
                                "image_url": state.get("image_url"),
                                "usage": state.get("latest_usage"),
                                "index": idx + 1,
                                "total": total_qty,
                                "stage": "image",
                            },
                            run_id=item_run_id,
                        )
                        await event_queue.put(img_done_evt)

                    # Finalize
                    fin_res = await finalize_node(state)
                    state.update(fin_res)

                    final_q_dict = state["final_question"]
                    final_q_dict["index"] = idx + 1
                    outcomes_questions[idx] = final_q_dict

                    # Emit question_generated event
                    q_gen_evt = make_event(
                        event_type="question_generated",
                        agent_name="System",
                        message=f"Question {idx + 1} of {total_qty} passed quality check (Score: {final_q_dict.get('final_score')}/100) and is ready for review.",
                        data={
                            "question": final_q_dict,
                            "index": idx + 1,
                            "total": total_qty,
                            "batch_id": batch_id,
                            "stage": "completed",
                        },
                        run_id=item_run_id,
                    )
                    await event_queue.put(q_gen_evt)

                outcomes_tokens[idx] = state.get("total_tokens", 0)
                outcomes_prompt_tokens[idx] = state.get("total_prompt_tokens", 0)
                outcomes_completion_tokens[idx] = state.get("total_completion_tokens", 0)
                outcomes_costs[idx] = state.get("total_cost_usd", 0.0)
                outcomes_usage[idx] = state.get("agent_usage_breakdown", [])

        tasks.extend([asyncio.create_task(_worker(i)) for i in range(total_qty)])

        async def _monitor_tasks():
            try:
                await asyncio.gather(*tasks, return_exceptions=True)
            finally:
                await event_queue.put(None)

        _ = asyncio.create_task(_monitor_tasks())

        while True:
            evt = await event_queue.get()
            if evt is None:
                break
            yield f"data: {evt.model_dump_json()}\n\n"

        all_staged_questions = [q for q in outcomes_questions if q is not None]
        cumulative_tokens = sum(outcomes_tokens) + passage_tokens
        cumulative_prompt_tokens = sum(outcomes_prompt_tokens) + passage_prompt_tokens
        cumulative_completion_tokens = sum(outcomes_completion_tokens) + passage_completion_tokens
        cumulative_cost = round(sum(outcomes_costs) + passage_cost, 7)
        for usage_list in outcomes_usage:
            all_agent_usage.extend(usage_list)

        if is_mixed_set:
            complete_msg = (
                f"Mixed Batch generated! {len(all_staged_questions)} questions ({effective_passage_count} linked to shared passage, {independent_count} independent) staged for Review. Total: {cumulative_tokens} tokens (${cumulative_cost:.5f})."
            )
        elif is_single_passage_set and total_qty > 1:
            complete_msg = (
                f"Passage Set generated! {len(all_staged_questions)} questions linked to shared reading passage staged for Review. Total: {cumulative_tokens} tokens (${cumulative_cost:.5f})."
            )
        elif total_qty > 1:
            complete_msg = (
                f"Parallel batch generation completed! {len(all_staged_questions)} of {total_qty} questions staged for User Confirmation. Total: {cumulative_tokens} tokens (${cumulative_cost:.5f})."
            )
        else:
            complete_msg = (
                f"Multi-Agent workflow completed! Candidate question scored {all_staged_questions[0].get('final_score', 95) if all_staged_questions else 95}/100 and is staged for Confirmation. Total: {cumulative_tokens} tokens (${cumulative_cost:.5f})."
            )

        complete_evt = make_event(
            event_type="workflow_complete",
            agent_name="System",
            message=complete_msg,
            data={
                "questions": all_staged_questions,
                "question": all_staged_questions[0] if all_staged_questions else None,
                "batch_id": batch_id,
                "passage_id": shared_passage_id if is_single_passage_set else None,
                "passage_mode": "mixed_set" if is_mixed_set else ("single_passage" if is_single_passage_set else "independent"),
                "is_mixed_set": is_mixed_set,
                "passage_question_count": effective_passage_count,
                "independent_question_count": independent_count,
                "shared_passage": shared_passage_text if is_single_passage_set else None,
                "cumulative_usage": {
                    "total_tokens": cumulative_tokens,
                    "total_prompt_tokens": cumulative_prompt_tokens,
                    "total_completion_tokens": cumulative_completion_tokens,
                    "total_cost_usd": cumulative_cost,
                },
                "usage_breakdown": all_agent_usage,
            },
        )
        yield f"data: {complete_evt.model_dump_json()}\n\n"
    except asyncio.CancelledError:
        logger.info("Workflow stream cancelled by client disconnect.")
        for t in tasks:
            if not t.done():
                t.cancel()
        raise
    except Exception as e:
        logger.error(f"Workflow stream error: {e}")
        err_msg = str(e)
        error_evt = make_event(
            event_type="workflow_error",
            agent_name="System Error",
            message=err_msg,
            data={"error": err_msg},
        )
        yield f"data: {error_evt.model_dump_json()}\n\n"


class WorkflowRunResult:
    def __init__(self, status: str, data: dict[str, Any] | None = None):
        self.status = status
        self.data = data or {}
        raw_q = self.data.get("question")
        self.question = Question(**raw_q) if raw_q else None
        self.stage_outcomes = self.data.get("stage_outcomes", {})
        self.rejection_data = self.data.get("rejection_data")


async def run_workflow(req: GenerationRequest) -> WorkflowRunResult:
    """Non-streaming execution of the multi-agent workflow."""
    status = "failed"
    final_data = {}
    async for raw_chunk in run_workflow_stream(req):
        line = raw_chunk.strip()
        if line.startswith("data: "):
            evt = json.loads(line[6:])
            etype = evt.get("event_type")
            if etype == "workflow_complete":
                status = "approved"
                final_data = evt.get("data", {})
            elif etype == "workflow_rejected":
                status = "rejected_below_threshold"
                final_data = evt.get("data", {})
            elif etype == "workflow_error":
                status = "error"
                final_data = evt.get("data", {})
    return WorkflowRunResult(status, final_data)
