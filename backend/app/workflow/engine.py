import asyncio
import json
import logging
import uuid
from collections.abc import AsyncGenerator, Callable
from typing import Any

from app.agents.generator import generate_passage_stimulus
from app.agents.image_generator import generate_image_stimulus
from app.core.config import config
from app.schemas import (
    GenerationRequest,
    MCATSection,
    OptionChoice,
    Question,
    QuestionDraft,
    WorkflowEvent,
)
from app.workflow.nodes import (
    blind_solver_node,
    finalize_node,
    fused_generator_node,
    image_node,
    regenerator_node,
    reject_node,
    reviewer_node,
)
from app.workflow.routes import route_after_review
from app.workflow.state import AgentWorkflowState

logger = logging.getLogger(__name__)


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
    Respects section type, passage attachment, explicit image flags, and autonomous AI needs.
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


async def _run_question_review_loop(
    state: AgentWorkflowState,
    idx: int,
    total_qty: int,
    item_run_id: str,
    event_queue: asyncio.Queue[WorkflowEvent | None],
    make_event: Callable[..., WorkflowEvent],
) -> bool:
    """
    Executes the quality review, critique, remediation (regeneration), and quality gate routing
    for a question draft. Integrates Blind-Solver Dual Validation to verify indisputability.
    """
    while True:
        iteration = state.get("iteration_count", 1)

        # Step 1: Run Reviewer if fused self-review is absent or unverified
        if not state.get("fused_self_passed"):
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
            if next_step == "reject":
                rej_res = await reject_node(state)
                state.update(rej_res)
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
                return False

        # Step 2: Blind-Solver Dual Validation Agent Pass
        if config.ENABLE_BLIND_SOLVER:
            bs_start_evt = make_event(
                event_type="agent_start",
                agent_name="Blind-Solver Dual Validation",
                message=f"Running independent Blind-Solver Dual Validation on Question {idx + 1}...",
                data={
                    "index": idx + 1,
                    "total": total_qty,
                    "stage": "blind_solving",
                    "iteration": iteration,
                },
                run_id=item_run_id,
            )
            await event_queue.put(bs_start_evt)

            bs_res = await blind_solver_node(state)
            state.update(bs_res)

            bs_data = state.get("blind_solver_result") or {}
            bs_passed = state.get("blind_solver_passed", True)
            bs_usage = state.get("latest_usage", {})

            if bs_passed:
                bs_done_evt = make_event(
                    event_type="agent_complete",
                    agent_name="Blind-Solver Dual Validation",
                    message=f"Blind-Solver validated Question {idx + 1} (Selected Option {bs_data.get('selected_key')} matches key, confidence: {bs_data.get('confidence')}%, unambiguous).",
                    data={
                        "blind_solver": bs_data,
                        "latest_usage": bs_usage,
                        "index": idx + 1,
                        "total": total_qty,
                        "stage": "blind_solving",
                        "passed": True,
                    },
                    run_id=item_run_id,
                )
                await event_queue.put(bs_done_evt)
                return True
            else:
                bs_fail_evt = make_event(
                    event_type="agent_complete",
                    agent_name="Blind-Solver Dual Validation",
                    message=f"Blind-Solver flagged discrepancy for Question {idx + 1}: Selected Option {bs_data.get('selected_key')} (Confidence: {bs_data.get('confidence')}%). Remediation required.",
                    data={
                        "blind_solver": bs_data,
                        "latest_usage": bs_usage,
                        "index": idx + 1,
                        "total": total_qty,
                        "stage": "blind_solving",
                        "passed": False,
                    },
                    run_id=item_run_id,
                )
                await event_queue.put(bs_fail_evt)

                # Route to Question Improver for remediation if within attempt limits
                max_attempts = config.MAX_REGENERATION_ATTEMPTS
                if iteration < max_attempts:
                    state["fused_self_passed"] = False
                    regen_start_evt = make_event(
                        event_type="agent_start",
                        agent_name="Question Improver",
                        message=f"Question Improver is remediating question {idx + 1} based on blind-solver critique...",
                        data={
                            "index": idx + 1,
                            "total": total_qty,
                            "stage": "remediating",
                            "iteration": iteration,
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
                        message=f"Question {idx + 1} remediated (Draft v{state['iteration_count']}). Re-running validation...",
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
                else:
                    rej_res = await reject_node(state)
                    state.update(rej_res)
                    rej_evt = make_event(
                        event_type="workflow_rejected",
                        agent_name="Quality Gate",
                        message=f"Blind-Solver validation failed after {iteration} attempts for Question {idx + 1}.",
                        data=state.get("rejection_data") or {},
                        run_id=item_run_id,
                    )
                    await event_queue.put(rej_evt)
                    return False
        else:
            return True


async def run_workflow_stream(req: GenerationRequest) -> AsyncGenerator[str, None]:
    """
    Streams multi-agent workflow events in real time as Server-Sent Events (SSE).
    Supports generating single or multiple questions in one shot (batch).
    Emits batch_progress and question_generated as each question finishes,
    culminating in workflow_complete with all staged questions for user confirmation.
    """
    total_qty = 5 if req.questions_to_generate != 1 else 1
    batch_id = req.batch_id or (str(uuid.uuid4()) if total_qty > 1 else None)

    # Resolve binary passage mode: either all 5 linked or all 5 independent
    is_cars = req.section in (MCATSection.CARS, "cars", "CARS")
    is_independent = not is_cars and (
        req.passage_mode == "independent"
        or str(req.passage_required).lower() in ("no", "false", "0")
        or (req.passage_question_count == 0 and not req.shared_stimulus)
    )

    if is_independent:
        effective_passage_count = 0
        is_single_passage_set = False
        independent_count = total_qty
    else:
        effective_passage_count = total_qty
        is_single_passage_set = True
        independent_count = 0

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

    passage_image_needed = False
    passage_image_prompt = None

    try:
        # If Single Passage Set mode, generate the shared reading passage first if not already provided
        if is_single_passage_set and not shared_passage_text:
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

            (
                shared_passage_text,
                passage_usage,
                passage_image_needed,
                passage_image_prompt,
            ) = await generate_passage_stimulus(req)
            passage_tokens = passage_usage.total_tokens
            passage_prompt_tokens = passage_usage.prompt_tokens
            passage_completion_tokens = passage_usage.completion_tokens
            passage_cost = passage_usage.cost_usd

            all_agent_usage.append(
                {
                    "agent": "Passage Writer",
                    "iteration": 1,
                    "prompt_tokens": passage_usage.prompt_tokens,
                    "completion_tokens": passage_usage.completion_tokens,
                    "total_tokens": passage_usage.total_tokens,
                    "cost_usd": passage_usage.cost_usd,
                }
            )

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

        shared_passage_image_url: str | None = None
        shared_passage_image_svg: str | None = None
        shared_passage_image_desc: str | None = None

        if req.allow_ai_images:
            requires_passage_image = bool(req.section != MCATSection.CARS and passage_image_needed)
        else:
            requires_passage_image = bool(
                req.section != MCATSection.CARS
                and (
                    req.require_passage_image
                    or req.require_image
                    or req.visual_type in ("SVG_Diagram", "AI_FLUX_Image")
                )
            )

        # Generate shared visual stimulus diagram for the passage if required
        if is_single_passage_set and requires_passage_image and shared_passage_text:
            p_img_start_evt = make_event(
                event_type="agent_start",
                agent_name="Diagram & Chart Maker",
                message="Drawing shared visual stimulus diagram for reading passage...",
                data={
                    "stage": "passage_image",
                    "passage_id": shared_passage_id,
                    "batch_id": batch_id,
                },
            )
            yield f"data: {p_img_start_evt.model_dump_json()}\n\n"

            p_draft = QuestionDraft(
                stimulus_text=shared_passage_text,
                question_stem=f"Visual stimulus diagram for {req.section.value} passage",
                options=[
                    OptionChoice(id="A", text="Option A"),
                    OptionChoice(id="B", text="Option B"),
                    OptionChoice(id="C", text="Option C"),
                    OptionChoice(id="D", text="Option D"),
                ],
                correct_answer_id="A",
                explanation="Shared passage visual stimulus reference",
                image_needed=True,
                image_prompt_or_type=passage_image_prompt
                or req.custom_prompt
                or f"Scientific clinical diagram for: {shared_passage_text[:120]}",
            )

            (
                shared_passage_image_url,
                shared_passage_image_svg,
                shared_passage_image_desc,
                p_img_usage,
            ) = await generate_image_stimulus(p_draft, req)

            if p_img_usage and p_img_usage.get("cost_usd"):
                passage_cost += p_img_usage["cost_usd"]

            p_img_done_evt = make_event(
                event_type="agent_complete",
                agent_name="Diagram & Chart Maker",
                message="Shared visual stimulus diagram ready for reading passage.",
                data={
                    "stage": "passage_image",
                    "passage_id": shared_passage_id,
                    "image_url": shared_passage_image_url,
                    "image_svg": shared_passage_image_svg,
                    "image_description": shared_passage_image_desc,
                    "batch_id": batch_id,
                },
            )
            yield f"data: {p_img_done_evt.model_dump_json()}\n\n"

        # Initial workflow start
        if is_single_passage_set:
            start_msg = f"Starting AAMC MCAT Passage Set ({total_qty} questions) on shared reading passage..."
        elif total_qty == 1:
            start_msg = f"Starting AAMC MCAT Generation Workflow for {req.section.value} ({req.difficulty.value}) using {req.model_name or config.DEFAULT_TEXT_MODEL}..."
        else:
            start_msg = f"Starting AAMC MCAT Independent Discretes Batch ({total_qty} standalone questions) in parallel..."

        start_evt = make_event(
            event_type="workflow_start",
            agent_name="System",
            message=start_msg,
            data={
                "total_questions": total_qty,
                "single_count": total_qty,
                "passage_count": effective_passage_count,
                "passage_question_count": effective_passage_count,
                "independent_question_count": independent_count,
                "batch_id": batch_id,
                "passage_id": shared_passage_id,
                "passage_mode": "single_passage" if is_single_passage_set else "independent",
                "shared_passage": shared_passage_text if is_single_passage_set else None,
                "shared_passage_image_svg": shared_passage_image_svg
                if is_single_passage_set
                else None,
                "shared_passage_image_url": shared_passage_image_url
                if is_single_passage_set
                else None,
                "shared_passage_image_description": shared_passage_image_desc
                if is_single_passage_set
                else None,
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
        shared_used_traps: list[str] = []
        shared_used_mistakes: list[str] = []

        async def _worker(idx: int) -> None:
            max_worker_retries = 2
            for attempt in range(max_worker_retries + 1):
                try:
                    async with semaphore:
                        item_req, item_run_id, is_passage_item, item_interaction = (
                            _build_batch_worker_request(
                                req=req,
                                idx=idx,
                                total_qty=total_qty,
                                batch_id=batch_id,
                                effective_passage_count=effective_passage_count,
                                shared_passage_id=shared_passage_id,
                                shared_passage_text=shared_passage_text,
                            )
                        )

                        diversity_context = None
                        if total_qty > 1:
                            parts = [f"Item {idx + 1} of {total_qty} in this question set."]
                            if shared_used_traps:
                                parts.append(
                                    f"Previously calibrated traps: {', '.join(shared_used_traps[-4:])}. Please select a complementary AAMC trap for variety."
                                )
                            if shared_used_mistakes:
                                parts.append(
                                    f"Previously targeted misconceptions: {', '.join(shared_used_mistakes[-3:])}. Diversify the targeted misconception."
                                )
                            diversity_context = " ".join(parts)

                        if total_qty > 1:
                            worker_msg = (
                                f"[{idx + 1}/{total_qty}] Writing linked {item_interaction.replace('_', ' ').title()} question from shared passage..."
                                if is_passage_item
                                else f"[{idx + 1}/{total_qty}] Writing independent {item_interaction.replace('_', ' ').title()} question (direct question)..."
                            )
                            batch_prog_evt = make_event(
                                event_type="batch_progress",
                                agent_name="System",
                                message=worker_msg,
                                data={
                                    "current_index": idx + 1,
                                    "total_count": total_qty,
                                    "interaction_type": item_interaction,
                                    "passage_required": item_req.passage_required,
                                    "passage_mode": item_req.passage_mode,
                                    "passage_id": item_req.passage_id,
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
                            "diversity_context": diversity_context,
                        }

                        # Step 1: Question Writer & Reviewer (Fused Authoring & 100-pt Audit)
                        gen_evt = make_event(
                            event_type="agent_start",
                            agent_name="Question Writer & Reviewer",
                            message=f"Drafting and auditing question {idx + 1}/{total_qty} (Single Choice)...",
                            data={
                                "index": idx + 1,
                                "total": total_qty,
                                "stage": "drafting",
                                "interaction_type": item_interaction,
                                "passage_required": item_req.passage_required,
                            },
                            run_id=item_run_id,
                        )
                        await event_queue.put(gen_evt)

                        gen_res = await fused_generator_node(state)
                        state.update(gen_res)

                        cur_draft = state.get("current_draft") or {}
                        c_trap = cur_draft.get("primary_trap")
                        c_mistake = cur_draft.get("likely_mistake_pattern")
                        if c_trap and c_trap not in shared_used_traps:
                            shared_used_traps.append(c_trap)
                        if c_mistake and c_mistake not in shared_used_mistakes:
                            shared_used_mistakes.append(c_mistake)

                        gen_usage = state.get("latest_usage", {})
                        self_score = (state.get("current_review") or {}).get("total_score", 95)
                        gen_done_evt = make_event(
                            event_type="agent_complete",
                            agent_name="Question Writer & Reviewer",
                            message=f"Draft authored and audited for Question {idx + 1} (Score: {self_score}/100, {gen_usage.get('total_tokens', 0)} tokens, ${gen_usage.get('cost_usd', 0.0):.5f}).",
                            data={
                                "draft": state["current_draft"],
                                "review": state.get("current_review"),
                                "score": self_score,
                                "latest_usage": gen_usage,
                                "index": idx + 1,
                                "total": total_qty,
                                "stage": "drafting",
                            },
                            run_id=item_run_id,
                        )
                        await event_queue.put(gen_done_evt)

                        # Step 2: Quality Review / Remediation Loop
                        question_passed = await _run_question_review_loop(
                            state=state,
                            idx=idx,
                            total_qty=total_qty,
                            item_run_id=item_run_id,
                            event_queue=event_queue,
                            make_event=make_event,
                        )

                        if question_passed:
                            is_passage_item_check = (
                                is_single_passage_set and idx < effective_passage_count
                            )

                            # If this is a passage question and the passage has a visual stimulus diagram, attach reference
                            if is_passage_item_check and (
                                shared_passage_image_svg or shared_passage_image_url
                            ):
                                state["image_url"] = shared_passage_image_url
                                state["image_svg"] = shared_passage_image_svg
                                state["image_description"] = shared_passage_image_desc
                                outcomes = state.setdefault("stage_outcomes", {})
                                outcomes["passage_visual_stimulus"] = {
                                    "image_url": shared_passage_image_url,
                                    "image_svg": shared_passage_image_svg,
                                    "image_description": shared_passage_image_desc,
                                    "note": "Visual stimulus belongs to shared reading passage",
                                }

                            requires_image = _determine_item_diagram_requirement(
                                state=state,
                                idx=idx,
                                is_passage_item=is_passage_item_check,
                            )

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
                        return  # Successfully finished this worker
                except asyncio.CancelledError:
                    raise
                except Exception as worker_err:
                    if attempt < max_worker_retries:
                        logger.warning(
                            f"Worker {idx + 1} encountered error (attempt {attempt + 1}/{max_worker_retries + 1}): {worker_err}. Retrying in 1.5s..."
                        )
                        await asyncio.sleep(1.5)
                        continue

                    logger.error(
                        f"Worker {idx + 1} failed after {max_worker_retries + 1} attempts: {worker_err}",
                        exc_info=worker_err,
                    )
                    # For multi-question runs (batches/sets), isolate failure to preserve sibling questions
                    if total_qty > 1:
                        err_evt = make_event(
                            event_type="question_failed",
                            agent_name="System",
                            message=f"Generation failed for Question {idx + 1} after retries: {str(worker_err)}",
                            data={"index": idx + 1, "error": str(worker_err)},
                            run_id=req.run_id,
                        )
                        await event_queue.put(err_evt)
                    else:
                        err_evt = make_event(
                            event_type="workflow_error",
                            agent_name="System",
                            message=f"Generation failed for Question {idx + 1}: {str(worker_err)}",
                            data={"index": idx + 1, "error": str(worker_err)},
                            run_id=req.run_id,
                        )
                        await event_queue.put(err_evt)
                    return

        tasks.extend([asyncio.create_task(_worker(i)) for i in range(total_qty)])

        async def _monitor_tasks():
            try:
                results = await asyncio.gather(*tasks, return_exceptions=True)
                for idx_t, res in enumerate(results):
                    if isinstance(res, Exception):
                        logger.error(
                            f"Worker task {idx_t + 1} raised unhandled exception: {res}",
                            exc_info=res,
                        )
            finally:
                await event_queue.put(None)

        monitor_task = asyncio.create_task(_monitor_tasks())

        while True:
            evt = await event_queue.get()
            if evt is None:
                break
            yield f"data: {evt.model_dump_json()}\n\n"

        await monitor_task

        all_staged_questions = [q for q in outcomes_questions if q is not None]
        cumulative_tokens = sum(outcomes_tokens) + passage_tokens
        cumulative_prompt_tokens = sum(outcomes_prompt_tokens) + passage_prompt_tokens
        cumulative_completion_tokens = sum(outcomes_completion_tokens) + passage_completion_tokens
        cumulative_cost = round(sum(outcomes_costs) + passage_cost, 7)
        for usage_list in outcomes_usage:
            all_agent_usage.extend(usage_list)

        if not all_staged_questions:
            error_msg = f"All {total_qty} questions in the run failed to generate after retries."
            error_evt = make_event(
                event_type="workflow_error",
                agent_name="System",
                message=error_msg,
                data={"error": error_msg},
            )
            yield f"data: {error_evt.model_dump_json()}\n\n"
            return

        if is_single_passage_set and total_qty > 1:
            complete_msg = f"Passage Set generated! {len(all_staged_questions)} questions linked to shared reading passage staged for Review. Total: {cumulative_tokens} tokens (${cumulative_cost:.5f})."
        elif total_qty > 1:
            complete_msg = f"Parallel batch generation completed! {len(all_staged_questions)} of {total_qty} questions staged for User Confirmation. Total: {cumulative_tokens} tokens (${cumulative_cost:.5f})."
        else:
            complete_msg = f"Multi-Agent workflow completed! Candidate question scored {all_staged_questions[0].get('final_score', 95) if all_staged_questions else 95}/100 and is staged for Confirmation. Total: {cumulative_tokens} tokens (${cumulative_cost:.5f})."

        complete_evt = make_event(
            event_type="workflow_complete",
            agent_name="System",
            message=complete_msg,
            data={
                "questions": all_staged_questions,
                "question": all_staged_questions[0] if all_staged_questions else None,
                "batch_id": batch_id,
                "passage_id": shared_passage_id if is_single_passage_set else None,
                "passage_mode": "single_passage" if is_single_passage_set else "independent",
                "passage_question_count": effective_passage_count,
                "independent_question_count": independent_count,
                "shared_passage": shared_passage_text if is_single_passage_set else None,
                "shared_passage_image_svg": shared_passage_image_svg
                if is_single_passage_set
                else None,
                "shared_passage_image_url": shared_passage_image_url
                if is_single_passage_set
                else None,
                "shared_passage_image_description": shared_passage_image_desc
                if is_single_passage_set
                else None,
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
