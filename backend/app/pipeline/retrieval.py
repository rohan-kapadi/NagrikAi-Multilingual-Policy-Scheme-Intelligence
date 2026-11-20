from typing import List, Dict, Any, Optional, Tuple
from backend.app.models import Scheme, CitizenProfile
from backend.app.data_loader import load_all_schemes, filter_schemes, get_scheme_by_id
from backend.app.ingest.build_index import search_chunks


def retrieve_schemes_and_chunks(
    query: str,
    profile: CitizenProfile,
    intent: str,
    target_scheme_id: Optional[str] = None,
    top_k: int = 3
) -> Tuple[List[Scheme], List[Dict[str, Any]]]:
    """
    Combines structured pre-filtering (state, occupation/category) with vector search.
    Returns (matched_schemes, relevant_chunks).
    """
    all_schemes = load_all_schemes()
    matched_schemes_dict: Dict[str, Scheme] = {}

    # 1. Target scheme direct lookup if explicitly identified
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
        scheme_id=target_scheme_id
    )

    # Add schemes surfaced by vector retrieval if not already present
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
