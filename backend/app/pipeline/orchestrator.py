from typing import Dict, Any, Optional, List
from backend.app.models import (
    ChatRequest, ChatResponse, ChatSchemeItem, CitizenProfile, Scheme, EligibilityResult
)
from backend.app.pipeline.intent import classify_intent, detect_language
from backend.app.pipeline.profile import (
    extract_profile, merge_profiles, compute_missing_fields_for_scheme, get_clarifying_question
)
from backend.app.pipeline.retrieval import retrieve_schemes_and_chunks
from backend.app.pipeline.eligibility import evaluate_eligibility
from backend.app.pipeline.citations import build_citations
from backend.app.pipeline.explain import explain
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
    [3] Profile extraction & merge into session profile
    [4] Clarify check (ask ONE short question if critical profile attribute missing)
    [5] Retrieve (structured candidate prefilter + Chroma vector search)
    [6] Deterministic eligibility engine evaluation
    [7] Grounded multilingual explanation generation
    [8] Citations & required documents assembly
    """
    session_id = request.session_id or "default"
    user_msg = request.message.strip()

    # [1] Language determination: prefer request param if valid, or auto-detect from text
    detected_lang = detect_language(user_msg)
    lang = request.language if request.language in ["en", "hi", "mr"] else detected_lang

    # [2] Intent classification
    intent_data = classify_intent(user_msg)
    intent = intent_data.get("intent", "discover")
    target_scheme_id = intent_data.get("target_scheme_id")

    # [3] Profile extraction & merge
    current_profile = get_session_profile(session_id)
    partial_extracted = extract_profile(user_msg)
    updated_profile = merge_profiles(current_profile, partial_extracted)
    # Also update profile language preference
    updated_profile.language = lang
    update_session_profile(session_id, updated_profile)

    # [4] Clarification logic
    # Check if a critical field is missing for the active intent / scheme
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
            disclaimer=disclaimer
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
    # If specific scheme was targeted or intent is eligibility/discover with candidate schemes
    schemes_to_evaluate = [s for s in matched_schemes if target_scheme_id is None or s.id == target_scheme_id]
    if not schemes_to_evaluate:
        schemes_to_evaluate = matched_schemes

    for scheme in schemes_to_evaluate:
        res = evaluate_eligibility(scheme=scheme, profile=updated_profile, language=lang)
        eligibility_results.append(res)

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

    return ChatResponse(
        answer=answer,
        language=lang,
        profile=updated_profile.model_dump(),
        clarifying_question=None,
        schemes=chat_schemes,
        eligibility=eligibility_results,
        citations=citations,
        disclaimer=disclaimer
    )
