"""
Phase 10: Negotiated Memory API
Persistent, user-controlled memory across sessions.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any
from backend.app.api.auth import require_current_user
from backend.app.db import (
    get_memory, upsert_memory_entry, update_memory_entry,
    delete_memory_entry, clear_all_memory, init_db
)

router = APIRouter(prefix="/api/memory", tags=["memory"])

# Human-readable labels for profile keys
KEY_LABELS = {
    "occupation": "Occupation",
    "state": "State",
    "district": "District",
    "land_holding_hectares": "Land Holding (hectares)",
    "annual_family_income": "Annual Family Income",
    "caste_category": "Caste / Social Category",
    "residence": "Residence Type",
    "age": "Age",
    "gender": "Gender",
    "education_level": "Education Level",
    "is_disabled": "Disability Status",
    "is_bpl": "BPL Status",
}


class MemoryEntryOut(BaseModel):
    id: str
    key: str
    label: str
    value: str
    source: str
    created_at: str
    updated_at: str


class AddMemoryRequest(BaseModel):
    key: str
    value: str
    source: str = "manual"


class UpdateMemoryRequest(BaseModel):
    value: str


def _enrich(entry: dict) -> MemoryEntryOut:
    return MemoryEntryOut(
        id=entry["id"],
        key=entry["key"],
        label=KEY_LABELS.get(entry["key"], entry["key"].replace("_", " ").title()),
        value=entry["value"],
        source=entry["source"],
        created_at=entry["created_at"],
        updated_at=entry["updated_at"],
    )


@router.get("", response_model=List[MemoryEntryOut])
def list_memory(user: dict = Depends(require_current_user)):
    init_db()
    entries = get_memory(user["id"])
    return [_enrich(e) for e in entries]


@router.post("", response_model=MemoryEntryOut)
def add_memory(req: AddMemoryRequest, user: dict = Depends(require_current_user)):
    init_db()
    entry = upsert_memory_entry(user["id"], req.key, req.value, req.source)
    return _enrich(entry)


@router.patch("/{entry_id}", response_model=MemoryEntryOut)
def edit_memory(entry_id: str, req: UpdateMemoryRequest, user: dict = Depends(require_current_user)):
    init_db()
    entry = update_memory_entry(entry_id, user["id"], req.value)
    if not entry:
        raise HTTPException(status_code=404, detail="Memory entry not found.")
    return _enrich(entry)


@router.delete("/{entry_id}")
def remove_memory_entry(entry_id: str, user: dict = Depends(require_current_user)):
    init_db()
    deleted = delete_memory_entry(entry_id, user["id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Memory entry not found.")
    return {"status": "deleted"}


@router.delete("")
def clear_memory(user: dict = Depends(require_current_user)):
    init_db()
    clear_all_memory(user["id"])
    return {"status": "cleared"}
