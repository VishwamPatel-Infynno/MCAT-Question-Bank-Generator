import csv
import io
import logging

from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.repositories.question_repo import (
    delete_question,
    delete_questions_batch,
    get_question_by_id,
    get_questions,
    get_repository_metrics,
    save_question,
    save_questions_batch,
)
from app.schemas import Question

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Question Bank"])


@router.get("/questions")
async def list_questions(
    section: str | None = Query(None),
    difficulty: str | None = Query(None),
    search: str | None = Query(None),
    combination_id: str | None = Query(None),
    run_id: str | None = Query(None),
    batch_id: str | None = Query(None),
):
    """Lists saved questions from the PostgreSQL Question Bank along with aggregated metrics."""
    questions = await get_questions(
        section=section,
        difficulty=difficulty,
        search=search,
        combination_id=combination_id,
        run_id=run_id,
        batch_id=batch_id,
    )
    dumped = [q.model_dump() for q in questions]

    metrics = await get_repository_metrics()

    return {
        "questions": dumped,
        "total_tokens": metrics["total_tokens"],
        "total_cost_usd": metrics["total_cost_usd"],
    }


@router.get("/questions/{question_id}")
async def get_single_question(question_id: str):
    """Retrieves a single question by UUID4 primary key."""
    q = await get_question_by_id(question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return q.model_dump()


@router.post("/questions")
async def approve_and_save_question(question: Question):
    """
    Admin approval endpoint: persists an approved candidate question into the Question Bank in PostgreSQL.
    """
    saved = await save_question(question)
    logger.info(
        f"Question approved by Admin and saved to Question Bank: {saved.id} ({saved.section_label})"
    )
    return {"success": True, "question": saved.model_dump()}


@router.post("/questions/batch")
async def batch_approve_and_save_questions(questions: list[Question]):
    """
    Bulk Admin approval endpoint: persists an array of approved candidate questions into PostgreSQL in a single atomic transaction.
    """
    saved_list = await save_questions_batch(questions)
    logger.info(f"Atomic batch approved {len(saved_list)} questions into Question Bank.")
    return {"success": True, "saved_count": len(saved_list), "ids": saved_list}


@router.delete("/questions/{question_id}")
async def remove_question(question_id: str):
    """Deletes a question by primary key ID."""
    success = await delete_question(question_id)
    return {"success": success}


class BatchDeleteRequest(BaseModel):
    ids: list[str]


@router.post("/questions/delete-batch")
async def remove_questions_batch(payload: BatchDeleteRequest):
    """Bulk Admin deletion endpoint: removes multiple questions in a single atomic SQL transaction."""
    deleted_count = await delete_questions_batch(payload.ids)
    logger.info(f"Bulk deleted {deleted_count} questions from Question Bank.")
    return {"success": True, "deleted_count": deleted_count}



@router.get("/export")
async def export_questions(format: str = Query("json", pattern="^(json|csv)$")):
    """Exports Question Bank in JSON or CSV format including manager matrix fields and UUIDs."""
    questions = await get_questions()

    if format == "json":
        data = [q.model_dump() for q in questions]
        return JSONResponse(
            content=data,
            headers={"Content-Disposition": "attachment; filename=ucat_question_bank.json"},
        )
    else:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "ID",
                "Run_ID",
                "Batch_ID",
                "Combination_ID",
                "Section",
                "Subcategory",
                "Difficulty",
                "Content_Domain",
                "Question_Type",
                "Interaction_Type",
                "Primary_Trap",
                "Passage_Required",
                "Visual_Type",
                "Stimulus",
                "Question Stem",
                "Option A",
                "Option B",
                "Option C",
                "Option D",
                "Option E",
                "Correct Answer",
                "Explanation",
                "Final Score",
                "Cycles",
                "Created At",
            ]
        )
        for q in questions:
            opts = {opt.id: opt.text for opt in q.options}
            writer.writerow(
                [
                    q.id,
                    q.run_id or "",
                    q.batch_id or "",
                    q.combination_id or "",
                    q.section_label,
                    q.subtopic,
                    q.difficulty,
                    q.content_domain or "",
                    q.question_type or "",
                    q.interaction_type or "single_choice",
                    q.primary_trap or "",
                    q.passage_required or "",
                    q.visual_type or "None",
                    q.stimulus_text or "",
                    q.question_stem,
                    opts.get("A", ""),
                    opts.get("B", ""),
                    opts.get("C", ""),
                    opts.get("D", ""),
                    opts.get("E", ""),
                    q.correct_answer_id,
                    q.explanation,
                    q.final_score,
                    q.iteration_count,
                    q.created_at,
                ]
            )
        csv_data = output.getvalue()
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=ucat_question_bank.csv"},
        )
