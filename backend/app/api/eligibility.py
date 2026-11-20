from typing import Optional
from fastapi import APIRouter, HTTPException
from backend.app.models import EligibilityRequest, EligibilityResult
from backend.app.data_loader import get_scheme_by_id
from backend.app.pipeline.eligibility import evaluate_eligibility

router = APIRouter(prefix="/api/eligibility", tags=["Eligibility"])


@router.post("", response_model=EligibilityResult)
def check_eligibility(payload: EligibilityRequest):
    """
    Evaluates citizen eligibility against a specific scheme deterministically in code.
    No LLM is invoked in this assessment.
    """
    scheme = get_scheme_by_id(payload.scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme '{payload.scheme_id}' not found.")

    language = payload.profile.language or "en"
    return evaluate_eligibility(scheme=scheme, profile=payload.profile, language=language)
