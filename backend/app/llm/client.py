import json
import logging
import re
from typing import Dict, Any, Optional
import httpx
from backend.app.config import settings

logger = logging.getLogger("nagrik_llm")


class LLMClient:
    """
    Provider-agnostic LLM wrapper supporting Groq (primary) and Gemini (fallback),
    with automatic JSON validation, single retry on parse failure, and safe offline fallback.
    """

    def __init__(self):
        self.groq_api_key = settings.GROQ_API_KEY
        self.gemini_api_key = settings.GEMINI_API_KEY
        self.default_provider = settings.DEFAULT_LLM_PROVIDER
        self.groq_model = settings.GROQ_MODEL
        self.gemini_model = settings.GEMINI_MODEL

    def _call_groq(self, system_prompt: str, user_prompt: str, temperature: float = 0.1) -> str:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.groq_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": temperature,
            "response_format": {"type": "json_object"}
        }
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    def _call_gemini(self, system_prompt: str, user_prompt: str, temperature: float = 0.1) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={self.gemini_api_key}"
        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"parts": [{"text": user_prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "response_mime_type": "application/json"
            }
        }
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]

    def _heuristic_extract_profile(self, text: str) -> Dict[str, Any]:
        """
        Deterministic regex/rule fallback when no external LLM key is configured.
        Supports Hindi, Marathi, Hinglish, and English profile extraction.
        """
        text_lower = text.lower()
        extracted: Dict[str, Any] = {
            "age": None,
            "gender": None,
            "state": None,
            "district": None,
            "residence": None,
            "occupation": None,
            "annual_family_income": None,
            "caste_category": None,
            "land_holding_hectares": None,
            "education_level": None,
            "is_disabled": None,
            "is_bpl": None,
            "language": None
        }

        # Occupation
        if any(w in text_lower for w in ["kisan", "kisaan", "farmer", "शेतकरी", "किसान", "kheti", "खेती"]):
            extracted["occupation"] = "farmer"
        elif any(w in text_lower for w in ["student", "vidyarthi", "विद्यार्थी", "छात्र", "college", "school"]):
            extracted["occupation"] = "student"
        elif any(w in text_lower for w in ["mazdoor", "worker", "मजदूर", "कामगार"]):
            extracted["occupation"] = "worker"
        elif any(w in text_lower for w in ["business", "vyapar", "dukaan", "स्वयंरोजगार"]):
            extracted["occupation"] = "self_employed"

        # District / State
        districts = {
            "pune": ("Pune", "Maharashtra"),
            "पुणे": ("Pune", "Maharashtra"),
            "पुण्या": ("Pune", "Maharashtra"),
            "mumbai": ("Mumbai", "Maharashtra"),
            "मुंबई": ("Mumbai", "Maharashtra"),
            "nagpur": ("Nagpur", "Maharashtra"),
            "नागपूर": ("Nagpur", "Maharashtra"),
            "नागपुरा": ("Nagpur", "Maharashtra"),
            "nashik": ("Nashik", "Maharashtra"),
            "नाशिक": ("Nashik", "Maharashtra"),
            "delhi": ("Delhi", "Delhi"),
            "दिल्ली": ("Delhi", "Delhi"),
            "patna": ("Patna", "Bihar"),
            "lucknow": ("Lucknow", "Uttar Pradesh")
        }
        for d_key, (dist, st) in districts.items():
            if d_key in text_lower:
                extracted["district"] = dist
                extracted["state"] = st
                break

        # Land holding hectares
        land_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:hectare|hector|हेक्टर|acre|एकड़)", text_lower)
        if land_match:
            try:
                extracted["land_holding_hectares"] = float(land_match.group(1))
            except Exception:
                pass
        elif "zameen" in text_lower or "land" in text_lower or "जमीन" in text_lower:
            num_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:zameen|land|जमीन)", text_lower)
            if num_match:
                try:
                    extracted["land_holding_hectares"] = float(num_match.group(1))
                except Exception:
                    pass

        # Income
        income_match = re.search(r"(?:income|aay|उत्पन्न|आय|kamata)\s*(?:hai|is|of)?\s*(?:rs|inr|₹)?\s*(\d+(?:,\d+)*)", text_lower)
        if income_match:
            try:
                raw_val = income_match.group(1).replace(",", "")
                extracted["annual_family_income"] = float(raw_val)
            except Exception:
                pass
        lakh_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:lakh|लाख)", text_lower)
        if lakh_match and extracted["annual_family_income"] is None:
            try:
                extracted["annual_family_income"] = float(lakh_match.group(1)) * 100000
            except Exception:
                pass

        # Education level
        if any(w in text_lower for w in ["graduate", "degree", "पदवी", "स्नातक", "b.a", "b.com", "b.sc", "btech"]):
            extracted["education_level"] = "graduate"
        elif any(w in text_lower for w in ["12th", "class 12", "12वीं", "बारावी"]):
            extracted["education_level"] = "class_12"
        elif any(w in text_lower for w in ["10th", "class 10", "10वीं", "दहावी"]):
            extracted["education_level"] = "class_10"

        # Caste category
        if any(w in text_lower for w in ["obc", "ओबीसी"]):
            extracted["caste_category"] = "obc"
        elif any(w in text_lower for w in ["sc", "अनुसूचित जाति"]):
            extracted["caste_category"] = "sc"
        elif any(w in text_lower for w in ["st", "अनुसूचित जनजाति", "आदिवासी"]):
            extracted["caste_category"] = "st"
        elif "general" in text_lower:
            extracted["caste_category"] = "general"

        return extracted

    def generate_json(self, system_prompt: str, user_prompt: str, max_retries: int = 1) -> Dict[str, Any]:
        """
        Executes prompt and returns parsed JSON.
        Retries once if response is invalid JSON.
        Falls back to heuristic mode if no API key is provided or API is unreachable.
        """
        has_groq = bool(self.groq_api_key and self.groq_api_key != "your_groq_api_key_here")
        has_gemini = bool(self.gemini_api_key and self.gemini_api_key != "your_gemini_api_key_here")

        if not (has_groq or has_gemini):
            # Offline / heuristic fallback mode
            return self._heuristic_extract_profile(user_prompt)

        for attempt in range(max_retries + 1):
            raw_content = ""
            try:
                if has_groq and self.default_provider == "groq":
                    raw_content = self._call_groq(system_prompt, user_prompt)
                elif has_gemini:
                    raw_content = self._call_gemini(system_prompt, user_prompt)
                elif has_groq:
                    raw_content = self._call_groq(system_prompt, user_prompt)

                # Strip markdown fences if present
                clean = raw_content.strip()
                if clean.startswith("```"):
                    clean = re.sub(r"^```(?:json)?\s*", "", clean)
                    clean = re.sub(r"\s*```$", "", clean)
                return json.loads(clean)
            except Exception as e:
                logger.warning(f"LLM JSON generation attempt {attempt + 1} failed: {e}")
                if attempt == max_retries:
                    # Final fallback to heuristic extractor
                    return self._heuristic_extract_profile(user_prompt)


llm_client = LLMClient()
