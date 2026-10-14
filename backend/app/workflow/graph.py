import json
import logging
from typing import Dict, Any, AsyncGenerator, Optional
from langgraph.graph import StateGraph, END
from app.config import config
from app.schemas import (
    GenerationRequest, QuestionDraft, ReviewScore, Question,
    OptionChoice, UCATSection, UCAT_SECTION_LABELS, WorkflowEvent
)
from app.agents.generator import generate_question
from app.agents.reviewer import review_question
from app.agents.regenerator import regenerate_question
from app.agents.image_generator import generate_image_stimulus
from app.database import save_question
from app.workflow.state import AgentWorkflowState

logger = logging.getLogger(__name__)

async def generator_node(state: AgentWorkflowState) -> Dict[str, Any]:
    req = GenerationRequest(**state["request"])
    logger.info("Executing Question Generator Agent...")
    draft, usage = await generate_question(req)
    
    agent_entry = {
        "agent": "Question Generator",
        "iteration": 1,
        "prompt_tokens": usage.prompt_tokens,
        "completion_tokens": usage.completion_tokens,
        "total_tokens": usage.total_tokens,
        "cost_usd": usage.cost_usd
    }
    
    breakdown = list(state.get("agent_usage_breakdown", []))
    breakdown.append(agent_entry)
    
    p_tokens = state.get("total_prompt_tokens", 0) + usage.prompt_tokens
    c_tokens = state.get("total_completion_tokens", 0) + usage.completion_tokens
    t_tokens = state.get("total_tokens", 0) + usage.total_tokens
    t_cost = round(state.get("total_cost_usd", 0.0) + usage.cost_usd, 7)
    
    outcomes = dict(state.get("stage_outcomes", {}))
    outcomes["drafting"] = draft.model_dump()
    
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
        "stage_outcomes": outcomes
    }

async def reviewer_node(state: AgentWorkflowState) -> Dict[str, Any]:
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
        "cost_usd": usage.cost_usd
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
        "usage": usage.model_dump()
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
        "stage_outcomes": outcomes
    }

async def regenerator_node(state: AgentWorkflowState) -> Dict[str, Any]:
    req = GenerationRequest(**state["request"])
    draft = QuestionDraft(**state["current_draft"])
    review = ReviewScore(**state["current_review"])
    next_iteration = state.get("iteration_count", 1) + 1
    
    logger.info(f"Executing Question Re-Generator Agent (Score {review.total_score} <= 90 -> Iteration {next_iteration})...")
    new_draft, usage = await regenerate_question(draft, review, req, next_iteration)
    
    agent_entry = {
        "agent": "Question Re-Generator",
        "iteration": next_iteration,
        "prompt_tokens": usage.prompt_tokens,
        "completion_tokens": usage.completion_tokens,
        "total_tokens": usage.total_tokens,
        "cost_usd": usage.cost_usd
    }
    breakdown = list(state.get("agent_usage_breakdown", []))
    breakdown.append(agent_entry)
    
    p_tokens = state.get("total_prompt_tokens", 0) + usage.prompt_tokens
    c_tokens = state.get("total_completion_tokens", 0) + usage.completion_tokens
    t_tokens = state.get("total_tokens", 0) + usage.total_tokens
    t_cost = round(state.get("total_cost_usd", 0.0) + usage.cost_usd, 7)

    outcomes = dict(state.get("stage_outcomes", {}))
    outcomes["polish_refine"] = {
        "iteration": next_iteration,
        "improved_draft": new_draft.model_dump(),
        "usage": usage.model_dump()
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
        "stage_outcomes": outcomes
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
            logger.info(f"Score {score} <= {threshold} and iteration {iteration} < {max_attempts}. Routing to Re-Generator.")
            return "regenerator"
        else:
            logger.warning(f"Score {score} <= {threshold} after max attempts ({max_attempts}). Strict Quality Gate: Halting workflow.")
            return "reject"
    
    # Passing score (> 90): check if image generation is required
    requires_image = (
        req_data.get("require_image", False) or
        req_data.get("section") == UCATSection.ABSTRACT_REASONING.value or
        state.get("current_draft", {}).get("image_needed", False)
    )
    
    if requires_image:
        logger.info(f"Score {score} > {threshold}. Routing to Image Generator.")
        return "image_generator"
        
    logger.info(f"Score {score} > {threshold}. Routing to Finalize.")
    return "finalize"

async def reject_node(state: AgentWorkflowState) -> Dict[str, Any]:
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
    
    logger.warning(f"Strict Quality Gate: Question rejected. Score: {final_score}/100 <= {config.PASSING_SCORE_THRESHOLD} after {iteration} attempts. NOT saving to PostgreSQL.")
    
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
        "reason": f"Question scored {final_score}/100, which is less than or equal to the required {config.PASSING_SCORE_THRESHOLD}-point quality benchmark after {iteration} iteration attempts. Generation halted and question discarded from Question Bank."
    }
    
    return {
        "status": "rejected_below_threshold",
        "active_agent": "Quality Gate",
        "rejection_data": rejection_payload
    }

