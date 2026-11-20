"""
Phase 7: Government Notice / Circular Upload & Plain-Language Explainer
POST /api/notice/explain
  - Accepts PDF or image (JPEG, PNG) uploads up to 10 MB, 30 pages max
  - Extracts text page-by-page using PyMuPDF (fitz)
  - Sends to LLM for structured plain-language summarization in EN/HI/MR
  - Falls back to deterministic chunked extraction if LLM unavailable
  - Returns: summary, key_points, affected_groups, deadlines, citations
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional, List, Dict, Any
import pymupdf as fitz  # PyMuPDF ≥2.0 modern import
import io
import logging

from backend.app.llm.client import llm_client

logger = logging.getLogger("nagrik_notice")

router = APIRouter(prefix="/api/notice", tags=["notice"])

# --- Constants ---
MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_PAGES = 30
ALLOWED_MIME = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
}

NOTICE_PROMPT_TEMPLATE = """\
You are NagrikAI, an Indian civic intelligence assistant.
You have been given extracted text from a government notice, circular, or policy order.

Your task:
1. Write a SHORT plain-language summary (3–5 sentences, school-student level) of what this notice is about.
2. List the KEY POINTS (up to 6 bullet points) — what changes, what citizens must do, what benefits apply.
3. Identify AFFECTED GROUPS (e.g. "farmers in Maharashtra", "SC/ST students", "all citizens").
4. Extract any DEADLINES or DATES mentioned.
5. Output ONLY a valid JSON object (no markdown, no code blocks) with this exact schema:
{{
  "summary": "...",
  "key_points": ["...", "..."],
  "affected_groups": ["...", "..."],
  "deadlines": ["..."],
  "language_used": "{language}"
}}

NOTICE TEXT (extracted page by page):
{notice_text}

Respond ONLY with the JSON object. Language of output: {language}
"""

LANG_LABELS = {"en": "English", "hi": "Hindi", "mr": "Marathi"}


def _extract_text_from_pdf(file_bytes: bytes) -> List[Dict[str, Any]]:
    """Extract text page-by-page from a PDF using PyMuPDF."""
    pages = []
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        total_pages = len(doc)
        if total_pages > MAX_PAGES:
            doc.close()
            raise HTTPException(
                status_code=422,
                detail=f"PDF has {total_pages} pages. Maximum allowed is {MAX_PAGES}."
            )
        for page_num in range(total_pages):
            page = doc[page_num]
            text = page.get_text("text").strip()
            if text:
                pages.append({"page": page_num + 1, "text": text})
        doc.close()
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"PyMuPDF extraction error: {e}")
        raise HTTPException(status_code=422, detail=f"Could not extract text from PDF: {str(e)}")
    return pages


def _extract_text_from_image(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
    """
    Use PyMuPDF to open an image file and extract any embedded text.
    For scanned images without text layers, we return an empty extraction
    and let the LLM handle it via its vision fallback (if available).
    """
    try:
        filetype = "jpeg" if filename.lower().endswith(("jpg", "jpeg")) else "png"
        doc = fitz.open(stream=file_bytes, filetype=filetype)
        pages = []
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text").strip()
            if text:
                pages.append({"page": page_num + 1, "text": text})
        doc.close()
        return pages
    except Exception as e:
        logger.warning(f"Image text extraction error: {e}")
        return []


def _deterministic_summary(pages: List[Dict[str, Any]], language: str) -> Dict[str, Any]:
    """
    Rule-based fallback: returns first 3 chunks of text as summary
    when LLM is not available.
    """
    if not pages:
        if language == "hi":
            summary = "नोटिस से कोई टेक्स्ट नहीं निकाला जा सका।"
        elif language == "mr":
            summary = "नोटिसमधून मजकूर काढता आला नाही."
        else:
            summary = "No text could be extracted from the notice."
        return {
            "summary": summary,
            "key_points": [],
            "affected_groups": [],
            "deadlines": [],
            "language_used": language,
            "citations": [],
        }

    all_text = " ".join([p["text"] for p in pages[:3]])
    truncated = all_text[:600] + ("..." if len(all_text) > 600 else "")

    if language == "hi":
        summary = f"इस नोटिस में निम्न जानकारी है (पहले {min(3, len(pages))} पृष्ठों से): {truncated}"
    elif language == "mr":
        summary = f"या नोटिसमध्ये खालील माहिती आहे (पहिल्या {min(3, len(pages))} पानांमधून): {truncated}"
    else:
        summary = f"This notice contains the following information (from first {min(3, len(pages))} pages): {truncated}"

    return {
        "summary": summary,
        "key_points": [p["text"][:200] for p in pages[:6]],
        "affected_groups": [],
        "deadlines": [],
        "language_used": language,
        "citations": [{"page": p["page"], "text_preview": p["text"][:100]} for p in pages],
    }


@router.post("/explain")
async def explain_notice(
    file: UploadFile = File(...),
    language: Optional[str] = Form("en"),
):
    """
    Upload a PDF or image of a government notice/circular.
    Returns a plain-language multilingual explanation.
    """
    # Validate language
    lang = language if language in ["en", "hi", "mr"] else "en"

    # Check content type
    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: '{content_type}'. Upload a PDF, JPEG, or PNG."
        )

    # Read file and size-check
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({len(file_bytes) // (1024 * 1024)} MB). Maximum is 10 MB."
        )

    # Extract text pages
    filename = file.filename or "upload"
    if content_type == "application/pdf":
        pages = _extract_text_from_pdf(file_bytes)
    else:
        pages = _extract_text_from_image(file_bytes, filename)

    if not pages:
        raise HTTPException(
            status_code=422,
            detail="No readable text found in the uploaded file. If this is a scanned image, please upload a PDF with a text layer."
        )

    # Build combined text for LLM (page-labelled, truncated to 4000 chars per call)
    notice_text_parts = []
    total_chars = 0
    for p in pages:
        chunk = f"[Page {p['page']}]\n{p['text']}"
        if total_chars + len(chunk) > 4000:
            notice_text_parts.append("[... additional pages truncated for processing ...]")
            break
        notice_text_parts.append(chunk)
        total_chars += len(chunk)

    notice_text_combined = "\n\n".join(notice_text_parts)

    # Build citations from page data
    citations = [
        {"page": p["page"], "text_preview": p["text"][:120].replace("\n", " ")}
        for p in pages
    ]

    # Try LLM summarization
    result: Optional[Dict[str, Any]] = None
    if llm_client._has_valid_key("groq") or llm_client._has_valid_key("gemini"):
        prompt = NOTICE_PROMPT_TEMPLATE.format(
            language=LANG_LABELS.get(lang, "English"),
            notice_text=notice_text_combined,
        )
        try:
            parsed = llm_client.generate_json(
                system_prompt=prompt,
                user_message="Summarize the government notice above.",
            )
            if parsed and "summary" in parsed:
                parsed["citations"] = citations
                result = parsed
        except Exception as e:
            logger.warning(f"LLM notice summarization failed: {e}")

    # Deterministic fallback
    if not result:
        result = _deterministic_summary(pages, lang)
        result["citations"] = citations

    return JSONResponse(content=result)
