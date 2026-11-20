from typing import List, Dict, Any
from backend.app.models import Citation, Scheme


def build_citations(chunks: List[Dict[str, Any]], schemes: List[Scheme]) -> List[Citation]:
    """
    Builds clean, deduplicated Citation objects from chunk metadata and scheme source documents.
    Grounded in official source references only.
    """
    seen = set()
    citations: List[Citation] = []

    # 1. Citations from retrieved vector chunks
    for chunk in chunks:
        meta = chunk.get("metadata", {})
        title = meta.get("title") or meta.get("scheme_id", "Government Scheme")
        url = meta.get("url", "")
        page = meta.get("page", 1)
        section = meta.get("section", "")

        key = (title, url, page, section)
        if key not in seen and url:
            seen.add(key)
            citations.append(Citation(
                title=title,
                page=page,
                section=section,
                url=url
            ))

    # 2. Fallback to scheme source documents if chunks didn't supply URL
    if not citations:
        for scheme in schemes:
            for s_doc in scheme.source_documents:
                title = s_doc.get("title", scheme.name.get("en", scheme.id))
                url = s_doc.get("url", scheme.official_url)
                key = (title, url, 1, "")
                if key not in seen and url:
                    seen.add(key)
                    citations.append(Citation(
                        title=title,
                        page=1,
                        section="Official Guidelines",
                        url=url
                    ))
            # Also ensure official portal is cited
            key = (scheme.name.get("en", scheme.id), scheme.official_url, 1, "")
            if key not in seen and scheme.official_url:
                seen.add(key)
                citations.append(Citation(
                    title=f"{scheme.name.get('en', scheme.id)} Official Portal",
                    page=1,
                    section="Portal",
                    url=scheme.official_url
                ))

    return citations