async def image_node(state: AgentWorkflowState) -> Dict[str, Any]:
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
        "usage": usage
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
        "stage_outcomes": outcomes
    }

async def finalize_node(state: AgentWorkflowState) -> Dict[str, Any]:
    req = GenerationRequest(**state["request"])
    draft = QuestionDraft(**state["current_draft"])
    review = ReviewScore(**state["current_review"]) if state.get("current_review") else None
    
    options = [OptionChoice(**o) if isinstance(o, dict) else o for o in draft.options]
    section_label = UCAT_SECTION_LABELS.get(req.section, req.section.value)
    
    outcomes = dict(state.get("stage_outcomes", {}))
    if "polish_refine" not in outcomes:
        outcomes["polish_refine"] = {
            "status": "bypassed",
            "reason": f"Draft achieved passing quality score ({review.total_score if review else 95}/100) on initial audit; regeneration loop was not required."
        }
    if "visual_stimulus" not in outcomes:
        outcomes["visual_stimulus"] = {
            "status": "bypassed",
            "reason": f"No visual stimulus needed (image_required='{req.image_required or 'No'}', visual_type='{req.visual_type or 'None'}')."
        }
    outcomes["final_payload"] = {
        "id": draft.question_stem[:12], # placeholder until final_q created below
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
        "passage_questions": req.passage_questions,
        "visual_type": req.visual_type or "None",
        "final_score": review.total_score if review else 95,
        "correct_answer_id": draft.correct_answer_id,
        "total_tokens": state.get("total_tokens", 0),
        "cost_usd": state.get("total_cost_usd", 0.0)
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
        passage_questions=req.passage_questions,
        visual_type=req.visual_type or "None",
        stage_outcomes=outcomes
    )
    outcomes["final_payload"]["id"] = final_q.id
    
    # Persist in PostgreSQL
    await save_question(final_q)
    logger.info(f"Question saved to PostgreSQL Question Bank: {final_q.id} (Score: {final_q.final_score}, Cost: ${final_q.cost_usd:.5f})")
    
    return {
        "final_question": final_q.model_dump(),
        "status": "completed",
        "active_agent": "Completed",
        "stage_outcomes": outcomes
    }

