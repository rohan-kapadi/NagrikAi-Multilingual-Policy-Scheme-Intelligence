import pytest
from backend.app.ingest.build_index import search_chunks
from backend.app.data_loader import load_all_schemes, get_scheme_by_id


def test_scheme_loader():
    schemes = load_all_schemes()
    assert "pm-kisan" in schemes
    assert "post-matric-scholarship" in schemes
    
    pm = schemes["pm-kisan"]
    assert pm.verified is False
    assert "agriculture" in pm.category
    assert "en" in pm.name and "hi" in pm.name and "mr" in pm.name


def test_english_query_retrieval():
    # English query about land or installment
    results = search_chunks("How much money is given to farmers every year in PM Kisan?", top_k=3)
    assert len(results) > 0
    top = results[0]
    assert "pm-kisan" in top["metadata"]["scheme_id"]
    assert "6,000" in top["text"] or "installments" in top["text"].lower() or "pm-kisan" in top["text"].lower()


def test_hindi_query_retrieval():
    # Hindi query about scholarship / education
    results = search_chunks("छात्रवृत्ति के लिए कौन से दस्तावेज चाहिए?", top_k=3)
    assert len(results) > 0
    # Should retrieve scholarship or relevant document section
    matched_schemes = [r["metadata"]["scheme_id"] for r in results]
    assert "post-matric-scholarship" in matched_schemes or "pm-kisan" in matched_schemes
