import re
from typing import Dict, Any, Optional, Tuple
from backend.app.llm.client import llm_client
from backend.app.llm.prompts import INTENT_CLASSIFICATION_PROMPT

# Scheme keyword → id mapping, easy to extend as more schemes are added
SCHEME_KEYWORDS: Dict[str, str] = {
    # MahaDBT Tuition & Exam Fees (OBC/VJNT/SBC) - match specific before generic scholarship
    "tuition fee": "mahadbt-tuition-exam-fees",
    "tution fee": "mahadbt-tuition-exam-fees",
    "examination fee": "mahadbt-tuition-exam-fees",
    "exam fee": "mahadbt-tuition-exam-fees",
    "fee reimbursement": "mahadbt-tuition-exam-fees",
    "mahadbt": "mahadbt-tuition-exam-fees",
    "maha dbt": "mahadbt-tuition-exam-fees",
    "vjnt": "mahadbt-tuition-exam-fees",
    "jnt": "mahadbt-tuition-exam-fees",
    "sbc": "mahadbt-tuition-exam-fees",
    "शिक्षण शुल्क": "mahadbt-tuition-exam-fees",
    "परीक्षा शुल्क": "mahadbt-tuition-exam-fees",
    "महाडीबीटी": "mahadbt-tuition-exam-fees",

    # PM Kisan
    "pm-kisan": "pm-kisan",
    "pm kisan": "pm-kisan",
    "kisan samman": "pm-kisan",
    "किसान सम्मान": "pm-kisan",
    "पीएम किसान": "pm-kisan",
    "पीएम-किसान": "pm-kisan",

    # Central NSP Scholarship
    "scholarship": "post-matric-scholarship",
    "post matric": "post-matric-scholarship",
    "post-matric": "post-matric-scholarship",
    "छात्रवृत्ति": "post-matric-scholarship",
    "शिष्यवृत्ती": "post-matric-scholarship",
    "nsp": "post-matric-scholarship",
    "national scholarship": "post-matric-scholarship",
}


def detect_language(text: str) -> str:
    """
    Detects language: Marathi (mr), Hindi (hi), or English (en).
    Uses Devanagari unicode detection + Marathi vocabulary markers.
    """
    devanagari_chars = len(re.findall(r'[\u0900-\u097F]', text))
    if devanagari_chars > 2:
        # Marathi-specific vocabulary (not shared with Hindi)
        marathi_markers = [
            "आहे", "नाही", "शेतकरी", "कौटुंबिक", "उत्पन्न",
            "माहिती", "अर्ज", "करावे", "आपले", "आपला", "आपण",
            "जमीन", "पोर्टल", "शिष्यवृत्ती", "पात्र", "पहा",
            "सांगा", "आहात", "येईल", "मिळेल"
        ]
        if any(w in text for w in marathi_markers):
            return "mr"
        return "hi"
    return "en"


def detect_target_scheme(text_lower: str) -> Optional[str]:
    """Detects which scheme the user is referring to."""
    for keyword, scheme_id in SCHEME_KEYWORDS.items():
        if keyword in text_lower:
            return scheme_id
    return None


def classify_intent(message: str) -> Dict[str, Any]:
    """
    Classifies user message intent using fast keyword heuristics.
    Falls back to discover if no strong signal found.
    Returns: {"intent": str, "target_scheme_id": str|None, "language": str}
    """
    text_lower = message.lower()
    lang = detect_language(message)
    target_scheme_id = detect_target_scheme(text_lower)

    # Priority order: compare > explain_notice > eligibility > ask_question > chitchat > discover

    if any(w in text_lower for w in ["compare", "vs ", "versus", "तुलना", "फरक काय"]):
        return {"intent": "compare", "target_scheme_id": target_scheme_id, "language": lang}

    if any(w in text_lower for w in ["notice", "circular", "order", "pdf", "अधिसूचना", "परिपत्रक", "government order"]):
        return {"intent": "explain_notice", "target_scheme_id": target_scheme_id, "language": lang}

    # Eligibility signals — must check BEFORE ask_question so "am i eligible?" routes correctly
    if any(w in text_lower for w in [
        "eligible", "qualify", "am i eligible", "can i get", "do i qualify",
        "am i a", "am i entitled", "will i get",
        "पात्र", "पात्रता", "मिल सकता", "मिल सकती", "मिलेगा",
        "मिळेल का", "मिळू शकतो", "पात्र आहे का"
    ]):
        return {"intent": "eligibility", "target_scheme_id": target_scheme_id, "language": lang}

    # Factual question signals
    if any(w in text_lower for w in [
        "does", "is there", "will", "provide", "give", "how to", "how much", "what is", "what are",
        "document", "apply", "benefit", "amount", "money", "rupee", "kaise", "kitna", "kya hai",
        "किस्त", "राशि", "दस्तावेज", "कैसे", "क्या", "देता है", "मिलता है",
        "किती", "काय आहे", "अर्ज कसा", "कागदपत्रे", "मिळेल काय"
    ]) or "?" in text_lower:
        return {"intent": "ask_question", "target_scheme_id": target_scheme_id, "language": lang}

    # Chitchat: short greetings with no profile or scheme info
    greeting_words = ["hello", "hi", "hey", "namaste", "नमस्ते", "नमस्कार", "thank", "dhanyawad", "shukriya", "bye"]
    if any(w in text_lower for w in greeting_words):
        # Only chitchat if it's a short message with no meaningful content
        words = text_lower.split()
        if len(words) <= 5 and not target_scheme_id and not any(
            w in text_lower for w in ["kisan", "farmer", "student", "income", "land"]
        ):
            return {"intent": "chitchat", "target_scheme_id": None, "language": lang}

    # Default: discover - user is sharing profile info or asking what they can get
    return {"intent": "discover", "target_scheme_id": target_scheme_id, "language": lang}
