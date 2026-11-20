from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.models import Scheme
from backend.app.data_loader import filter_schemes, get_scheme_by_id

router = APIRouter(prefix="/api/schemes", tags=["Schemes"])


@router.get("", response_model=List[Scheme])
def list_schemes(
    category: Optional[str] = Query(None, description="Filter schemes by category (e.g. agriculture, education)"),
    state: Optional[str] = Query(None, description="Filter schemes by state (e.g. Maharashtra)")
):
    """
    Returns list of government schemes, optionally filtered by category or state.
    """
    return filter_schemes(category=category, state=state)


@router.get("/{scheme_id}", response_model=Scheme)
def get_scheme(scheme_id: str):
    """
    Get full details for a single scheme by its unique ID.
    """
    scheme = get_scheme_by_id(scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme with ID '{scheme_id}' not found.")
    return scheme
