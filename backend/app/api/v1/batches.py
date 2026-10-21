import logging

from fastapi import APIRouter, HTTPException, Query

from app.repositories.batch_repo import (
    get_batch_by_id,
    get_batches,
    save_batch,
)
from app.repositories.question_repo import get_questions
from app.schemas import GenerationBatch

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Generation Batches"])


@router.get("/batches")
async def list_batches(
    section: str | None = Query(None),
    status: str | None = Query(None),
):
    """Lists generation batches in the question bank."""
    batches = await get_batches(section=section, status=status)
    return {"batches": [b.model_dump() for b in batches]}


@router.get("/batches/{batch_id}")
async def get_single_batch(batch_id: str):
    """Retrieves a single generation batch with its linked questions."""
    b = await get_batch_by_id(batch_id)
    if not b:
        raise HTTPException(status_code=404, detail="Batch not found")

    linked_questions = await get_questions(batch_id=batch_id)
    return {
        "batch": b.model_dump(),
        "questions": [q.model_dump() for q in linked_questions],
    }


@router.post("/batches")
async def create_or_update_batch(batch: GenerationBatch):
    """Admin endpoint to create or update a generation batch record."""
    saved = await save_batch(batch)
    return {"success": True, "batch": saved.model_dump()}
