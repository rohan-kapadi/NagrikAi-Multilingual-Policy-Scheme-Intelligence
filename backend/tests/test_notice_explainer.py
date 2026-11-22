import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
import os

client = TestClient(app)

PDF_PATH = os.path.join(os.path.dirname(__file__), "test_government_resolution.pdf")


def test_notice_explain_pdf_success():
    assert os.path.exists(PDF_PATH), "Test PDF file must exist"
    with open(PDF_PATH, "rb") as f:
        response = client.post(
            "/api/notice/explain",
            files={"file": ("test_government_resolution.pdf", f, "application/pdf")},
            data={"language": "en"}
        )
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data and len(data["summary"]) > 20
    assert "key_points" in data and isinstance(data["key_points"], list)
    assert len(data["key_points"]) > 0
    assert "affected_groups" in data and isinstance(data["affected_groups"], list)
    assert "deadlines" in data and isinstance(data["deadlines"], list)
    assert "citations" in data and len(data["citations"]) > 0
    # Citations should not have empty previews
    assert data["citations"][0]["page"] == 1


def test_notice_explain_invalid_mime():
    response = client.post(
        "/api/notice/explain",
        files={"file": ("test.txt", b"plain text content", "text/plain")},
        data={"language": "en"}
    )
    assert response.status_code == 415