def create_ucat_graph() -> StateGraph:
    """Builds and compiles the multi-agent LangGraph workflow."""
    workflow = StateGraph(AgentWorkflowState)
    
    workflow.add_node("generator", generator_node)
    workflow.add_node("reviewer", reviewer_node)
    workflow.add_node("regenerator", regenerator_node)
    workflow.add_node("image_generator", image_node)
    workflow.add_node("finalize", finalize_node)
    workflow.add_node("reject", reject_node)
    
    # Edges
    workflow.set_entry_point("generator")
    workflow.add_edge("generator", "reviewer")
    
    workflow.add_conditional_edges(
        "reviewer",
        route_after_review,
        {
            "regenerator": "regenerator",
            "image_generator": "image_generator",
            "finalize": "finalize",
            "reject": "reject"
        }
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
    Each event carries unique event_id, run_id, batch_id, status, step progress, token usage metrics, and payload data.
    """
    def make_event(event_type: str, agent_name: str, message: str, data: Optional[Dict[str, Any]] = None) -> WorkflowEvent:
        return WorkflowEvent(
            run_id=req.run_id,
            batch_id=req.batch_id,
            event_type=event_type,
            agent_name=agent_name,
            message=message,
            data=data
        )

    initial_state: AgentWorkflowState = {
        "request": req.model_dump(),
        "run_id": req.run_id,
        "batch_id": req.batch_id,
        "iteration_count": 1,
        "iterations_history": [],
        "log_messages": [],
        "total_tokens": 0,
        "total_prompt_tokens": 0,
        "total_completion_tokens": 0,
        "total_cost_usd": 0.0,
        "agent_usage_breakdown": [],
        "stage_outcomes": {}
    }
    
    try:
        # Yield initial start event
        start_evt = make_event(
            event_type="workflow_start",
            agent_name="System",
            message=f"Starting UK UCAT Generation Workflow for {req.section.value} ({req.difficulty.value}) using {req.model_name or config.DEFAULT_TEXT_MODEL}..."
        )
        yield f"data: {start_evt.model_dump_json()}\n\n"
        
        state = initial_state
        
        # Step 1: Generator
        gen_evt = make_event(
            event_type="agent_start",
            agent_name="Question Generator",
            message="Synthesizing UCAT stimulus passage and 4-option draft..."
        )
        yield f"data: {gen_evt.model_dump_json()}\n\n"
        
        gen_res = await generator_node(state)
        state.update(gen_res)
        
        gen_usage = state.get("latest_usage", {})
        gen_done_evt = make_event(
            event_type="agent_complete",
            agent_name="Question Generator",
            message=f"Draft v1 generated ({gen_usage.get('total_tokens', 0)} tokens, ${gen_usage.get('cost_usd', 0.0):.5f}). Passing to Question Reviewer.",
            data={
                "draft": state["current_draft"],
                "latest_usage": gen_usage,
                "cumulative_usage": {
                    "total_tokens": state.get("total_tokens", 0),
                    "total_prompt_tokens": state.get("total_prompt_tokens", 0),
                    "total_completion_tokens": state.get("total_completion_tokens", 0),
                    "total_cost_usd": state.get("total_cost_usd", 0.0)
                }
            }
        )
        yield f"data: {gen_done_evt.model_dump_json()}\n\n"
        
        # Loop Reviewer <-> Re-Generator
        while True:
            iteration = state.get("iteration_count", 1)
            
            rev_start_evt = make_event(
                event_type="agent_start",
                agent_name="Question Reviewer",
                message=f"Auditing draft (Iteration {iteration}) against 100-point UCAT rubric..."
            )
            yield f"data: {rev_start_evt.model_dump_json()}\n\n"
            
            rev_res = await reviewer_node(state)
            state.update(rev_res)
            
            review = state["current_review"]
            score = review["total_score"]
            rev_usage = state.get("latest_usage", {})
            
            rev_done_evt = make_event(
                event_type="agent_complete",
                agent_name="Question Reviewer",
                message=f"Review completed. Score: {score}/100 ({rev_usage.get('total_tokens', 0)} tokens, ${rev_usage.get('cost_usd', 0.0):.5f}). Authenticity: {review['authenticity_score']}/25, Clarity: {review['clarity_score']}/25, Distractors: {review['distractor_score']}/25, Explanation: {review['explanation_score']}/25.",
                data={
                    "review": review,
                    "iteration": iteration,
                    "latest_usage": rev_usage,
                    "cumulative_usage": {
                        "total_tokens": state.get("total_tokens", 0),
                        "total_prompt_tokens": state.get("total_prompt_tokens", 0),
                        "total_completion_tokens": state.get("total_completion_tokens", 0),
                        "total_cost_usd": state.get("total_cost_usd", 0.0)
                    }
                }
            )
            yield f"data: {rev_done_evt.model_dump_json()}\n\n"
            
            # Route
            next_step = route_after_review(state)
            if next_step == "regenerator":
                regen_start_evt = make_event(
                    event_type="agent_start",
                    agent_name="Question Re-Generator",
                    message=f"Score {score} <= {config.PASSING_SCORE_THRESHOLD}! Initiating Re-Generator Agent to remediate identified flaws..."
                )
                yield f"data: {regen_start_evt.model_dump_json()}\n\n"
                
                regen_res = await regenerator_node(state)
                state.update(regen_res)
                
                regen_usage = state.get("latest_usage", {})
                regen_done_evt = make_event(
                    event_type="agent_complete",
                    agent_name="Question Re-Generator",
                    message=f"Re-generation complete (Draft v{state['iteration_count']} • {regen_usage.get('total_tokens', 0)} tokens, ${regen_usage.get('cost_usd', 0.0):.5f}). Resubmitting to Reviewer...",
                    data={
                        "draft": state["current_draft"],
                        "latest_usage": regen_usage,
                        "cumulative_usage": {
                            "total_tokens": state.get("total_tokens", 0),
                            "total_prompt_tokens": state.get("total_prompt_tokens", 0),
                            "total_completion_tokens": state.get("total_completion_tokens", 0),
                            "total_cost_usd": state.get("total_cost_usd", 0.0)
                        }
                    }
                )
                yield f"data: {regen_done_evt.model_dump_json()}\n\n"
                continue
            elif next_step == "reject":
                # Strict quality gate triggered! Score <= 90 after max attempts.
                rej_res = await reject_node(state)
                state.update(rej_res)
                
                rej_evt = make_event(
                    event_type="workflow_rejected",
                    agent_name="Quality Gate",
                    message=f"Strict Quality Halt: Score {score}/100 did not exceed {config.PASSING_SCORE_THRESHOLD} after {iteration} iteration attempts. Halting workflow and discarding question from database.",
                    data=state.get("rejection_data")
                )
                yield f"data: {rej_evt.model_dump_json()}\n\n"
                return  # HALT! DO NOT proceed further: bypass image generator and database save.
            else:
                # Score > 90: Passed! Proceed to image generation / finalize.
                break
                
        # Image Generation if required (ONLY for questions scoring > 90)
        req_data = state["request"]
        requires_image = (
            req_data.get("require_image", False) or
            req_data.get("section") == UCATSection.ABSTRACT_REASONING.value or
            state.get("current_draft", {}).get("image_needed", False)
        )
        
        if requires_image:
            img_start_evt = make_event(
                event_type="agent_start",
                agent_name="Image Generator",
                message="Generating visual stimulus diagram..."
            )
            yield f"data: {img_start_evt.model_dump_json()}\n\n"
            
            img_res = await image_node(state)
            state.update(img_res)
            
            img_done_evt = make_event(
                event_type="agent_complete",
                agent_name="Image Generator",
                message="Visual stimulus created and linked.",
                data={
                    "has_svg": bool(state.get("image_svg")),
                    "image_url": state.get("image_url"),
                    "usage": state.get("latest_usage")
                }
            )
            yield f"data: {img_done_evt.model_dump_json()}\n\n"
            
        # Finalize (Save to PostgreSQL)
        fin_res = await finalize_node(state)
        state.update(fin_res)
        
        final_tokens = state.get("total_tokens", 0)
        final_cost = state.get("total_cost_usd", 0.0)
        
        complete_evt = make_event(
            event_type="workflow_complete",
            agent_name="System",
            message=f"Multi-Agent workflow successfully finished! Question verified > 90 and saved to Question Bank. Total: {final_tokens} tokens (${final_cost:.5f}).",
            data={
                "question": state["final_question"],
                "stage_outcomes": state.get("stage_outcomes", {}),
                "cumulative_usage": {
                    "total_tokens": final_tokens,
                    "total_prompt_tokens": state.get("total_prompt_tokens", 0),
                    "total_completion_tokens": state.get("total_completion_tokens", 0),
                    "total_cost_usd": final_cost
                },
                "usage_breakdown": state.get("agent_usage_breakdown", [])
            }
        )
        yield f"data: {complete_evt.model_dump_json()}\n\n"
    except Exception as e:
        logger.error(f"Workflow stream error: {e}")
        err_msg = str(e)
        error_evt = make_event(
            event_type="workflow_error",
            agent_name="System Error",
            message=err_msg,
            data={"error": err_msg}
        )
        yield f"data: {error_evt.model_dump_json()}\n\n"


class WorkflowRunResult:
    def __init__(self, status: str, data: Optional[Dict[str, Any]] = None):
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

