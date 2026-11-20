import json
import logging
import re
from typing import Dict, Any, Optional
import httpx
from backend.app.config import settings

logger = logging.getLogger("nagrik_llm")


class LLMClient:
    """
    Provider-agnostic LLM wrapper supporting Groq (primary) and Gemini (fallback).
    - JSON mode enforced
    - Single retry on parse failure
    - Deterministic heuristic fallback when no API key is configured
    - Temperature capped at ≤ 0.2 for extraction/explanation (project.md §11)
    """

    def __init__(self):
        self.groq_api_key = settings.GROQ_API_KEY
        self.gemini_api_key = settings.GEMINI_API_KEY
        self.default_provider = settings.DEFAULT_LLM_PROVIDER
        self.groq_model = settings.GROQ_MODEL
        self.gemini_model = settings.GEMINI_MODEL

    # ------------------------------------------------------------------ #
    #  Provider call methods                                               #
    # ------------------------------------------------------------------ #

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
            "temperature": min(temperature, 0.2),  # enforce ≤ 0.2
            "response_format": {"type": "json_object"},
            "max_tokens": 1024
        }
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    def _call_gemini(self, system_prompt: str, user_prompt: str, temperature: float = 0.1) -> str:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.gemini_model}:generateContent?key={self.gemini_api_key}"
        )
        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"parts": [{"text": user_prompt}]}],
            "generationConfig": {
                "temperature": min(temperature, 0.2),
                "response_mime_type": "application/json",
                "maxOutputTokens": 1024
            }
        }
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]

    def call_llm_text(self, system_prompt: str, user_prompt: str, temperature: float = 0.15) -> str:
        """
        Non-JSON call for free-form explanation text generation.
        Returns raw string (not parsed JSON).
        """
        has_groq = self._has_valid_key("groq")
        has_gemini = self._has_valid_key("gemini")

        if not (has_groq or has_gemini):
            return ""  # Caller handles empty string as fallback

        try:
            if has_groq and self.default_provider == "groq":
                # Groq with no json_object constraint for free text
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
                    "temperature": min(temperature, 0.2),
                    "max_tokens": 1500
                }
                with httpx.Client(timeout=20.0) as client:
                    resp = client.post(url, headers=headers, json=payload)
                    resp.raise_for_status()
                    return resp.json()["choices"][0]["message"]["content"]
            elif has_gemini:
                url = (
                    f"https://generativelanguage.googleapis.com/v1beta/models/"
                    f"{self.gemini_model}:generateContent?key={self.gemini_api_key}"
                )
                payload = {
                    "system_instruction": {"parts": [{"text": system_prompt}]},
                    "contents": [{"parts": [{"text": user_prompt}]}],
                    "generationConfig": {
                        "temperature": min(temperature, 0.2),
                        "maxOutputTokens": 1500
                    }
                }
                with httpx.Client(timeout=20.0) as client:
                    resp = client.post(url, json=payload)
                    resp.raise_for_status()
                    return resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            logger.error(f"LLM text call failed: {e}")
        return ""

    # ------------------------------------------------------------------ #
    #  Heuristic fallback (offline / no API key)                          #
    # ------------------------------------------------------------------ #

    def _heuristic_extract_profile(self, text: str) -> Dict[str, Any]:
        """
        Deterministic regex/rule fallback.
        Covers Hindi, Marathi, Hinglish, and English.
        Returns all unknown fields as None — no guessing.
        """
        text_lower = text.lower()
        extracted: Dict[str, Any] = {
            "age": None, "gender": None, "state": None, "district": None,
            "residence": None, "occupation": None, "annual_family_income": None,
            "caste_category": None, "land_holding_hectares": None,
            "education_level": None, "is_disabled": None, "is_bpl": None,
            "language": None
        }

        # --- Occupation ---
        if any(w in text_lower for w in ["kisan", "kisaan", "farmer", "शेतकरी", "किसान", "kheti", "खेती", "शेती"]):
            extracted["occupation"] = "farmer"
        elif any(w in text_lower for w in ["student", "vidyarthi", "विद्यार्थी", "छात्र", "college", "school", "padhta", "padh raha"]):
            extracted["occupation"] = "student"
        elif any(w in text_lower for w in ["mazdoor", "worker", "मजदूर", "कामगार", "labour", "labourer"]):
            extracted["occupation"] = "worker"
        elif any(w in text_lower for w in ["business", "vyapar", "dukaan", "व्यापार", "स्वयंरोजगार", "self employed"]):
            extracted["occupation"] = "self_employed"
        elif any(w in text_lower for w in ["unemployed", "berozgar", "बेरोजगार", "no job", "no work"]):
            extracted["occupation"] = "unemployed"

        # --- District / State ---
        districts = {
            "pune": ("Pune", "Maharashtra"),
            "पुणे": ("Pune", "Maharashtra"),
            "पुण्या": ("Pune", "Maharashtra"),
            "पुण्यात": ("Pune", "Maharashtra"),
            "पुण्याचा": ("Pune", "Maharashtra"),
            "पुण्याची": ("Pune", "Maharashtra"),
            "mumbai": ("Mumbai", "Maharashtra"),
            "मुंबई": ("Mumbai", "Maharashtra"),
            "nagpur": ("Nagpur", "Maharashtra"),
            "नागपूर": ("Nagpur", "Maharashtra"),
            "nashik": ("Nashik", "Maharashtra"),
            "नाशिक": ("Nashik", "Maharashtra"),
            "aurangabad": ("Chhatrapati Sambhajinagar", "Maharashtra"),
            "औरंगाबाद": ("Chhatrapati Sambhajinagar", "Maharashtra"),
            "delhi": ("Delhi", "Delhi"),
            "दिल्ली": ("Delhi", "Delhi"),
            "patna": ("Patna", "Bihar"),
            "पटना": ("Patna", "Bihar"),
            "lucknow": ("Lucknow", "Uttar Pradesh"),
            "लखनऊ": ("Lucknow", "Uttar Pradesh"),
            "jaipur": ("Jaipur", "Rajasthan"),
            "जयपुर": ("Jaipur", "Rajasthan"),
            "hyderabad": ("Hyderabad", "Telangana"),
            "bengaluru": ("Bengaluru", "Karnataka"),
            "bangalore": ("Bengaluru", "Karnataka"),
            "chennai": ("Chennai", "Tamil Nadu"),
            "kolkata": ("Kolkata", "West Bengal"),
        }
        for d_key, (dist, st) in districts.items():
            if d_key in text_lower:
                extracted["district"] = dist
                extracted["state"] = st
                break

        # --- Residence ---
        if any(w in text_lower for w in ["rural", "village", "gaon", "gram", "गाँव", "गांव", "खेडे", "ग्रामीण"]):
            extracted["residence"] = "rural"
        elif any(w in text_lower for w in ["urban", "city", "shahar", "शहर", "शहरी"]):
            extracted["residence"] = "urban"

        # --- Land holding ---
        land_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:hectare|hector|हेक्टर|ha\b|acre|एकड़|एकर)", text_lower)
        if land_match:
            try:
                extracted["land_holding_hectares"] = float(land_match.group(1))
            except Exception:
                pass
        else:
            # Try "zameen X hectare" or "X hectare zameen"
            zameen_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:hectare|hector|हेक्टर)", text_lower)
            if not zameen_match:
                zameen_match = re.search(r"(?:zameen|land|जमीन)\s*(\d+(?:\.\d+)?)", text_lower)
            if zameen_match:
                try:
                    extracted["land_holding_hectares"] = float(zameen_match.group(1))
                except Exception:
                    pass

        # --- Income ---
        # Try lakh first (more common in Indian context)
        lakh_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:lakh|लाख)", text_lower)
        if lakh_match:
            try:
                extracted["annual_family_income"] = float(lakh_match.group(1)) * 100000
            except Exception:
                pass
        else:
            income_match = re.search(
                r"(?:income|aay|उत्पन्न|आय|salary|earning)\s*(?:is|hai|of|=)?\s*(?:rs\.?|inr|₹)?\s*(\d[\d,]*)",
                text_lower
            )
            if income_match:
                try:
                    extracted["annual_family_income"] = float(income_match.group(1).replace(",", ""))
                except Exception:
                    pass

        # --- Education level ---
        if any(w in text_lower for w in ["postgraduate", "pg", "masters", "mtech", "mba", "msc", "ma ", "phd"]):
            extracted["education_level"] = "postgraduate"
        elif any(w in text_lower for w in ["graduate", "degree", "पदवी", "स्नातक", "b.a", "b.com", "b.sc", "btech", "ba ", "bsc ", "bcom"]):
            extracted["education_level"] = "graduate"
        elif any(w in text_lower for w in ["12th", "class 12", "class12", "12वीं", "बारावी", "hsc", "inter", "higher secondary"]):
            extracted["education_level"] = "class_12"
        elif any(w in text_lower for w in ["10th", "class 10", "class10", "10वीं", "दहावी", "ssc", "matriculation"]):
            extracted["education_level"] = "class_10"

        # --- Caste category ---
        if any(w in text_lower for w in ["obc", "ओबीसी", "other backward"]):
            extracted["caste_category"] = "obc"
        elif any(w in text_lower for w in [" sc ", "scheduled caste", "अनुसूचित जाति", "dalit"]):
            extracted["caste_category"] = "sc"
        elif any(w in text_lower for w in [" st ", "scheduled tribe", "अनुसूचित जनजाति", "आदिवासी", "tribal"]):
            extracted["caste_category"] = "st"
        elif any(w in text_lower for w in ["general category", "general caste", "open category", "unreserved"]):
            extracted["caste_category"] = "general"

        # --- BPL ---
        if any(w in text_lower for w in ["bpl", "below poverty", "गरीबी रेखा", "गरीब"]):
            extracted["is_bpl"] = True

        # --- Disability ---
        if any(w in text_lower for w in ["disabled", "divyang", "handicap", "differently abled", "दिव्यांग", "विकलांग"]):
            extracted["is_disabled"] = True

        # --- Age ---
        age_match = re.search(r"\b(\d{1,3})\s*(?:year|saal|sal|साल|वर्ष|वय)\b", text_lower)
        if age_match:
            try:
                age_val = int(age_match.group(1))
                if 1 <= age_val <= 120:
                    extracted["age"] = age_val
            except Exception:
                pass

        return extracted

    # ------------------------------------------------------------------ #
    #  Public methods                                                      #
    # ------------------------------------------------------------------ #

    def _has_valid_key(self, provider: str) -> bool:
        if provider == "groq":
            return bool(self.groq_api_key and self.groq_api_key not in ("", "your_groq_api_key_here"))
        if provider == "gemini":
            return bool(self.gemini_api_key and self.gemini_api_key not in ("", "your_gemini_api_key_here"))
        return False

    def generate_json(self, system_prompt: str, user_prompt: str, max_retries: int = 1) -> Dict[str, Any]:
        """
        Executes prompt → returns parsed JSON dict.
        On parse failure: retries once then falls back to heuristic extractor.
        On no API key: immediately falls back to heuristic extractor.
        """
        has_groq = self._has_valid_key("groq")
        has_gemini = self._has_valid_key("gemini")

        if not (has_groq or has_gemini):
            return self._heuristic_extract_profile(user_prompt)

        for attempt in range(max_retries + 1):
            try:
                if has_groq and self.default_provider == "groq":
                    raw = self._call_groq(system_prompt, user_prompt)
                elif has_gemini:
                    raw = self._call_gemini(system_prompt, user_prompt)
                else:
                    raw = self._call_groq(system_prompt, user_prompt)

                # Strip markdown code fences if LLM ignores JSON mode instruction
                clean = raw.strip()
                if clean.startswith("```"):
                    clean = re.sub(r"^```(?:json)?\s*", "", clean)
                    clean = re.sub(r"\s*```$", "", clean)
                return json.loads(clean)

            except Exception as e:
                logger.warning(f"LLM JSON attempt {attempt + 1}/{max_retries + 1} failed: {e}")
                if attempt == max_retries:
                    logger.warning("All LLM attempts failed; falling back to heuristic extractor.")
                    return self._heuristic_extract_profile(user_prompt)

        return self._heuristic_extract_profile(user_prompt)


# Module-level singleton — imported by other pipeline modules
llm_client = LLMClient()
