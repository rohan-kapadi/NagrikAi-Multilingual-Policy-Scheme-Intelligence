import json
from pathlib import Path
from typing import List, Optional, Dict
from backend.app.models import Scheme


SCHEMES_DIR = Path(__file__).resolve().parent.parent / "data" / "schemes"


def validate_multilingual_field(field_name: str, val: Dict[str, str], scheme_id: str) -> None:
    if not isinstance(val, dict):
        raise ValueError(f"Scheme '{scheme_id}': '{field_name}' must be a dictionary with multilingual strings.")
    for lang in ["en", "hi", "mr"]:
        if lang not in val or not str(val[lang]).strip():
            raise ValueError(f"Scheme '{scheme_id}': '{field_name}' is missing translation for '{lang}'.")


def load_scheme_from_file(path: Path) -> Scheme:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    scheme_id = data.get("id", path.stem)
    
    # Validate multilingual fields
    for field_name in ["name", "summary", "benefits"]:
        if field_name in data:
            validate_multilingual_field(field_name, data[field_name], scheme_id)
            
    # Validate criteria labels
    for c in data.get("criteria", []):
        if "label" in c:
            validate_multilingual_field("criterion.label", c["label"], scheme_id)

    # Validate exclusions labels
    for exc in data.get("exclusions", []):
        if "label" in exc:
            validate_multilingual_field("exclusion.label", exc["label"], scheme_id)

    # Validate required documents
    for doc in data.get("required_documents", []):
        validate_multilingual_field("required_document", doc, scheme_id)

    return Scheme.model_validate(data)


_cached_schemes: Optional[Dict[str, Scheme]] = None


def load_all_schemes(reload: bool = False) -> Dict[str, Scheme]:
    global _cached_schemes
    if _cached_schemes is not None and not reload:
        return _cached_schemes

    schemes: Dict[str, Scheme] = {}
    if SCHEMES_DIR.exists():
        for file in SCHEMES_DIR.glob("*.json"):
            scheme = load_scheme_from_file(file)
            schemes[scheme.id] = scheme

    _cached_schemes = schemes
    return _cached_schemes


def get_scheme_by_id(scheme_id: str) -> Optional[Scheme]:
    schemes = load_all_schemes()
    return schemes.get(scheme_id)


def filter_schemes(category: Optional[str] = None, state: Optional[str] = None) -> List[Scheme]:
    schemes = list(load_all_schemes().values())
    if category:
        category_lower = category.lower()
        schemes = [s for s in schemes if any(c.lower() == category_lower for c in s.category)]
    if state:
        state_lower = state.lower()
        schemes = [
            s for s in schemes
            if s.level == "central" or (s.state and s.state.lower() == state_lower)
        ]
    return schemes
