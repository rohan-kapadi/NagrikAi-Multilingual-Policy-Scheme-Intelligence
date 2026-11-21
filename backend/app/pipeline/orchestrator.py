from typing import Dict, Any, Optional, List
from backend.app.models import (
    ChatRequest, ChatResponse, ChatSchemeItem, CitizenProfile, Scheme, EligibilityResult,
    MemoryProposal, AnswerExplanation
)
from backend.app.pipeline.intent import classify_intent, detect_language
from backend.app.pipeline.profile import (
    extract_profile, merge_profiles, compute_missing_fields_for_scheme, get_clarifying_question
)
from backend.app.pipeline.retrieval import retrieve_schemes_and_chunks
from backend.app.pipeline.eligibility import evaluate_eligibility
from backend.app.pipeline.citations import build_citations
from backend.app.pipeline.explain import explain
from backend.app.pipeline.memory import compute_memory_proposals
from backend.app.data_loader import load_all_schemes, get_scheme_by_id

# In-memory session store (session_id -> CitizenProfile)
_session_profiles: Dict[str, CitizenProfile] = {}


def get_session_profile(session_id: str) -> CitizenProfile:
    if session_id not in _session_profiles:
        _session_profiles[session_id] = CitizenProfile()
    return _session_profiles[session_id]


def update_session_profile(session_id: str, profile: CitizenProfile):
    _session_profiles[session_id] = profile


def clear_session_profile(session_id: str):
    if session_id in _session_profiles:
        del _session_profiles[session_id]


