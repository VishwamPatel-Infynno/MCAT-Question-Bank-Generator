import logging
import sys
from typing import Any

from app.agents.generator import (
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
)
from app.workflow.state import AgentWorkflowState

logger = logging.getLogger(__name__)


def _resolve_fn(name: str, fallback: Any) -> Any:
    """Resolves an agent function dynamically from app.workflow.graph if patched during testing."""
    graph_mod = sys.modules.get("app.workflow.graph")
    if graph_mod and hasattr(graph_mod, name):
        return getattr(graph_mod, name)
    return fallback


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
    fused_gen_fn = _resolve_fn(
        "generate_question_with_self_critique", generate_question_with_self_critique
    )
    draft, self_review, usage = await fused_gen_fn(req)

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
        self_review is not None and self_review.total_score > config.PASSING_SCORE_THRESHOLD
    )

    existing_history = list(state.get("iterations_history", []))
    if self_review:
        existing_history.append(
            {
                "iteration": 1,
                "draft": draft.model_dump(),
                "review": self_review.model_dump(),
                "usage": usage.model_dump(),
            }
        )

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


async def generator_node(state: AgentWorkflowState) -> dict[str, Any]:
    req = GenerationRequest(**state["request"])
    logger.info("Executing Question Generator Agent...")
    gen_fn = _resolve_fn("generate_question", generate_question)
    draft, usage = await gen_fn(req)

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
    rev_fn = _resolve_fn("review_question", review_question)
    review, usage = await rev_fn(draft, req, iteration)

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
    regen_fn = _resolve_fn("regenerate_question", regenerate_question)
    new_draft, usage = await regen_fn(draft, review, req, next_iteration)
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
        f"Strict Quality Gate: Question rejected. Score: {final_score}/100 <= {config.PASSING_SCORE_THRESHOLD} after {iteration} attempts. NOT saving to Question Bank repository."
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
    img_fn = _resolve_fn("generate_image_stimulus", generate_image_stimulus)
    img_url, img_svg, img_desc, usage = await img_fn(draft, req)

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
    effective_trap = (
        getattr(draft, "primary_trap", None)
        or (req.primary_trap if req.primary_trap != "Automatic" else None)
        or "Scope_Shift"
    )

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
        "primary_trap": effective_trap,
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
        primary_trap=effective_trap,
        passage_required=str(req.passage_required) if req.passage_required is not None else None,
        passage_mode=req.passage_mode or "single_passage",
        passage_id=req.passage_id,
        passage_questions=req.passage_questions,
        visual_type=req.visual_type or "None",
        stage_outcomes=outcomes,
        option_symmetry=symmetry,
    )
    outcomes["final_payload"]["id"] = final_q.id

    # Persist in Question Bank ONLY if auto_save is explicitly requested (e.g. testing)
    if getattr(req, "auto_save", False):
        await save_question(final_q)
        logger.info(
            f"Question auto-saved to Question Bank repository: {final_q.id} (Score: {final_q.final_score}, Cost: ${final_q.cost_usd:.5f})"
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
