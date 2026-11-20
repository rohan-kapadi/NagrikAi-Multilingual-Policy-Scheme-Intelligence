from typing import Any, Dict, List, Optional, Tuple
from backend.app.models import Scheme, Criterion, CriterionResult, EligibilityResult, CitizenProfile


def format_required_description(op: str, val: Any) -> str:
    op_map = {
        "eq": f"== {val}",
        "ne": f"!= {val}",
        "lt": f"< {val}",
        "lte": f"<= {val}",
        "gt": f"> {val}",
        "gte": f">= {val}",
        "in": f"in {val}",
        "not_in": f"not in {val}",
        "between": f"between {val[0]} and {val[1]}" if isinstance(val, (list, tuple)) and len(val) == 2 else f"between {val}",
        "is_true": "must be Yes/True",
        "is_false": "must be No/False",
    }
    return op_map.get(op, f"{op} {val}")


def evaluate_condition(user_val: Any, op: str, target_val: Any) -> bool:
    """
    Evaluates condition for operators:
    eq, ne, lt, lte, gt, gte, in, not_in, between, is_true, is_false
    """
    if op == "is_true":
        return bool(user_val) is True
    if op == "is_false":
        return bool(user_val) is False

    if op == "eq":
        if isinstance(user_val, str) and isinstance(target_val, str):
            return user_val.strip().lower() == target_val.strip().lower()
        return user_val == target_val

    if op == "ne":
        if isinstance(user_val, str) and isinstance(target_val, str):
            return user_val.strip().lower() != target_val.strip().lower()
        return user_val != target_val

    if op == "lt":
        return float(user_val) < float(target_val)

    if op == "lte":
        return float(user_val) <= float(target_val)

    if op == "gt":
        return float(user_val) > float(target_val)

    if op == "gte":
        return float(user_val) >= float(target_val)

    if op == "in":
        if isinstance(target_val, (list, set, tuple)):
            if isinstance(user_val, str):
                return any(str(user_val).strip().lower() == str(item).strip().lower() for item in target_val)
            return user_val in target_val
        return False

    if op == "not_in":
        if isinstance(target_val, (list, set, tuple)):
            if isinstance(user_val, str):
                return not any(str(user_val).strip().lower() == str(item).strip().lower() for item in target_val)
            return user_val not in target_val
        return True

    if op == "between":
        if isinstance(target_val, (list, tuple)) and len(target_val) == 2:
            low, high = float(target_val[0]), float(target_val[1])
            return low <= float(user_val) <= high
        return False

    return False


def evaluate_eligibility(scheme: Scheme, profile: CitizenProfile, language: str = "en") -> EligibilityResult:
    """
    Deterministic rule-based eligibility evaluation engine.
    Follows project.md Section 8 rules:
    - Any exclusion matched -> not_eligible
    - Any criterion not_met -> not_eligible
    - All criteria met -> eligible
    - No not_met, but some missing -> need_more_info
    - likely_eligible when all required are met and some optional are missing (if flagged)
    """
    criteria_results: List[CriterionResult] = []
    missing_fields: List[str] = []

    profile_dict = profile.model_dump()

    # 1. Evaluate exclusions first
    for exc in scheme.exclusions:
        user_val = profile_dict.get(exc.field)
        if user_val is not None:
            try:
                matched = evaluate_condition(user_val, exc.op, exc.value)
                if matched:
                    # Exclusion condition matched -> citizen is disqualified
                    label_text = exc.label.get(language, exc.label.get("en", f"Excluded: {exc.field}"))
                    criteria_results.append(CriterionResult(
                        criterion_id=exc.id,
                        label=f"[Exclusion] {label_text}",
                        status="not_met",
                        user_value=user_val,
                        required=f"Cannot match: {format_required_description(exc.op, exc.value)}"
                    ))
                    # Early mark as not_eligible
                    return EligibilityResult(
                        scheme_id=scheme.id,
                        overall="not_eligible",
                        criteria_results=criteria_results,
                        missing_fields=missing_fields,
                        required_documents=[doc.get(language, doc.get("en", "")) for doc in scheme.required_documents],
                        citations=[{
                            "title": doc.get("title", ""),
                            "url": doc.get("url", scheme.official_url),
                            "page": 1
                        } for doc in scheme.source_documents] if scheme.source_documents else [{
                            "title": scheme.name.get("en", scheme.id),
                            "url": scheme.official_url,
                            "page": 1
                        }]
                    )
            except Exception:
                pass

    # 2. Evaluate regular criteria
    has_not_met = False
    has_missing = False

    for c in scheme.criteria:
        user_val = profile_dict.get(c.field)
        label_text = c.label.get(language, c.label.get("en", c.field))
        req_desc = format_required_description(c.op, c.value)

        if user_val is None:
            status = "missing"
            has_missing = True
            if c.field not in missing_fields:
                missing_fields.append(c.field)
        else:
            try:
                is_met = evaluate_condition(user_val, c.op, c.value)
                if is_met:
                    status = "met"
                else:
                    status = "not_met"
                    has_not_met = True
            except Exception:
                status = "not_met"
                has_not_met = True

        criteria_results.append(CriterionResult(
            criterion_id=c.id,
            label=label_text,
            status=status,
            user_value=user_val,
            required=req_desc
        ))

    # 3. Determine overall status
    if has_not_met:
        overall = "not_eligible"
    elif has_missing:
        overall = "need_more_info"
    else:
        overall = "eligible"

    # Citations and localized required documents
    req_docs = [doc.get(language, doc.get("en", "")) for doc in scheme.required_documents]
    citations = [{
        "title": doc.get("title", ""),
        "url": doc.get("url", scheme.official_url),
        "page": 1
    } for doc in scheme.source_documents] if scheme.source_documents else [{
        "title": scheme.name.get("en", scheme.id),
        "url": scheme.official_url,
        "page": 1
    }]

    return EligibilityResult(
        scheme_id=scheme.id,
        overall=overall,
        criteria_results=criteria_results,
        missing_fields=missing_fields,
        required_documents=req_docs,
        citations=citations
    )
