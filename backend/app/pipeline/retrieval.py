import re
from typing import List, Dict, Any, Optional, Tuple
from backend.app.models import Scheme, CitizenProfile
from backend.app.data_loader import load_all_schemes, filter_schemes, get_scheme_by_id
from backend.app.ingest.build_index import search_chunks
from backend.app.pipeline.gov_portal_registry import (
    search_authoritative_gov_portals,
    match_curated_portal_scheme
)

EXTERNAL_SCHEME_KEYWORDS = [
    "svanidhi", "street vendor", "स्वनिधि",
    "ayushman", "pmjay", "pm-jay", "golden card", "health card", "आयुष्मान", "जन आरोग्य",
    "pm awas", "awas yojana", "pmay", "घरकुल", "आवास योजना",
    "ladki bahin", "ladli behna", "लाडकी बहीण",
    "sukanya", "सुकन्या",
    "atal pension", "apy", "अटल पेंशन",
    "ujjwala", "उज्ज्वला", "lpg", "gas cylinder",
    "mudra", "मुद्रा",
    "vishwakarma", "विश्वकर्मा",
    "ration card", "राशन कार्ड",
]

LOCAL_SCHEME_KEYWORDS = [
    "kisan", "pm-kisan", "krishi", "land", "farmer", "किसान",
    "scholarship", "post-matric", "matric", "छात्रवृत्ति", "शिष्यवृत्ती",
    "mahadbt", "tuition", "examination fee", "exam fee", "vjnt", "sbc", "obc fee", "fee waiver", "शिक्षण शुल्क", "परीक्षा शुल्क"
]


def retrieve_schemes_and_chunks(
    query: str,
    profile: CitizenProfile,
    intent: str,
    target_scheme_id: Optional[str] = None,
    top_k: int = 3
) -> Tuple[List[Scheme], List[Dict[str, Any]]]:
    """
    Combines structured pre-filtering (state, occupation/category) with vector search
    and dynamic Authoritative Government Portal Registry retrieval.
    Returns (matched_schemes, relevant_chunks).
    """
    all_schemes = load_all_schemes()
    matched_schemes_dict: Dict[str, Scheme] = {}
    q_lower = query.lower()

    # 1. Target scheme direct lookup if explicitly identified in local database
    if target_scheme_id and target_scheme_id in all_schemes:
        matched_schemes_dict[target_scheme_id] = all_schemes[target_scheme_id]

    # 2. Structured pre-filtering based on profile
    category_filter = None
    if profile.occupation == "farmer":
        category_filter = "agriculture"
    elif profile.occupation == "student":
        category_filter = "education"

    filtered_candidates = filter_schemes(category=category_filter, state=profile.state)
    for s in filtered_candidates:
        matched_schemes_dict[s.id] = s

    # 3. Vector search over chunked source texts in ChromaDB
    chunks = search_chunks(
        query=query,
        top_k=top_k,
        scheme_id=target_scheme_id if target_scheme_id in all_schemes else None
    )

    # 4. Check if this is an external / unindexed scheme query
    has_curated_match = match_curated_portal_scheme(query) is not None
    has_external_kw = any(kw in q_lower for kw in EXTERNAL_SCHEME_KEYWORDS)
    has_local_kw = any(kw in q_lower for kw in LOCAL_SCHEME_KEYWORDS)

    is_external_target = (
        has_curated_match
        or (has_external_kw and not has_local_kw)
        or (target_scheme_id is not None and target_scheme_id not in all_schemes)
    )

    # 5. Live Scoped Retrieval from Authoritative Portal Registry
    # Trigger if external target query OR no local chunks found
    if is_external_target or not chunks:
        live_chunks = search_authoritative_gov_portals(query=query, max_results=top_k)
        if live_chunks:
            if is_external_target:
                # User specifically asked for an unindexed official scheme
                # Replace mismatched local chunks so explanations remain strictly grounded
                chunks = live_chunks
                matched_schemes_dict.clear()
            else:
                chunks = live_chunks + chunks

            for idx, lc in enumerate(live_chunks, 1):
                raw_meta = lc.get("metadata", {})
                dyn_id = raw_meta.get("scheme_id", f"gov-live-{idx}")
                raw_title = raw_meta.get("title", "Government Scheme")
                clean_title = raw_title.split("|")[0].split("-")[0].strip()
                portal_label = raw_meta.get("portal", "Official Government Portal")
                summary_text = raw_meta.get("summary", f"Retrieved live from {portal_label}")

                matched_schemes_dict[dyn_id] = Scheme(
                    id=dyn_id,
                    name={"en": clean_title, "hi": clean_title, "mr": clean_title},
                    level="central",
                    category=["government_scheme"],
                    summary={
                        "en": summary_text,
                        "hi": f"{portal_label} से प्राप्त आधिकारिक योजना: {summary_text}",
                        "mr": f"{portal_label} वरून मिळवलेली अधिकृत योजना: {summary_text}",
                    },
                    benefits={
                        "en": f"Official guidelines from {portal_label}. See portal for comprehensive schedule.",
                        "hi": f"{portal_label} अनुसार आधिकारिक लाभ व मार्गदर्शक तत्त्वे।",
                        "mr": f"{portal_label} नुसार अधिकृत लाभ व मार्गदर्शक तत्त्वे.",
                    },
                    criteria=[],
                    exclusions=[],
                    required_documents=[],
                    how_to_apply={
                        "en": f"Apply online at official portal: {lc['url']}",
                        "hi": f"आधिकारिक पोर्टल पर ऑनलाइन आवेदन करें: {lc['url']}",
                        "mr": f"अधिकृत पोर्टलवर ऑनलाइन अर्ज करा: {lc['url']}",
                    },
                    official_url=lc["url"],
                    source_documents=[{"title": clean_title, "url": lc["url"]}],
                    verified=True
                )

    # Add schemes surfaced by vector retrieval if not already present
    if not is_external_target:
        for chunk in chunks:
            meta = chunk.get("metadata", {})
            s_id = meta.get("scheme_id")
            if s_id and s_id in all_schemes and s_id not in matched_schemes_dict:
                matched_schemes_dict[s_id] = all_schemes[s_id]

    # If still no schemes matched (e.g. general query), include available candidates
    if not matched_schemes_dict:
        for s in list(all_schemes.values())[:top_k]:
            matched_schemes_dict[s.id] = s

    return list(matched_schemes_dict.values()), chunks
