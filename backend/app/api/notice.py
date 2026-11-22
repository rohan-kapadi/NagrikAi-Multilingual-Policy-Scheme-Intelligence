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
import re
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


def _clean_page_text(raw: str) -> str:
    """Filter out running headers, page numbers, and repetitive stamps."""
    lines = raw.split("\n")
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        # Drop repetitive page counters & demo document stamps
        if re.match(r"^Page\s+\d+\s+of\s+\d+", stripped, re.IGNORECASE):
            continue
        if "DEMO DOCUMENT" in stripped:
            continue
        cleaned_lines.append(stripped)
    return "\n".join(cleaned_lines)


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
            cleaned = _clean_page_text(text)
            if cleaned:
                pages.append({"page": page_num + 1, "text": cleaned, "raw": text})
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
    For scanned images without text layers, we return an empty extraction.
    """
    try:
        filetype = "jpeg" if filename.lower().endswith(("jpg", "jpeg")) else "png"
        doc = fitz.open(stream=file_bytes, filetype=filetype)
        pages = []
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text").strip()
            cleaned = _clean_page_text(text)
            if cleaned:
                pages.append({"page": page_num + 1, "text": cleaned, "raw": text})
        doc.close()
        return pages
    except Exception as e:
        logger.warning(f"Image text extraction error: {e}")
        return []


def _deterministic_summary(pages: List[Dict[str, Any]], language: str) -> Dict[str, Any]:
    """
    Rule-based fallback: extracts structured information using pattern matching
    when the LLM is temporarily unavailable or in offline mode.
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

    full_text = "\n".join(p["text"] for p in pages)

    # 1. Subject extraction
    subject_match = re.search(r"Subject[:\s\-]+([^\n\.]+(?:\n[^\n\.]+){0,2})", full_text, re.IGNORECASE)
    subject = subject_match.group(1).strip().replace("\n", " ") if subject_match else ""

    # 2. Extract key policy decision points
    points: List[str] = []
    # Search for numbered clauses like "1. ...", "4.1 ...", "A) ..."
    clause_matches = re.findall(r"(?:^|\n)(?:[0-9]{1,2}(?:\.[0-9]+)?|[A-Z]\))\s+([A-Z][^\n]+(?:\n[A-Z0-9a-z][^\n]+)?)", full_text)
    for c in clause_matches:
        cleaned_c = " ".join(c.split())
        if len(cleaned_c) > 25 and not any(cleaned_c in p for p in points):
            points.append(cleaned_c[:220])
        if len(points) >= 6:
            break

    # If no numbered clauses found, take clean paragraphs
    if not points:
        for p in pages:
            lines = [l.strip() for l in p["text"].split("\n") if len(l.strip()) > 35]
            for l in lines[:2]:
                if l not in points:
                    points.append(l[:200])
                if len(points) >= 6:
                    break
            if len(points) >= 6:
                break

    # 3. Detect affected groups
    affected: List[str] = []
    text_lower = full_text.lower()
    if any(w in text_lower for w in ["student", "higher education", "college", "vidyarthi", "scholarship", "degree"]):
        affected.append("Students enrolled in higher education / scholarship applicants")
    if any(w in text_lower for w in ["farmer", "kisan", "agriculture", "land", "cultivator"]):
        affected.append("Farmers and agricultural landowners")
    if any(w in text_lower for w in ["women", "mahila", "girl", "daughter", "bahin"]):
        affected.append("Women and female beneficiaries")
    if any(w in text_lower for w in ["sc/st", "scheduled caste", "scheduled tribe", "obc", "vjnt", "sbc"]):
        affected.append("Reserved category (SC / ST / OBC / VJNT) beneficiaries")
    if any(w in text_lower for w in ["income", "bpl", "economic", "lakh"]):
        affected.append("Families meeting prescribed annual income thresholds")
    if not affected:
        affected.append("Citizens and residents of the issuing jurisdiction")

    # 4. Extract dates / deadlines
    deadlines: List[str] = []
    date_matches = re.finditer(r"\b(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b", full_text, re.IGNORECASE)
    seen_dates = set()
    for m in date_matches:
        d_str = m.group(1)
        if d_str not in seen_dates:
            seen_dates.add(d_str)
            # Find surrounding snippet
            start = max(0, m.start() - 35)
            end = min(len(full_text), m.end() + 35)
            snippet = " ".join(full_text[start:end].split())
            deadlines.append(snippet[:90])
        if len(deadlines) >= 4:
            break

    # Fallback summary sentence
    if subject:
        summary = f"This government notice relates to {subject}. It outlines policy guidelines, institutional eligibility criteria, and implementation directives."
    else:
        summary = f"Official government circular containing {len(pages)} page(s) of administrative orders, eligibility criteria, and disbursement directives."

    return {
        "summary": summary,
        "key_points": points[:6],
        "affected_groups": affected[:4],
        "deadlines": deadlines[:4],
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

    # Build combined text for LLM (page-labelled, up to 12,000 chars per call)
    notice_text_parts = []
    total_chars = 0
    for p in pages:
        chunk = f"[Page {p['page']}]\n{p['text']}"
        if total_chars + len(chunk) > 12000:
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
                user_prompt="Summarize the government notice above.",
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
