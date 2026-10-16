import logging

from fastapi import APIRouter, HTTPException, Query

from app.repositories.question_repo import (
    get_passage_by_id,
    get_passages,
    get_questions,
    save_passage,
)
from app.schemas import Passage

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Passages"])


@router.get("/passages")
async def list_passages(
    section: str | None = Query(None),
    subtopic: str | None = Query(None),
    search: str | None = Query(None),
):
    """Lists reading passages in the question bank."""
    passages = await get_passages(section=section, subtopic=subtopic, search=search)
    return {"passages": [p.model_dump() for p in passages]}


@router.get("/passages/{passage_id}")
async def get_single_passage(passage_id: str):
    """Retrieves a single reading passage with its linked questions."""
    p = await get_passage_by_id(passage_id)
    if not p:
        raise HTTPException(status_code=404, detail="Passage not found")

    linked_questions = await get_questions(passage_id=passage_id)
    return {
        "passage": p.model_dump(),
        "questions": [q.model_dump() for q in linked_questions],
    }


@router.post("/passages")
async def create_or_update_passage(passage: Passage):
    """Admin endpoint to create or update a passage record."""
    saved = await save_passage(passage)
    return {"success": True, "passage": saved.model_dump()}
