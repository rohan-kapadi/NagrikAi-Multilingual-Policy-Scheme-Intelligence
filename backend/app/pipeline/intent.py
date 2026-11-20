import re
from typing import Dict, Any, Optional
from backend.app.llm.client import llm_client
from backend.app.llm.prompts import INTENT_CLASSIFICATION_PROMPT


def detect_language(text: str) -> str:
    """
    Detects language: Marathi (mr), Hindi (hi), or English (en).
    """
    # Devanagari script detection
    devanagari_chars = len(re.findall(r'[\u0900-\u097F]', text))
    if devanagari_chars > 2:
        # Check specific Marathi vocabulary / markers
        marathi_markers = ["आहे", "नाही", "शेतकरी", "कौटुंबिक", "उत्पन्न", "माहिती", "अर्ज", "पात्रता", "करावे", "योजना"]
        if any(w in text for w in marathi_markers):
            return "mr"
        return "hi"
    return "en"


def classify_intent(message: str) -> Dict[str, Any]:
    """
    Classifies user message intent into:
    discover | eligibility | ask_question | explain_notice | compare | chitchat
    """
    text_lower = message.lower()
    lang = detect_language(message)

    # Fast keyword heuristic check
    target_scheme_id = None
    if "pm-kisan" in text_lower or "pm kisan" in text_lower or "kisan samman" in text_lower or "किसान सम्मान" in text_lower:
        target_scheme_id = "pm-kisan"
    elif "scholarship" in text_lower or "post matric" in text_lower or "छात्रवृत्ति" in text_lower or "शिष्यवृत्ती" in text_lower:
        target_scheme_id = "post-matric-scholarship"

    # Intent detection
    if any(w in text_lower for w in ["compare", "vs", "versus", "तुलना"]):
        return {"intent": "compare", "target_scheme_id": target_scheme_id, "language": lang}

    if any(w in text_lower for w in ["notice", "circular", "order", "pdf", "अधिसूचना", "परिपत्रक"]):
        return {"intent": "explain_notice", "target_scheme_id": target_scheme_id, "language": lang}

    if any(w in text_lower for w in ["eligible", "qualify", "पात्र", "पात्रता", "मिल सकता है", "मिळेल का"]):
        return {"intent": "eligibility", "target_scheme_id": target_scheme_id, "language": lang}

    if any(w in text_lower for w in ["hello", "namaste", "hi", "hey", "नमस्ते", "नमस्कार", "dhanyawad", "thank"]):
        # If it's just a greeting without profile info
        if len(text_lower.split()) <= 3 and not target_scheme_id:
            return {"intent": "chitchat", "target_scheme_id": None, "language": lang}

    if target_scheme_id and any(w in text_lower for w in ["how to", "apply", "document", "benefit", "किस्त", "पैसे", "अर्ज"]):
        return {"intent": "ask_question", "target_scheme_id": target_scheme_id, "language": lang}

    # Discover intent when user talks about themselves, what schemes exist, or mentions profile
    return {"intent": "discover", "target_scheme_id": target_scheme_id, "language": lang}
