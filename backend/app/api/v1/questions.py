import csv
import io
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import JSONResponse

from app.repositories.question_repo import (
    get_questions,
    get_question_by_id,
    delete_question
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Question Bank"])

@router.get("/questions")
async def list_questions(
    section: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    combination_id: Optional[str] = Query(None),
    run_id: Optional[str] = Query(None),
    batch_id: Optional[str] = Query(None)
):
    """Lists saved questions from the PostgreSQL Question Bank along with aggregated metrics."""
    questions = await get_questions(
        section=section,
        difficulty=difficulty,
        search=search,
        combination_id=combination_id,
        run_id=run_id,
        batch_id=batch_id
    )
    dumped = [q.model_dump() for q in questions]
    
    total_tokens = sum(q.total_tokens or 0 for q in questions)
    total_cost_usd = round(sum(q.cost_usd or 0.0 for q in questions), 5)
    
    return {
        "questions": dumped,
        "total_tokens": total_tokens,
        "total_cost_usd": total_cost_usd
    }

@router.get("/questions/{question_id}")
async def get_single_question(question_id: str):
    """Retrieves a single question by UUID4 primary key."""
    q = await get_question_by_id(question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return q.model_dump()

@router.delete("/questions/{question_id}")
async def remove_question(question_id: str):
    """Deletes a question by primary key ID."""
    success = await delete_question(question_id)
    return {"success": success}

@router.get("/export")
async def export_questions(format: str = Query("json", pattern="^(json|csv)$")):
    """Exports Question Bank in JSON or CSV format including manager matrix fields and UUIDs."""
    questions = await get_questions()
    
    if format == "json":
        data = [q.model_dump() for q in questions]
        return JSONResponse(
            content=data,
            headers={"Content-Disposition": "attachment; filename=ucat_question_bank.json"}
        )
    else:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "ID", "Run_ID", "Batch_ID", "Combination_ID", "Section", "Subcategory", "Difficulty", "Content_Domain",
            "Question_Type", "Interaction_Type", "Primary_Trap", "Passage_Required", "Visual_Type",
            "Stimulus", "Question Stem", "Option A", "Option B", "Option C", "Option D",
            "Correct Answer", "Explanation", "Final Score", "Cycles", "Created At"
        ])
        for q in questions:
            opts = {opt.id: opt.text for opt in q.options}
            writer.writerow([
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
                q.correct_answer_id,
                q.explanation,
                q.final_score,
                q.iteration_count,
                q.created_at
            ])
        csv_data = output.getvalue()
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=ucat_question_bank.csv"}
        )

