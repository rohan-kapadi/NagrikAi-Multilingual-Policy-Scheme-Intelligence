from typing import List, Dict, Any, Optional
from backend.app.models import CitizenProfile, Scheme
from backend.app.llm.client import llm_client
from backend.app.llm.prompts import PROFILE_EXTRACTION_PROMPT


CLARIFYING_QUESTIONS = {
    "land_holding_hectares": {
        "en": "Could you please tell me how much cultivable agricultural land you own (in hectares or acres)?",
        "hi": "कृपया बताएं कि आपके पास कितनी कृषि भूमि (हेक्टेयर या एकड़ में) है?",
        "mr": "कृपया सांगा की आपल्याकडे किती शेतजमीन (हेक्टर किंवा एकरमध्ये) आहे?"
    },
    "annual_family_income": {
        "en": "What is your approximate annual family income?",
        "hi": "आपकी अनुमानित वार्षिक पारिवारिक आय कितनी है?",
        "mr": "आपले अंदाजे वार्षिक कौटुंबिक उत्पन्न किती आहे?"
    },
    "occupation": {
        "en": "What is your primary occupation (e.g. farmer, student, worker, self-employed)?",
        "hi": "आपका मुख्य व्यवसाय क्या है (जैसे किसान, छात्र, मजदूर, स्वरोजगार)?",
        "mr": "आपला मुख्य व्यवसाय काय आहे (उदा. शेतकरी, विद्यार्थी, कामगार, स्वयंरोजगार)?"
    },
    "education_level": {
        "en": "What is your current education level (e.g. Class 10, Class 12, Graduate)?",
        "hi": "आपकी वर्तमान शिक्षा का स्तर क्या है (जैसे 10वीं, 12वीं, स्नातक)?",
        "mr": "आपले सध्याचे शिक्षण काय आहे (उदा. 10वी, 12वी, पदवी)?"
    },
    "caste_category": {
        "en": "What is your social/caste category (General, OBC, SC, ST)?",
        "hi": "आपका सामाजिक वर्ग/जाति वर्ग क्या है (सामान्य, ओबीसी, एससी, एसटी)?",
        "mr": "आपला सामाजिक/प्रवर्ग काय आहे (खुला, ओबीसी, एससी, एसटी)?"
    },
    "district": {
        "en": "Which district and state do you reside in?",
        "hi": "आप किस जिले और राज्य में रहते हैं?",
        "mr": "आपण कोणत्या जिल्ह्यात आणि राज्यात राहता?"
    }
}


def extract_profile(message: str) -> CitizenProfile:
    """
    Extracts a partial CitizenProfile from a user message.
    Uses LLM with strict JSON schema and falls back to deterministic extractor.
    Unknown fields remain None (never guessed).
    """
    extracted_dict = llm_client.generate_json(
        system_prompt=PROFILE_EXTRACTION_PROMPT,
        user_prompt=message
    )
    if not isinstance(extracted_dict, dict):
        extracted_dict = {}

    # Strict normalization according to schema
    return CitizenProfile(
        age=extracted_dict.get("age"),
        gender=extracted_dict.get("gender"),
        state=extracted_dict.get("state"),
        district=extracted_dict.get("district"),
        residence=extracted_dict.get("residence"),
        occupation=extracted_dict.get("occupation"),
        annual_family_income=extracted_dict.get("annual_family_income"),
        caste_category=extracted_dict.get("caste_category"),
        land_holding_hectares=extracted_dict.get("land_holding_hectares"),
        education_level=extracted_dict.get("education_level"),
        is_disabled=extracted_dict.get("is_disabled"),
        is_bpl=extracted_dict.get("is_bpl"),
        language=extracted_dict.get("language")
    )


def merge_profiles(existing: CitizenProfile, partial: CitizenProfile) -> CitizenProfile:
    """
    Merges new partial profile into existing session profile.
    Only non-null fields in partial overwrite existing fields.
    """
    merged_data = existing.model_dump()
    partial_data = partial.model_dump()

    for key, val in partial_data.items():
        if val is not None:
            merged_data[key] = val

    return CitizenProfile.model_validate(merged_data)


def compute_missing_fields_for_scheme(scheme: Scheme, profile: CitizenProfile) -> List[str]:
    """
    Computes required fields that are missing (None) in the profile for evaluating a scheme.
    """
    profile_dict = profile.model_dump()
    missing: List[str] = []

    for criterion in scheme.criteria:
        if profile_dict.get(criterion.field) is None and criterion.field not in missing:
            missing.append(criterion.field)

    return missing


def get_clarifying_question(missing_field: str, language: str = "en") -> str:
    """
    Generates exactly ONE polite clarifying question for the missing profile attribute.
    """
    q_dict = CLARIFYING_QUESTIONS.get(missing_field, {
        "en": f"Could you please specify your {missing_field.replace('_', ' ')}?",
        "hi": f"कृपया अपने {missing_field.replace('_', ' ')} के बारे में बताएं?",
        "mr": f"कृपया आपल्या {missing_field.replace('_', ' ')} बद्दल सांगा?"
    })
    return q_dict.get(language, q_dict.get("en", f"Could you please share your {missing_field}?"))
