import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.models import ChatRequest
from backend.app.pipeline.orchestrator import process_chat_turn, clear_session_profile


@pytest.fixture(autouse=True)
def cleanup_sessions():
    clear_session_profile("test-farmer-session")
    clear_session_profile("test-student-session")
    clear_session_profile("test-unspecified-session")
    yield
    clear_session_profile("test-farmer-session")
    clear_session_profile("test-student-session")
    clear_session_profile("test-unspecified-session")


def test_farmer_journey_clarification_then_discovery():
    """
    Done when criterion:
    1. Farmer gives partial profile -> gets a clarifying question first.
    2. Answers the clarifying question -> gets ranked scheme list with reasons and eligibility.
    """
    session_id = "test-farmer-session"

    # Turn 1: Farmer introduces themselves without land holding
    req1 = ChatRequest(
        session_id=session_id,
        message="Main Pune ka kisan hoon",
        language="hi"
    )
    res1 = process_chat_turn(req1)

    # Must ask for missing land holding
    assert res1.clarifying_question is not None
    assert "भूमि" in res1.clarifying_question or "हेक्टेयर" in res1.clarifying_question
    assert res1.profile.get("occupation") == "farmer"
    assert res1.profile.get("district") == "Pune"
    assert res1.profile.get("land_holding_hectares") is None

    # Turn 2: Farmer supplies land holding
    req2 = ChatRequest(
        session_id=session_id,
        message="Mere paas 1.2 hectare zameen hai",
        language="hi"
    )
    res2 = process_chat_turn(req2)

    # Clarifying question should now be cleared
    assert res2.clarifying_question is None
    # Profile should retain merged state
    assert res2.profile.get("occupation") == "farmer"
    assert res2.profile.get("district") == "Pune"
    assert res2.profile.get("land_holding_hectares") == 1.2

    # Schemes returned with reasons
    scheme_ids = [s.id for s in res2.schemes]
    assert "pm-kisan" in scheme_ids
    assert len(res2.eligibility) > 0

    pm_elig = next((e for e in res2.eligibility if e.scheme_id == "pm-kisan"), None)
    assert pm_elig is not None
    assert pm_elig.overall == "eligible"

    # Source citations & Hindi disclaimer attached
    assert len(res2.citations) > 0
    assert "अस्वीकरण" in res2.disclaimer


def test_student_scholarship_eligibility():
    """
    Done when criterion:
    A student asking about scholarship gets a per-criterion eligibility answer
    with documents and citations.
    """
    session_id = "test-student-session"
    req = ChatRequest(
        session_id=session_id,
        message="I am a college student from Nagpur with family income 180000 passed class 12, can I get post matric scholarship?",
        language="en"
    )
    res = process_chat_turn(req)

    # No clarification needed as all fields are provided
    assert res.clarifying_question is None
    assert res.profile.get("occupation") == "student"
    assert res.profile.get("annual_family_income") == 180000

    # Eligibility evaluation
    assert len(res.eligibility) > 0
    schol_elig = next((e for e in res.eligibility if e.scheme_id == "post-matric-scholarship"), None)
    assert schol_elig is not None
    assert schol_elig.overall == "eligible"

    # Per-criterion results
    assert len(schol_elig.criteria_results) >= 2
    assert all(cr.status == "met" for cr in schol_elig.criteria_results)

    # Required documents attached
    assert len(schol_elig.required_documents) > 0
    assert any("mark sheet" in doc.lower() or "certificate" in doc.lower() for doc in schol_elig.required_documents)

    # Citations attached
    assert len(res.citations) > 0
    assert any("scholarships.gov.in" in c.url for c in res.citations)


def test_unspecified_source_question():
    """
    Done when criterion:
    Asking about something not in the data returns "not specified in the source"
    plus the official link.
    """
    session_id = "test-unspecified-session"
    req = ChatRequest(
        session_id=session_id,
        message="Does PM Kisan scheme provide free tractors to farmers?",
        language="en"
    )
    res = process_chat_turn(req)

    # Must honestly report that this fact is not specified in the source
    assert "not specified in the source" in res.answer.lower()
    # Must link official portal
    assert "https://pmkisan.gov.in" in res.answer or any("pmkisan.gov.in" in c.url for c in res.citations)


def test_chat_api_endpoint():
    """
    Tests POST /api/chat via FastAPI TestClient.
    """
    client = TestClient(app)
    payload = {
        "session_id": "api-test-session",
        "message": "Namaste",
        "language": "hi"
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "language" in data
    assert data["language"] == "hi"
    assert "disclaimer" in data