def process_chat_turn(request: ChatRequest) -> ChatResponse:
    """
    Main orchestration entrypoint running the 8-step civic intelligence pipeline:
    [1] Language detect / set response language (en | hi | mr)
    [2] Intent classify
    [3] Profile extraction & merge into session profile (+ merge from persistent memory if user logged in)
    [4] Clarify check (ask ONE short question if critical profile attribute missing)
    [5] Retrieve (structured candidate prefilter + Chroma vector search)
    [6] Deterministic eligibility engine evaluation
    [7] Grounded multilingual explanation generation
    [8] Citations & required documents assembly
    [9] Compute memory proposals (new/changed fields to offer for persistent storage)
    [10] Build explanation metadata for the explainability panel
    """
    session_id = request.session_id or "default"
    user_msg = request.message.strip()
    user_id = request.user_id  # None for unauthenticated users

    # [1] Language determination: prefer request param if valid, or auto-detect from text
    detected_lang = detect_language(user_msg)
    lang = request.language if request.language in ["en", "hi", "mr"] else detected_lang

    # [2] Intent classification
    intent_data = classify_intent(user_msg)
    intent = intent_data.get("intent", "discover")
    target_scheme_id = intent_data.get("target_scheme_id")

    # [3] Profile extraction & merge
    current_profile = get_session_profile(session_id)

    # If user is logged in, load their persistent memory and pre-populate the session profile
    memory_profile: Dict[str, Any] = {}
    if user_id:
        try:
            from backend.app.db import get_memory_as_profile
            memory_profile = get_memory_as_profile(user_id)
            # Merge memory into current session profile (memory fills blanks, doesn't override session)
            for field, val in memory_profile.items():
                if getattr(current_profile, field, None) is None:
                    try:
                        setattr(current_profile, field, val)
                    except Exception:
                        pass
        except Exception:
            pass  # DB not initialized or other error — continue without memory

    partial_extracted = extract_profile(user_msg)
    updated_profile = merge_profiles(current_profile, partial_extracted)
    # Also update profile language preference
    updated_profile.language = lang
    update_session_profile(session_id, updated_profile)

    # Track which fields came from memory (for explainability)
    memory_fields_used = [f for f in memory_profile if getattr(updated_profile, f, None) is not None]

    # [4] Clarification logic
    clarifying_q: Optional[str] = None

    if intent in ["discover", "eligibility"]:
        # If user is a farmer (or targeted PM Kisan) and land holding is unknown
        if (updated_profile.occupation == "farmer" or target_scheme_id == "pm-kisan") and updated_profile.land_holding_hectares is None:
            clarifying_q = get_clarifying_question("land_holding_hectares", language=lang)
        # If user is a student and income is unknown
        elif (updated_profile.occupation == "student" or target_scheme_id == "post-matric-scholarship") and updated_profile.annual_family_income is None:
            clarifying_q = get_clarifying_question("annual_family_income", language=lang)
        # If intent is discover and occupation is completely unknown and no schemes mentioned
        elif intent == "discover" and updated_profile.occupation is None and not target_scheme_id and len(user_msg.split()) > 2:
            clarifying_q = get_clarifying_question("occupation", language=lang)

    # If clarifying question is needed: stop turn early and prompt the user for the single field
    if clarifying_q:
        answer, disclaimer = explain(
            user_message=user_msg,
            language=lang,
            intent=intent,
            schemes=[],
            eligibility_results=[],
            chunks=[],
            clarifying_question=clarifying_q
        )
        return ChatResponse(
            answer=answer,
            language=lang,
            profile=updated_profile.model_dump(),
            clarifying_question=clarifying_q,
            schemes=[],
            eligibility=[],
            citations=[],
            disclaimer=disclaimer,
            memory_proposals=[],
            explanation=AnswerExplanation(
                intent=intent,
                language_detected=detected_lang,
                memory_fields_used=memory_fields_used,
                chunks_retrieved=[],
                eligibility_operators_fired=[],
            )
        )

    # [5] Retrieval
    matched_schemes, chunks = retrieve_schemes_and_chunks(
        query=user_msg,
        profile=updated_profile,
        intent=intent,
        target_scheme_id=target_scheme_id,
        top_k=3
    )

    # [6] Deterministic eligibility assessment
    eligibility_results: List[EligibilityResult] = []
    schemes_to_evaluate = [s for s in matched_schemes if target_scheme_id is None or s.id == target_scheme_id]
    if not schemes_to_evaluate:
        schemes_to_evaluate = matched_schemes

    eligibility_operators_fired = []
    for scheme in schemes_to_evaluate:
        res = evaluate_eligibility(scheme=scheme, profile=updated_profile, language=lang)
        eligibility_results.append(res)
        # Collect operator details for explainability
        for cr in res.criteria_results:
            crit_obj = next((c for c in scheme.criteria if c.id == cr.criterion_id), None)
            if crit_obj:
                eligibility_operators_fired.append({
                    "criterion": cr.label,
                    "op": crit_obj.op,
                    "required_value": crit_obj.value,
                    "user_value": cr.user_value,
                    "result": cr.status,
                })

    # [7] Grounded explanation generation
    answer, disclaimer = explain(
        user_message=user_msg,
        language=lang,
        intent=intent,
        schemes=matched_schemes,
        eligibility_results=eligibility_results,
        chunks=chunks,
        clarifying_question=None
    )

    # [8] Build citations
    citations = build_citations(chunks=chunks, schemes=matched_schemes)

    # Format schemes list for response
    chat_schemes = [
        ChatSchemeItem(
            id=s.id,
            name=s.name.get(lang, s.name.get("en", s.id)),
            why_relevant=s.summary.get(lang, s.summary.get("en", "")),
            official_url=s.official_url,
        )
        for s in matched_schemes
    ]

    # [9] Compute memory proposals (only if user is authenticated)
    memory_proposals: List[MemoryProposal] = []
    if user_id:
        extracted_as_dict = {
            f: getattr(partial_extracted, f)
            for f in ["occupation", "state", "district", "land_holding_hectares",
                      "annual_family_income", "caste_category", "residence",
                      "age", "gender", "education_level", "is_disabled", "is_bpl"]
            if getattr(partial_extracted, f) is not None
        }
        if extracted_as_dict:
            proposals_raw = compute_memory_proposals(extracted_as_dict, memory_profile)
            memory_proposals = [MemoryProposal(**p) for p in proposals_raw]

    # [10] Explainability metadata
    explanation = AnswerExplanation(
        intent=intent,
        language_detected=detected_lang,
        memory_fields_used=memory_fields_used,
        chunks_retrieved=[
            {
                "title": c.get("metadata", {}).get("title", "Scheme"),
                "page": c.get("metadata", {}).get("page", 0),
                "score": round(1 - (c.get("distance", 0) or 0), 3),
                "preview": c.get("text", "")[:120],
            }
            for c in chunks[:3]
        ],
        eligibility_operators_fired=eligibility_operators_fired,
    )

    return ChatResponse(
        answer=answer,
        language=lang,
        profile=updated_profile.model_dump(),
        clarifying_question=None,
        schemes=chat_schemes,
        eligibility=eligibility_results,
        citations=citations,
        disclaimer=disclaimer,
        memory_proposals=memory_proposals,
        explanation=explanation,
    )
