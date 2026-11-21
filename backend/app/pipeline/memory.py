"""
Phase 10: Memory pipeline — computes memory proposals from extracted profile changes.
"""
from typing import Dict, Any, List, Optional

# Fields the AI will propose to remember (subset of CitizenProfile)
MEMORABLE_FIELDS = [
    "occupation", "state", "district", "land_holding_hectares",
    "annual_family_income", "caste_category", "residence",
    "age", "gender", "education_level", "is_disabled", "is_bpl"
]

FIELD_REASONS = {
    "occupation": "You mentioned your occupation",
    "state": "You mentioned your state",
    "district": "You mentioned your district",
    "land_holding_hectares": "You mentioned your land holding",
    "annual_family_income": "You mentioned your family income",
    "caste_category": "You mentioned your social category",
    "residence": "You mentioned where you live",
    "age": "You mentioned your age",
    "gender": "You mentioned your gender",
    "education_level": "You mentioned your education level",
    "is_disabled": "You mentioned disability status",
    "is_bpl": "You mentioned BPL status",
}


def compute_memory_proposals(
    extracted_profile: Dict[str, Any],
    existing_memory: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """
    Compare the newly extracted profile fields against existing memory.
    Returns a list of MemoryProposal dicts for new or changed values.
    """
    proposals = []
    for field in MEMORABLE_FIELDS:
        new_val = extracted_profile.get(field)
        if new_val is None:
            continue  # Nothing extracted for this field — skip

        current_val = existing_memory.get(field)
        str_new = str(new_val)
        str_current = str(current_val) if current_val is not None else None

        if str_current is None:
            change_type = "new"
        elif str_current != str_new:
            change_type = "update"
        else:
            continue  # Same value — no proposal needed

        proposals.append({
            "key": field,
            "proposed_value": new_val,
            "current_value": current_val,
            "change_type": change_type,
            "reason": FIELD_REASONS.get(field, f"You mentioned {field.replace('_', ' ')}"),
        })

    return proposals
